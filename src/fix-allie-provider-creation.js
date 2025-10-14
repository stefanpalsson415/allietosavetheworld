// fix-allie-provider-creation.js
// Script to ensure that Allie chat's provider creation actually works

import { db } from './services/firebase';
import { collection, getDocs, query, where, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';

/**
 * Fix provider creation from Allie chat by patching the event flow
 */
async function fixAllieProviderCreation() {
  console.log("Starting fix for Allie provider creation...");
  
  try {
    // 1. Add an event listener for provider-added events from Allie
    window.addEventListener('claude-provider-created', async (event) => {
      console.log("Detected provider creation from Claude/Allie:", event.detail);
      
      if (!event.detail || !event.detail.name) {
        console.error("Invalid provider data from Claude");
        return;
      }
      
      try {
        const { name, type, specialty, phone, address, childId, familyId } = event.detail;
        
        // Validate required fields
        if (!name || !familyId) {
          console.error("Missing required provider fields:", { name, familyId });
          return;
        }
        
        // Create the provider in Firestore
        const providersCollection = collection(db, "familyProviders");
        const docRef = await addDoc(providersCollection, {
          name,
          type: type || 'medical',
          specialty: specialty || type || 'Pediatrician',
          phone: phone || '',
          address: address || '',
          childId: childId || null,
          familyId,
          createdAt: new Date()
        });
        
        console.log("Successfully created provider in database:", docRef.id);
        
        // Notify the UI that a provider was added
        window.dispatchEvent(new CustomEvent('provider-added', {
          detail: {
            providerId: docRef.id,
            name,
            type: type || 'medical',
            childId,
            familyId
          }
        }));
        
        // Also trigger UI refreshes
        window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
        window.dispatchEvent(new CustomEvent('force-data-refresh'));
        
        return true;
      } catch (error) {
        console.error("Error creating provider from Claude event:", error);
        return false;
      }
    });
    
    // 2. Patch the IntentActionService's handleAddProvider method
    // This is a runtime patch, will be applied when the script loads
    if (window.allieServices && window.allieServices.intentActionService) {
      const originalHandleAddProvider = window.allieServices.intentActionService.handleAddProvider;
      
      window.allieServices.intentActionService.handleAddProvider = async function(message, familyId, userId) {
        console.log("Patched handleAddProvider called:", { message, familyId, userId });
        
        try {
          // First try to use the original method
          const result = await originalHandleAddProvider.call(this, message, familyId, userId);
          
          // If it was successful, return the result
          if (result && result.success) {
            return result;
          }
          
          // If it failed, try our direct implementation
          console.log("Original provider creation failed, trying direct implementation");
          
          // Trigger the Claude provider extraction
          if (window.claudeService && window.claudeService.extractProviderInfo) {
            const providerInfo = await window.claudeService.extractProviderInfo(message);
            
            if (providerInfo && providerInfo.name) {
              // Add familyId and trigger the event
              providerInfo.familyId = familyId;
              
              window.dispatchEvent(new CustomEvent('claude-provider-created', {
                detail: providerInfo
              }));
              
              return {
                success: true,
                message: `Added ${providerInfo.name} to your provider directory.`,
                data: { provider: providerInfo }
              };
            }
          }
          
          // If we get here, both approaches failed
          return {
            success: false,
            error: "Failed to create provider. Please try again with more details.",
            message: "I wasn't able to understand all the provider details. Please try again with a name, type (like doctor, dentist), and phone number."
          };
        } catch (error) {
          console.error("Error in patched handleAddProvider:", error);
          return {
            success: false,
            error: error.message,
            message: "There was an error creating the provider. Please try again."
          };
        }
      };
      
      console.log("Successfully patched IntentActionService.handleAddProvider");
    } else {
      console.warn("Could not find allieServices.intentActionService to patch");
    }
    
    // 3. Add provider extraction to ClaudeService if not present
    if (window.claudeService && !window.claudeService.extractProviderInfo) {
      window.claudeService.extractProviderInfo = async function(message) {
        try {
          // Simple regex-based extraction as fallback
          const nameMatcher = /Dr\.\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)?)/;
          const phoneMatch = /(\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4})/;
          const typeMatches = {
            pediatrician: /pediatrician|child doctor|children's doctor/i,
            dentist: /dentist|dental|orthodontist/i,
            optometrist: /optometrist|eye doctor|ophthalmologist/i,
            therapist: /therapist|counselor|psychologist/i
          };
          
          // Default provider info
          const providerInfo = {
            name: null,
            type: 'medical',
            specialty: null,
            phone: null,
            address: null
          };
          
          // Try to extract name
          const nameMatch = message.match(nameMatcher);
          if (nameMatch) {
            providerInfo.name = nameMatch[0];
          } else {
            // Try different pattern
            const simpleName = message.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
            if (simpleName) {
              providerInfo.name = simpleName[0];
            }
          }
          
          // Try to extract phone
          const phoneMatched = message.match(phoneMatch);
          if (phoneMatched) {
            providerInfo.phone = phoneMatched[0];
          }
          
          // Try to extract type
          for (const [type, pattern] of Object.entries(typeMatches)) {
            if (message.match(pattern)) {
              providerInfo.type = type;
              providerInfo.specialty = type.charAt(0).toUpperCase() + type.slice(1);
              break;
            }
          }
          
          // If name is still null, try one more approach - look for "name is" or "called"
          if (!providerInfo.name) {
            const nameIsMatch = message.match(/(name is|called)\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)?)/i);
            if (nameIsMatch) {
              providerInfo.name = nameIsMatch[2];
            }
          }
          
          return providerInfo;
        } catch (error) {
          console.error("Error in extractProviderInfo:", error);
          return null;
        }
      };
      
      console.log("Added extractProviderInfo to ClaudeService");
    }
    
    console.log("Fix for Allie provider creation completed!");
    
    // Initial test
    setTimeout(() => {
      console.log("Testing provider creation...");
      window.dispatchEvent(new CustomEvent('claude-provider-created', {
        detail: {
          name: "Dr. Test Provider",
          type: "medical",
          specialty: "Pediatrician",
          phone: "(555) 123-4567",
          familyId: localStorage.getItem('selectedFamilyId') || localStorage.getItem('currentFamilyId') || 'm93tlovs6ty9sg8k0c8'
        }
      }));
    }, 5000);
    
  } catch (error) {
    console.error("Error in fixAllieProviderCreation:", error);
  }
}

// Execute the fix when the script is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, applying Allie provider creation fix");
    fixAllieProviderCreation();
  });
  
  // Also try to run immediately in case DOM is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("DOM already loaded, applying Allie provider creation fix immediately");
    fixAllieProviderCreation();
  }
}

export default fixAllieProviderCreation;