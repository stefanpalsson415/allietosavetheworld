// Check what the AI actually provided for the action

console.log('🔍 Checking action data structure...');

const db = firebase.firestore();
db.collection('smsInbox')
  .doc('1lbtwqOnFOoFMEzrBycD')
  .get()
  .then(doc => {
    if (doc.exists) {
      const data = doc.data();
      const calendarAction = data.suggestedActions?.find(a => a.type === 'calendar');
      
      if (calendarAction) {
        console.log('📅 Full Calendar Action Object:');
        console.log(JSON.stringify(calendarAction, null, 2));
        
        console.log('\n🔍 Specifically checking date fields:');
        console.log('  action.date:', calendarAction.date);
        console.log('  action.data:', calendarAction.data);
        console.log('  action.data.date:', calendarAction.data?.date);
        console.log('  action.data.startDate:', calendarAction.data?.startDate);
        console.log('  action.data.dateTime:', calendarAction.data?.dateTime);
      }
    }
  });