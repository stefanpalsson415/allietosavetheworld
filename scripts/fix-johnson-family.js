#!/usr/bin/env node
/**
 * Fix Johnson Family - Add proper userId fields to familyMembers
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();
const auth = admin.auth();

const FAMILY_ID = 'johnson_demo_family';

async function fixJohnsonFamily() {
  console.log('\n🔧 Fixing Johnson Family...\n');

  try {
    // Get Sarah's actual Firebase UID
    const sarahUser = await auth.getUserByEmail('sarah@johnson-demo.family');
    const mikeUser = await auth.getUserByEmail('mike@johnson-demo.family');

    console.log(`✅ Found Sarah: ${sarahUser.uid}`);
    console.log(`✅ Found Mike: ${mikeUser.uid}`);

    // Update family document with correct familyMembers structure
    const familyRef = db.collection('families').doc(FAMILY_ID);

    await familyRef.update({
      familyMembers: [
        {
          id: sarahUser.uid,
          userId: sarahUser.uid,
          name: 'Sarah Johnson',
          role: 'parent',
          isParent: true,
          age: 36,
          occupation: 'Product Manager'
        },
        {
          id: mikeUser.uid,
          userId: mikeUser.uid,
          name: 'Mike Johnson',
          role: 'parent',
          isParent: true,
          age: 38,
          occupation: 'Teacher'
        },
        {
          id: 'child_olivia_johnson',
          userId: 'child_olivia_johnson',
          name: 'Olivia Johnson',
          role: 'child',
          isParent: false,
          age: 12,
          grade: '7th Grade'
        },
        {
          id: 'child_ethan_johnson',
          userId: 'child_ethan_johnson',
          name: 'Ethan Johnson',
          role: 'child',
          isParent: false,
          age: 9,
          grade: '4th Grade'
        },
        {
          id: 'child_lily_johnson',
          userId: 'child_lily_johnson',
          name: 'Lily Johnson',
          role: 'child',
          isParent: false,
          age: 5,
          grade: 'Kindergarten'
        }
      ],
      memberIds: [sarahUser.uid, mikeUser.uid],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('\n✅ Johnson family updated successfully!');
    console.log('\n🌐 Login at: https://checkallie.com');
    console.log('📧 Email: sarah@johnson-demo.family');
    console.log('🔑 Password: DemoFamily2024!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixJohnsonFamily();
