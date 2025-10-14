// Simple script to deploy Firestore indexes
const { exec } = require('child_process');

console.log('🚀 Deploying Firestore indexes...\n');

// Check if firebase-tools is installed
exec('firebase --version', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Firebase CLI not found. Please install it first:');
    console.log('   npm install -g firebase-tools');
    console.log('\nThen run this script again.');
    process.exit(1);
  }
  
  console.log('✅ Firebase CLI version:', stdout.trim());
  
  // Deploy indexes
  console.log('\n📤 Deploying Firestore indexes...');
  
  const deploy = exec('firebase deploy --only firestore:indexes');
  
  deploy.stdout.on('data', (data) => {
    console.log(data);
  });
  
  deploy.stderr.on('data', (data) => {
    console.error(data);
  });
  
  deploy.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Indexes deployed successfully!');
    } else {
      console.log('\n❌ Deployment failed. Error code:', code);
      console.log('\nAlternative: Create indexes manually in Firebase Console:');
      console.log('1. Go to https://console.firebase.google.com');
      console.log('2. Select your project');
      console.log('3. Go to Firestore Database > Indexes');
      console.log('4. Create these composite indexes:\n');
      
      console.log('Index 1 - DJ Sessions:');
      console.log('  Collection: families/{familyId}/djSessions');
      console.log('  Fields: familyId (Ascending), createdAt (Descending)\n');
      
      console.log('Index 2 - Practice History:');
      console.log('  Collection: families/{familyId}/practiceHistory');
      console.log('  Fields: userId (Ascending), sessionDate (Descending)\n');
      
      console.log('Index 3 - Live Sessions:');
      console.log('  Collection: liveSessions');
      console.log('  Fields: familyId (Ascending), startedAt (Descending)');
    }
  });
});