// src/services/ProviderService.js
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  updateDoc,
  getDoc,
  doc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

class ProviderService {
  constructor() {
    this.db = db;
  }

  // Helper method to ensure we're consistent in which collection we use
  getProvidersCollection() {
    return collection(this.db, "providers");
  }

  async testDirectProviderCreation(familyId, shouldDelete = false) {
    try {
      console.log("🧪 RUNNING DIRECT PROVIDER CREATION TEST");
      
      if (!familyId) {
        console.error("❌ No family ID provided for test");
        return false;
      }
      
      // List all collections in Firestore to help diagnose
      console.log("🔍 Checking available collections in Firestore");
      try {
        const { listCollections } = await import('firebase/firestore');
        const collections = await listCollections(this.db);
        console.log("📚 Available collections:", collections.map(c => c.id));
      } catch (listError) {
        console.warn("⚠️ Unable to list collections:", listError);
      }
      
      // Create test provider with timestamp to make it distinctive
      const timestamp = new Date().toISOString();
      const testProvider = {
        name: "Test Provider " + timestamp.substring(11, 19),
        type: "education",
        specialty: "Test Teacher (Keep This)",
        email: "test@example.com",
        notes: "Test provider created at " + timestamp,
        familyId: familyId
      };
      
      console.log("📝 Test provider data:", testProvider);
      
      // Use our consistent collection reference
      const providersRef = this.getProvidersCollection();
      console.log("📁 Using providers collection:", providersRef.path);
      
      const docRef = await addDoc(providersRef, {
        ...testProvider,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const providerId = docRef.id;
      console.log("✅ Test provider created with ID:", providerId);
      console.log("🔍 IMPORTANT: Look for this provider in Firestore collection 'providers' with ID:", providerId);
      
      // Verify creation
      const docSnapshot = await getDoc(doc(this.db, "providers", providerId));
      
      if (docSnapshot.exists()) {
        console.log("✅ Verified provider exists in Firestore");
        
        // Delete only if requested
        if (shouldDelete) {
          // Delete the test provider
          await deleteDoc(doc(this.db, "providers", providerId));
          console.log("🧹 Test provider cleaned up");
        } else {
          console.log("🔒 Test provider NOT deleted - you can find it in Firestore");
          console.log("🌟 Provider path: /providers/" + providerId);
        }
        
        // Force refresh the UI
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('provider-added'));
          window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('force-data-refresh'));
          }, 500);
        }
        
        return true;
      } else {
        console.error("❌ Provider verification failed");
        return false;
      }
    } catch (error) {
      console.error("❌ Test provider creation failed:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Process a provider creation request from chat
   * @param {string} message - The chat message
   * @param {string} familyId - The family ID
   * @returns {Promise<object>} The result of the operation
   */
  async processProviderFromChat(message, familyId) {
    try {
      console.log("🔄 Processing provider from chat:", { message: message.substring(0, 100), familyId });
      
      if (!familyId) {
        console.error("❌ No family ID provided for provider creation");
        return { success: false, error: "Family ID is required" };
      }
      
      // Extract provider details from message
      const providerDetails = this.extractProviderInfo(message);
      console.log("📋 Extracted provider details:", providerDetails);
      
      // Ensure we have a valid name
      if (!providerDetails.name || providerDetails.name === "Unknown Provider") {
        console.error("❌ Could not extract provider name from message");
        return { success: false, error: "Could not determine provider name" };
      }
      
      // Add the familyId to the provider data
      providerDetails.familyId = familyId;
      
      // Save the provider
      console.log("💾 Saving provider to database:", providerDetails);
      const result = await this.saveProvider(familyId, providerDetails);
      console.log("📥 Provider save result:", result);
      
      return {
        success: result.success,
        providerId: result.providerId,
        isNew: result.isNew,
        providerDetails
      };
    } catch (error) {
      console.error("❌ Error processing provider from chat:", error);
      return {
        success: false,
        error: error.message || "Error processing provider request"
      };
    }
  }

  /**
   * Extract provider details from a chat message
   * @param {string} message - The user's message
   * @returns {Object} Extracted provider information
   */
  extractProviderInfo(message) {
    // Initialize provider info object with default values
    const providerInfo = {
      name: null,
      type: 'medical',
      specialty: null,
      phone: null,
      email: null,
      address: null,
      notes: null
    };

    try {
      // Extract provider name - looking for patterns like "doctor [name]" or "add [name] to providers"
      const namePatterns = [
        /(?:doctor|dr\.?)\s+([a-z\s\.]+)/i,
        /add\s+(?:doctor|dr\.?)\s+([a-z\s\.]+)/i,
        /add\s+([a-z\s\.]+)\s+to\s+providers/i,
        /add\s+([a-z\s\.]+)\s+to\s+provider/i,
        /add\s+([a-z\s\.]+)\s+as\s+(?:a|our)\s+(?:doctor|dentist|provider)/i,
        /(?:teacher|instructor|provider)\s+([a-z\s\.]+)/i
      ];

      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          providerInfo.name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
          break;
        }
      }

      // Extract provider type/specialty
      if (message.toLowerCase().includes("teacher")) {
        providerInfo.type = "education";
        
        if (message.toLowerCase().includes("guitar")) {
          providerInfo.specialty = "Guitar Teacher";
        } else if (message.toLowerCase().includes("piano")) {
          providerInfo.specialty = "Piano Teacher";
        } else if (message.toLowerCase().includes("music")) {
          providerInfo.specialty = "Music Teacher";
        } else {
          providerInfo.specialty = "Teacher";
        }
      } else if (message.toLowerCase().includes("coach") || message.toLowerCase().includes("instructor")) {
        providerInfo.type = "activity";
        providerInfo.specialty = "Coach";
      } else {
        // Medical professionals
        const specialtyPatterns = [
          { pattern: /(?:dentist|dental)/i, label: 'Dentist' },
          { pattern: /(?:pediatrician|pediatric)/i, label: 'Pediatrician' },
          { pattern: /(?:therapist|therapy)/i, label: 'Therapist' },
          { pattern: /(?:optometrist|eye\s+doctor)/i, label: 'Optometrist' }
        ];

        for (const { pattern, label } of specialtyPatterns) {
          if (pattern.test(message)) {
            providerInfo.specialty = label;
            break;
          }
        }
      }

      // Extract email if present
      const emailMatch = message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
      if (emailMatch) {
        providerInfo.email = emailMatch[1];
      }
      
      // Extract phone if present
      const phoneMatch = message.match(/(?:\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
      if (phoneMatch) {
        providerInfo.phone = phoneMatch[0];
      }

      // Extract location information using a variety of patterns
      const locationPatterns = [
        /in\s+([a-z\s]+)(?:,|\.|$)/i,
        /at\s+([a-z\s]+)(?:,|\.|$)/i,
        /from\s+([a-z\s]+)(?:,|\.|$)/i,
      ];

      for (const pattern of locationPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          providerInfo.address = match[1].trim();
          break;
        }
      }

      // Extract notes (often come after "who" or appears after provider description)
      const notesPatterns = [
        /who\s+(.+)$/i,
        /(?:dentist|doctor|provider|teacher|coach)\s+(?:who|that)\s+(.+)$/i
      ];

      for (const pattern of notesPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          providerInfo.notes = match[1].trim();
          break;
        }
      }

      // If name is still null, try one more time with a broader pattern
      if (!providerInfo.name) {
        const fullNamePattern = /([A-Z][a-z]+(?: [A-Z][a-z]+)*)/;
        const match = message.match(fullNamePattern);
        if (match && match[1]) {
          providerInfo.name = match[1];
        } else {
          providerInfo.name = "Unknown Provider";
        }
      }

      return providerInfo;
    } catch (error) {
      console.error("Error extracting provider info:", error);
      return {
        name: "Unknown Provider",
        type: "medical",
        specialty: "",
        email: "",
        phone: "",
        address: "",
        notes: message // Use original message as notes
      };
    }
  }

  /**
   * Add or update a provider in the database
   * @param {string} familyId - Family ID
   * @param {Object} providerData - Provider information
   * @returns {Promise<Object>} Result with provider ID
   */
  async saveProvider(familyId, providerData) {
    try {
      if (!familyId) {
        console.error("❌ No family ID provided");
        return { success: false, error: "Family ID is required" };
      }

      if (!providerData || !providerData.name) {
        console.error("❌ No provider name provided");
        return { success: false, error: "Provider name is required" };
      }

      console.log("💾 SAVING PROVIDER TO DATABASE");
      console.log("📝 Input data:", {
        familyId,
        provider: {
          name: providerData.name,
          type: providerData.type || "medical",
          specialty: providerData.specialty || "",
          email: providerData.email || ""
        }
      });

      // Prepare provider data with required fields
      const providerToAdd = {
        ...providerData,
        name: providerData.name,
        type: providerData.type || "medical",
        familyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Get both collection references - using providers as primary
      const providersRef = this.getProvidersCollection();
      const familyProvidersRef = collection(this.db, "familyProviders");

      console.log("📁 Using providers collection as primary:", providersRef.path);

      // IMPROVED: Add more detailed logging
      console.log("📤 Sending data to Firebase:", JSON.stringify(providerToAdd, null, 2));

      // First, ensure the data is written to providers collection (primary)
      let docRef;
      try {
        docRef = await addDoc(providersRef, providerToAdd);
        console.log(`✅ Provider added successfully to providers collection with ID: ${docRef.id}`);
      } catch (error) {
        console.error("❌ Error adding to providers collection:", error);
        throw error; // Re-throw to be caught by the outer try/catch
      }

      const providerId = docRef.id;

      // Then also write to familyProviders as backup - but don't block on failure
      try {
        await addDoc(familyProvidersRef, {
          ...providerToAdd,
          mirrorOf: providerId, // Track that this is a mirror of the main provider
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log("✅ Successfully added provider to familyProviders collection");
      } catch (mirrorError) {
        console.error("⚠️ Failed to add to familyProviders (non-critical):", mirrorError);
        // Continue even if this fails - the primary record in providers exists
      }

      // IMPROVED: Verify the data was actually written - using providers collection
      const docSnapshot = await getDoc(doc(this.db, "providers", providerId));
      console.log("✅ Verified provider exists in Firebase:", docSnapshot.exists());

      // Trigger UI updates with added confirmation
      if (typeof window !== 'undefined') {
        try {
          console.log("🔔 Dispatching provider-added event");
          window.dispatchEvent(new CustomEvent('provider-added', {
            detail: {
              providerId,
              providerName: providerData.name,
              providerType: providerData.type,
              isNew: true
            }
          }));

          // Force additional refreshes for good measure
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
            window.dispatchEvent(new CustomEvent('force-data-refresh'));
          }, 500);

          console.log("✅ UI update events dispatched successfully");
        } catch (eventError) {
          console.error("⚠️ Error dispatching UI events (non-critical):", eventError);
          // Don't fail the operation if UI events fail
        }
      }

      return {
        success: true,
        providerId,
        isNew: true,
        provider: providerToAdd
      };
    } catch (error) {
      // IMPROVED: More detailed error logging
      console.error("❌ Error saving provider:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });

      // IMPROVED: Send event to notify about error
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('provider-save-error', {
          detail: {
            error: error.message
          }
        }));
      }

      return {
        success: false,
        error: error.message || "Unknown error"
      };
    }
  }
  

  /**
   * Delete a provider from the database
   * @param {string} familyId - Family ID
   * @param {string} providerId - Provider ID to delete
   * @returns {Promise<Object>} Result with success status
   */
  async deleteProvider(familyId, providerId) {
    try {
      if (!familyId || !providerId) {
        console.error("Missing familyId or providerId in deleteProvider");
        return { success: false, error: "Family ID and Provider ID are required" };
      }
      
      console.log(`Deleting provider ${providerId} for family ${familyId}`);

      // Delete from Firestore - use providers collection for consistency
      await deleteDoc(doc(this.db, "providers", providerId));
      
      console.log("Provider deleted successfully");
      
      // Dispatch events to update UI components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('provider-added'));
        window.dispatchEvent(new CustomEvent('force-data-refresh'));
        
        // Add delayed refresh to ensure UI updates
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
        }, 500);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting provider:", error);
      return { success: false, error: error.message };
    }
  }


  /**
   * Get all providers for a family
   * @param {string} familyId - Family ID
   * @returns {Promise<Array>} Array of providers
   */
  async getProviders(familyId) {
    try {
      if (!familyId) {
        console.error("❌ No familyId provided to getProviders");
        return [];
      }

      console.log(`🔍 Getting providers for family: ${familyId}`);

      // Prepare arrays to store providers
      const providers = [];
      const providerNames = new Set(); // Track names to prevent duplicates

      // First check the primary "providers" collection
      try {
        const providersRef = this.getProvidersCollection();
        const q = query(
          providersRef,
          where("familyId", "==", familyId)
        );

        const querySnapshot = await getDocs(q);

        // Process providers from primary collection
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          providers.push({
            id: doc.id,
            ...data,
            source: "providers"
          });

          // Track name for deduplication
          if (data.name) {
            providerNames.add(data.name.toLowerCase());
          }
        });

        console.log(`✅ Retrieved ${providers.length} providers from primary "providers" collection`);
      } catch (error) {
        console.error("⚠️ Error querying primary providers collection:", error);
      }

      // For backward compatibility, also check "familyProviders" collection
      try {
        const familyProvidersRef = collection(this.db, "familyProviders");
        const q = query(
          familyProvidersRef,
          where("familyId", "==", familyId)
        );

        const querySnapshot = await getDocs(q);
        const beforeCount = providers.length;

        // Only add providers that don't already exist in our results (by name)
        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Skip if name is missing
          if (!data.name) return;

          // Check if this provider already exists by name (case insensitive)
          if (!providerNames.has(data.name.toLowerCase())) {
            providers.push({
              id: doc.id,
              ...data,
              source: "familyProviders"
            });
            providerNames.add(data.name.toLowerCase());
          }
        });

        // Log how many additional providers were found
        const addedCount = providers.length - beforeCount;
        if (addedCount > 0) {
          console.log(`✅ Added ${addedCount} additional providers from "familyProviders" collection`);
        }

        console.log(`✅ Total unique providers found: ${providers.length}`);
      } catch (error) {
        console.error("⚠️ Error querying familyProviders collection:", error);
      }

      // Sort providers by name for consistency
      providers.sort((a, b) => {
        if (!a.name) return 1;
        if (!b.name) return -1;
        return a.name.localeCompare(b.name);
      });

      return providers;
    } catch (error) {
      console.error("❌ Error getting providers:", error);
      return [];
    }
  }
}

export default new ProviderService();