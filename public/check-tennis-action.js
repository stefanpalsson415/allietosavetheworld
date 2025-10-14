// Check what Claude actually returned for the tennis lesson

console.log('🎾 Checking tennis lesson action data...');

const db = firebase.firestore();
db.collection('smsInbox')
  .doc('L0TGmXGAoNRWhROodQgX')
  .get()
  .then(doc => {
    if (doc.exists) {
      const data = doc.data();
      const calendarAction = data.suggestedActions?.find(a => a.type === 'calendar');
      
      if (calendarAction) {
        console.log('📅 Full Calendar Action:');
        console.log(JSON.stringify(calendarAction, null, 2));
        
        // Check if we can extract the date from the description
        const descMatch = calendarAction.description.match(/(\d{4}-\d{2}-\d{2})/);
        if (descMatch) {
          console.log('\n✅ Date found in description:', descMatch[1]);
          console.log('But startDate is:', calendarAction.data?.startDate);
        }
      }
    }
  });