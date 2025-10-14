// Check Stefan's survey completion status
// Run this in the browser console

(async function() {
  console.log('=== Checking Stefan\'s Survey Status ===\n');
  
  const auth = firebase.auth();
  const db = firebase.firestore();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.log('❌ No user logged in');
    return;
  }
  
  console.log('Logged in as:', currentUser.email);
  
  // Get family ID
  const userDoc = await db.collection('users').doc(currentUser.uid).get();
  const familyId = userDoc.data()?.familyId;
  
  if (!familyId) {
    console.log('❌ No family ID found');
    return;
  }
  
  console.log('Family ID:', familyId);
  
  // Get family members
  const familyDoc = await db.collection('families').doc(familyId).get();
  const familyData = familyDoc.data();
  const members = familyData?.members || [];
  
  console.log('\n📊 Family Members Survey Status:');
  console.log('================================');
  
  // Find Stefan
  const stefan = members.find(m => 
    m.name?.toLowerCase().includes('stefan') || 
    m.email?.includes('spalsson@gmail.com')
  );
  
  if (stefan) {
    console.log('\n🔍 Stefan\'s Data:');
    console.log('Name:', stefan.name);
    console.log('Email:', stefan.email);
    console.log('ID:', stefan.id);
    console.log('Role:', stefan.role);
    console.log('\nSurvey Status:');
    console.log('Has surveys object:', !!stefan.surveys);
    console.log('Has initial survey:', !!stefan.surveys?.initial);
    console.log('Initial survey completed:', stefan.surveys?.initial?.completed || false);
    console.log('Completion date:', stefan.surveys?.initial?.completedAt || 'Not set');
    
    if (stefan.surveys?.initial) {
      console.log('\nFull initial survey data:');
      console.log(JSON.stringify(stefan.surveys.initial, null, 2));
    }
  } else {
    console.log('\n❌ Stefan not found in family members');
  }
  
  // Check all members
  console.log('\n📋 All Members Survey Status:');
  members.forEach((member, idx) => {
    const completed = member.surveys?.initial?.completed || false;
    console.log(`${idx + 1}. ${member.name || 'Unknown'} (${member.email || 'No email'})`);
    console.log(`   ID: ${member.id}`);
    console.log(`   Survey completed: ${completed ? '✅' : '❌'}`);
    if (member.surveys?.initial?.completedAt) {
      console.log(`   Completed at: ${new Date(member.surveys.initial.completedAt).toLocaleString()}`);
    }
  });
  
  // Check survey responses collection
  console.log('\n📝 Checking survey responses collection...');
  try {
    const surveyQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    console.log(`Found ${surveyQuery.size} survey responses for this family`);
    
    surveyQuery.forEach(doc => {
      const data = doc.data();
      console.log(`\nResponse ID: ${doc.id}`);
      console.log(`User ID: ${data.userId}`);
      console.log(`User Name: ${data.userName || 'Not set'}`);
      console.log(`Created: ${data.createdAt?.toDate?.()?.toLocaleString() || data.createdAt}`);
      console.log(`Completed: ${data.completed ? '✅' : '❌'}`);
    });
  } catch (error) {
    console.log('Could not read surveyResponses collection:', error.message);
  }
  
  console.log('\n💡 To manually mark Stefan\'s survey as complete:');
  console.log('markStefanSurveyComplete()');
  
  window.markStefanSurveyComplete = async function() {
    if (!stefan) {
      console.log('❌ Stefan not found');
      return;
    }
    
    console.log('\nMarking Stefan\'s survey as complete...');
    
    // Update the member in the family document
    const updatedMembers = members.map(m => {
      if (m.id === stefan.id) {
        return {
          ...m,
          surveys: {
            ...m.surveys,
            initial: {
              completed: true,
              completedAt: new Date().toISOString(),
              responses: m.surveys?.initial?.responses || {}
            }
          }
        };
      }
      return m;
    });
    
    await db.collection('families').doc(familyId).update({
      members: updatedMembers
    });
    
    console.log('✅ Stefan\'s survey marked as complete!');
    console.log('Refresh the page to see the changes.');
  };
})();