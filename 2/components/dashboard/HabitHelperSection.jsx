import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import HabitHelperService from '../../services/HabitHelperService';
import UserAvatar from '../common/UserAvatar';

const HabitHelperSection = ({ 
  habit, 
  familyMembers, 
  currentUser, 
  familyId, 
  onHabitUpdate 
}) => {
  const [showHelperModal, setShowHelperModal] = useState(false);
  const [localHelper, setLocalHelper] = useState(null);
  
  // Load any saved habit helper from localStorage on component mount
  useEffect(() => {
    if (!habit?.id) return;
    
    try {
      const localDataStr = localStorage.getItem('habitHelperAssignments');
      if (!localDataStr) return;
      
      const localData = JSON.parse(localDataStr);
      
      // Check if this habit has a saved helper
      if (localData && localData[habit.id]) {
        const savedHelper = localData[habit.id];
        console.log(`Found saved helper for habit ${habit.id} in localStorage:`, savedHelper);
        
        // If the habit already has a helper set, don't override it
        if (!habit.helperChild) {
          // Find the child in family members to get their details
          const childId = savedHelper.childId;
          const childData = familyMembers.find(m => m.id === childId);
          
          if (childData) {
            console.log("Setting local helper from localStorage:", childData.name);
            setLocalHelper({
              id: childId,
              data: childData,
              role: savedHelper.role || getHelperRole(childData.age, habit)
            });
            
            // Also update parent component if callback provided
            if (onHabitUpdate) {
              const updatedHabit = {
                ...habit,
                helperChild: childId,
                helperRole: savedHelper.role || getHelperRole(childData.age, habit),
                helperName: childData.name,
                _loadedFromLocal: true
              };
              
              onHabitUpdate(updatedHabit);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading helper from localStorage:", error);
    }
  }, [habit?.id, familyMembers]);

  // Helper function to determine appropriate role based on child's age
  const getHelperRole = (age, habit) => {
    // Default roles if age is not available
    if (!age) return "Helps with reminders";
    
    // Age-appropriate helper roles
    if (age < 8) {
      // Ages 4-7: Simple, fun helper roles
      if (habit?.title?.includes("Calendar") || habit?.title?.includes("Planning")) 
        return "Rings the reminder bell";
      else if (habit?.title?.includes("Tidy") || habit?.title?.includes("Clean")) 
        return "Helps collect items";
      else
        return "Cheers when completed";
    } else if (age < 13) {
      // Ages 8-12: More collaborative roles
      if (habit?.title?.includes("Calendar") || habit?.title?.includes("Planning")) 
        return "Reminds before habit time";
      else if (habit?.title?.includes("Tidy") || habit?.title?.includes("Clean")) 
        return "Helps organize the space";
      else
        return "Checks in and celebrates progress";
    } else {
      // Ages 13-17: Accountability partner roles
      if (habit?.title?.includes("Calendar") || habit?.title?.includes("Planning")) 
        return "Sends reminder messages";
      else if (habit?.title?.includes("Tidy") || habit?.title?.includes("Clean")) 
        return "Takes on specific part of the task";
      else
        return "Provides supportive accountability";
    }
  };

  // Function to assign a child as a habit helper
  const assignChildToHabit = async (childId) => {
    console.log("assignChildToHabit called with childId:", childId);
    console.log("Current habit:", habit);
    console.log("familyId:", familyId);
    
    // Always track assignment attempts in localStorage for redundancy
    try {
      // Get existing helper assignments
      const existingData = localStorage.getItem('habitHelperAssignments');
      const assignments = existingData ? JSON.parse(existingData) : {};
      
      // Add this assignment
      assignments[habit.id] = {
        childId,
        familyId,
        timestamp: new Date().toISOString(),
        habitTitle: habit.title
      };
      
      // Save back to localStorage
      localStorage.setItem('habitHelperAssignments', JSON.stringify(assignments));
      console.log("Saved helper assignment to localStorage as backup");
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
    
    if (!habit?.id || !childId || !familyId) {
      console.error("Missing required data:", { 
        "habit?.id": habit?.id, 
        "childId": childId, 
        "familyId": familyId 
      });
      return;
    }
    
    try {
      // Find the child to get age info
      const helperChild = familyMembers.find(m => m.id === childId);
      console.log("Found helper child:", helperChild);
      const helperRole = getHelperRole(helperChild?.age, habit);
      
      // Update in database
      try {
        console.log("Updating database with:", { 
          familyId, 
          habitId: habit.id,
          childId,
          helperRole
        });
        
        // Extra validation for database paths
        if (familyId.includes('/') || habit.id.includes('/')) {
          console.error("Invalid characters in IDs:", { familyId, habitId: habit.id });
          alert("Invalid characters in database IDs. Cannot assign helper.");
          return;
        }
        
        // Using our new service that will try multiple database strategies
        console.log("Attempting to assign helper using HabitHelperService...");
        
        // Log habit details for debugging
        console.log("Habit details:", {
          id: habit.id,
          title: habit.title,
          format: typeof habit.id
        });
        
        try {
          // HabitHelperService will try multiple paths/strategies to update the habit
          const result = await HabitHelperService.assignChildToHabit(
            familyId, 
            habit.id, 
            childId, 
            helperRole
          );
          
          console.log("Successfully updated habit using strategy:", result.strategy);
        } catch (error) {
          console.error("HabitHelperService failed to update habit:", error);
          throw error;
        }
        
        console.log("Database update successful");
      } catch (dbError) {
        console.error("Error updating database:", dbError);
        alert("Failed to update habit in database. Falling back to local state update only.");
        
        // Instead of exiting early, we'll continue but just update the local state
        // This way at least the UI will show the change even if the database update failed
      }
      
      // Close the modal
      setShowHelperModal(false);
      
      // Create the updated habit object
      const updatedHabit = {
        ...habit,
        helperChild: childId,
        helperRole: helperRole,
        helperName: familyMembers.find(m => m.id === childId)?.name || "Helper",
        lastUpdated: new Date().toISOString()
      };
      
      // Update parent component
      if (onHabitUpdate) {
        console.log("Updating parent component with:", updatedHabit);
        onHabitUpdate(updatedHabit);
      }
      
      // Force UI update by also updating our local currentHelper reference
      // This ensures the UI shows the new helper even if the database update failed
      console.log("Updating UI to show new helper:", updatedHabit.helperChild);
      
      // Notify the child via Allie Chat - fixed the arguments here
      console.log("About to notify child about habit assignment");
      notifyChildAboutHabit(childId, helperChild, helperRole);
      
    } catch (error) {
      console.error("Error assigning child to habit:", error);
    }
  };
  
  // Function to notify a child about being assigned as a habit helper
  const notifyChildAboutHabit = async (childId, child, helperRole) => {
    console.log("notifyChildAboutHabit called with:", { childId, child, helperRole });
    
    try {
      if (!child || !habit) {
        console.error("Missing data for notification:", { child, habit });
        return;
      }
      
      const parentName = currentUser?.displayName || "Your parent";
      
      // Create age-appropriate message
      let message = "";
      if (child.age < 8) {
        // For younger children (4-7): Simple, fun message
        message = `Hey ${child.name}! ${parentName} needs your help with their habit: "${habit.title}". You can be their special helper by ${helperRole.toLowerCase()}. It's like being a superhero for your family!`;
      } else if (child.age < 13) {
        // For middle children (8-12): More detailed, encouraging
        message = `Hi ${child.name}, ${parentName} has asked for your help with their habit: "${habit.title}". As their helper, you can ${helperRole.toLowerCase()}. This is a great way to support your family and learn about building good habits together!`;
      } else {
        // For teenagers (13-17): Mature, peer-like
        message = `${child.name}, ${parentName} has assigned you as their accountability partner for "${habit.title}". Your role is to ${helperRole.toLowerCase()}. Thanks for helping build stronger family habits - your support makes a difference.`;
      }
      
      // Add the message to the database for Allie Chat
      try {
        console.log("Sending notification to Allie Chat...");
        const chatRef = doc(db, 'families', familyId, 'members', childId, 'messages', `habit_${habit.id}`);
        
        await setDoc(chatRef, {
          sender: 'allie',
          text: message,
          timestamp: serverTimestamp(),
          type: 'habit_helper',
          habitId: habit.id,
          parentId: currentUser?.uid,
          read: false
        });
        
        console.log("Notification sent successfully");
      } catch (chatError) {
        console.error("Error sending chat notification:", chatError);
        // Continue even if notification fails - the helper is still assigned
      }
      
    } catch (error) {
      console.error("Error notifying child about habit:", error);
    }
  };

  // Get children from family members (exclude parents)
  const children = familyMembers?.filter(member => member.role === 'child') || [];
  
  // Find the currently assigned helper, checking both habit.helperChild and localHelper
  const currentHelper = (() => {
    // First check if habit has a helper assigned from Firebase
    if (habit?.helperChild) {
      return familyMembers?.find(m => m.id === habit.helperChild);
    }
    
    // If no Firebase helper but we have a local helper, use that
    if (localHelper) {
      return localHelper.data;
    }
    
    return null;
  })();

  // Show for all users' habits, not just parents
  // Uncomment this if you want to restrict to parents only
  /*
  if (currentUser?.role !== 'parent') {
    return null;
  }
  */

  return (
    <>
      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <h5 className="font-medium text-sm">Habit Helper</h5>
          <button 
            onClick={() => setShowHelperModal(true)}
            className="text-xs flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            {habit.helperChild ? "Change Helper" : "Add Helper"}
          </button>
        </div>
        
        {(habit.helperChild || localHelper) ? (
          <div className="bg-indigo-50 p-3 rounded-lg flex items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-200 mr-3">
              <UserAvatar 
                user={currentHelper || {
                  id: habit.helperChild || localHelper?.id,
                  name: habit.helperName || currentHelper?.name || localHelper?.data?.name || "Helper",
                  role: "child"
                }} 
                size={40}
              />
            </div>
            <div>
              <p className="font-medium">
                {currentHelper?.name || habit.helperName || localHelper?.data?.name || "Helper"} is your Habit Helper
                {habit._tempUpdate && <span className="text-xs text-indigo-600 ml-2">(Saving...)</span>}
                {habit._loadedFromLocal && <span className="text-xs text-indigo-600 ml-2">(Local Cache)</span>}
              </p>
              <p className="text-xs text-gray-600">
                {habit.helperRole || 
                 localHelper?.role ||
                 (currentHelper ? getHelperRole(currentHelper.age, habit) : "Helps with your habit")}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-center text-gray-500">
            No habit helper assigned yet. Your kids can help you build this habit!
          </div>
        )}
      </div>

      {/* Helper Selection Modal */}
      {showHelperModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Choose a Habit Helper</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a child to help you with your habit "{habit.title}". They'll receive a message from Allie about being your helper.
            </p>
            
            {children.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto my-4">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => {
                      console.log(`Clicked on child: ${child.name}`);
                      
                      // Close the modal immediately for better user experience
                      setShowHelperModal(false);
                      
                      // Show temporary UI update right away
                      const selectedHelper = familyMembers.find(m => m.id === child.id);
                      if (onHabitUpdate && selectedHelper) {
                        // Update the parent UI right away with a temporary update
                        // This will at least show something even if the database update fails
                        const tempUpdate = {
                          ...habit,
                          helperChild: child.id,
                          helperRole: getHelperRole(selectedHelper.age, habit),
                          _tempUpdate: true // Mark this as a temporary update
                        };
                        onHabitUpdate(tempUpdate);
                      }
                      
                      // Now try the actual database update
                      setTimeout(() => {
                        assignChildToHabit(child.id).catch(error => {
                          console.error("Failed to assign helper:", error);
                        });
                      }, 100);
                    }}
                    className="w-full text-left flex items-center p-3 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-100 mr-3">
                      <UserAvatar user={child} size={40} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{child.name}</p>
                      <p className="text-xs text-gray-600">
                        {getHelperRole(child.age, habit)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No children found in your family. Add family members to assign helpers.
              </div>
            )}
            
            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setShowHelperModal(false)}
                className="px-4 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HabitHelperSection;