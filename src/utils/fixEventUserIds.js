import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Fix events that have userId: "undefined" by assigning them to the correct user
 * based on the Google Calendar sync data
 */
export async function fixEventUserIds(familyId, primaryUserId) {
  console.log('🔧 Starting to fix events with undefined userId...');
  console.log('Family ID:', familyId);
  console.log('Primary User ID:', primaryUserId);
  
  try {
    // Query for events with userId: "undefined" in this family
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('familyId', '==', familyId),
      where('userId', '==', 'undefined')
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} events with undefined userId`);
    
    if (querySnapshot.empty) {
      console.log('✅ No events need fixing!');
      return { success: true, fixed: 0 };
    }
    
    // Update each event with the correct userId
    const updates = [];
    querySnapshot.forEach((docSnapshot) => {
      const eventData = docSnapshot.data();
      console.log(`Fixing event: ${eventData.title} (${docSnapshot.id})`);
      
      // Update the event with the primary user ID
      const eventRef = doc(db, 'events', docSnapshot.id);
      const updatePromise = updateDoc(eventRef, {
        userId: primaryUserId,
        updatedAt: new Date().toISOString(),
        fixedBy: 'fixEventUserIds-utility'
      });
      
      updates.push(updatePromise);
    });
    
    // Execute all updates
    await Promise.all(updates);
    
    console.log(`✅ Successfully fixed ${updates.length} events!`);
    
    // Verify the fix by checking if any undefined events remain
    const verifyQuery = query(
      eventsRef,
      where('familyId', '==', familyId),
      where('userId', '==', 'undefined')
    );
    const verifySnapshot = await getDocs(verifyQuery);
    
    if (verifySnapshot.empty) {
      console.log('✅ Verification successful: No more events with undefined userId');
    } else {
      console.warn(`⚠️ ${verifySnapshot.size} events still have undefined userId`);
    }
    
    return {
      success: true,
      fixed: updates.length,
      remaining: verifySnapshot.size
    };
    
  } catch (error) {
    console.error('❌ Error fixing event userIds:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Alternative: Assign events to family members based on attendees or other criteria
 */
export async function smartFixEventUserIds(familyId, familyMembers) {
  console.log('🔧 Smart fix: Assigning events based on attendees...');
  
  try {
    // Get all events with undefined userId
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('familyId', '==', familyId),
      where('userId', '==', 'undefined')
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} events to process`);
    
    const updates = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const eventData = docSnapshot.data();
      let assignedUserId = null;
      
      // Try to match by attendee email
      if (eventData.attendees && eventData.attendees.length > 0) {
        for (const attendee of eventData.attendees) {
          const member = familyMembers.find(m => 
            m.email && attendee.email && 
            m.email.toLowerCase() === attendee.email.toLowerCase()
          );
          if (member) {
            assignedUserId = member.id;
            console.log(`Matched event "${eventData.title}" to ${member.name} by email`);
            break;
          }
        }
      }
      
      // If no match found, assign to the first adult/parent in the family
      if (!assignedUserId) {
        const parent = familyMembers.find(m => 
          m.role === 'parent' || m.role === 'adult'
        ) || familyMembers[0];
        
        if (parent) {
          assignedUserId = parent.id;
          console.log(`Assigned event "${eventData.title}" to ${parent.name} (default parent)`);
        }
      }
      
      if (assignedUserId) {
        const eventRef = doc(db, 'events', docSnapshot.id);
        const updatePromise = updateDoc(eventRef, {
          userId: assignedUserId,
          updatedAt: new Date().toISOString(),
          fixedBy: 'smartFixEventUserIds-utility'
        });
        updates.push(updatePromise);
      }
    });
    
    await Promise.all(updates);
    console.log(`✅ Successfully fixed ${updates.length} events with smart assignment!`);
    
    return {
      success: true,
      fixed: updates.length
    };
    
  } catch (error) {
    console.error('❌ Error in smart fix:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  window.fixEventUserIds = fixEventUserIds;
  window.smartFixEventUserIds = smartFixEventUserIds;
}