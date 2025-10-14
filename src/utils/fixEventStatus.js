// Utility to fix existing events missing the status field
// Call this from browser console or a component

import { db } from '../services/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function fixEventStatus() {
  try {
    console.log('🔧 Checking for events missing status field...');
    
    // Get all events
    const eventsRef = collection(db, 'events');
    const snapshot = await getDocs(eventsRef);
    
    let fixedCount = 0;
    let totalCount = 0;
    const eventsToFix = [];
    
    snapshot.forEach((eventDoc) => {
      totalCount++;
      const eventData = eventDoc.data();
      
      // Check if status field is missing
      if (!eventData.status) {
        eventsToFix.push({
          id: eventDoc.id,
          title: eventData.title || eventData.summary || 'Untitled'
        });
      }
    });
    
    console.log(`Found ${eventsToFix.length} events missing status field out of ${totalCount} total events`);
    
    // Fix each event
    for (const event of eventsToFix) {
      console.log(`Fixing event: ${event.title}`);
      
      // Update the event with status: 'active'
      await updateDoc(doc(db, 'events', event.id), {
        status: 'active'
      });
      
      fixedCount++;
    }
    
    console.log(`✅ Fixed ${fixedCount} events`);
    console.log('All events now have status field and will appear on calendar');
    
    // Dispatch event to refresh calendar
    window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
    
    return {
      success: true,
      fixed: fixedCount,
      total: totalCount
    };
    
  } catch (error) {
    console.error('❌ Error fixing event status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Also export as a window function for easy console access
if (typeof window !== 'undefined') {
  window.fixEventStatus = fixEventStatus;
}