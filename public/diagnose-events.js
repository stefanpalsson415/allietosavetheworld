// Diagnostic tool for event system
console.log('🔍 Starting event system diagnosis...');

// Import Firebase
import { db } from './src/services/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function diagnoseEvents() {
  try {
    // Get current user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const familyId = localStorage.getItem('selectedFamilyId');
    
    console.log('👤 Current user:', user.email || 'Not logged in');
    console.log('👨‍👩‍👧‍👦 Family ID:', familyId || 'No family selected');
    
    if (!familyId) {
      console.error('❌ No family selected! This is why events aren\'t loading.');
      return;
    }
    
    // Check events collection
    console.log('\n📅 Checking events in database...');
    
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('familyId', '==', familyId));
    const snapshot = await getDocs(q);
    
    console.log(`Found ${snapshot.size} events for family ${familyId}`);
    
    if (snapshot.size > 0) {
      console.log('\n📋 Event details:');
      snapshot.forEach(doc => {
        const event = doc.data();
        console.log(`- ${event.title || 'Untitled'}`, {
          id: doc.id,
          date: event.dateTime || event.start?.dateTime || event.date,
          attendees: event.attendees?.length || 0
        });
      });
    }
    
    // Check which contexts are working
    console.log('\n🔧 Checking event contexts...');
    
    // Check window for context references
    const contexts = {
      EventContext: window.__eventContext,
      NewEventContext: window.__newEventContext,
      UnifiedEventContext: window.__unifiedEventContext
    };
    
    Object.entries(contexts).forEach(([name, context]) => {
      if (context) {
        console.log(`✅ ${name} is available`);
        if (context.events) {
          console.log(`  - Has ${context.events.length} events loaded`);
        }
      } else {
        console.log(`❌ ${name} is not available`);
      }
    });
    
  } catch (error) {
    console.error('Error during diagnosis:', error);
  }
}

// Run diagnosis
diagnoseEvents();