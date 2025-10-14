const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyBKkCKFrMGUVZXRXCbM_I35KpqOr9DWBPo',
  authDomain: 'parentload-ba995.firebaseapp.com',
  projectId: 'parentload-ba995'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkEmail() {
  try {
    const emailDoc = await getDoc(doc(db, 'emailInbox', 'cQzaAZvO64gnLERY97dZ'));
    if (emailDoc.exists()) {
      const data = emailDoc.data();
      console.log('Email document data:');
      console.log('- Status:', data.status);
      console.log('- Has aiAnalysis:', !!data.aiAnalysis);
      console.log('- Has suggestedActions:', !!data.suggestedActions);
      console.log('- Suggested actions count:', data.suggestedActions?.length || 0);
      if (data.suggestedActions) {
        console.log('- Suggested actions:', JSON.stringify(data.suggestedActions, null, 2));
      }
    } else {
      console.log('Email document not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkEmail();