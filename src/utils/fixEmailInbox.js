// Utility to fix email inbox and add test emails
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

export async function fixEmailInbox(familyId) {
  console.log('🔧 Fixing email inbox for family:', familyId);
  
  try {
    // Update family email
    await updateDoc(doc(db, 'families', familyId), {
      familyEmail: 'palsson@families.checkallie.com',
      emailCreatedAt: serverTimestamp()
    });
    
    // Add test email about school orientation
    const testEmail = {
      familyId,
      source: 'email',
      type: 'email',
      from: 'advancementdirector@intlschool.se',
      to: 'palsson@families.checkallie.com',
      subject: 'Welcome! Join Us for New Families Orientation',
      content: {
        text: `Dear Stefan,

Welcome to Stockholm International School!

We are so pleased that you and your family are joining our community this year.

NEW FAMILIES ORIENTATION
Thursday, August 29, 2025
3:30 PM - 5:00 PM
Main Auditorium

We would love for you to join our New Families Orientation. This friendly session will help you settle in, learn more about SIS, and meet the people who are here to support you.

Event details:
- Date: Thursday, August 29, 2025
- Time: 3:30 PM - 5:00 PM
- Location: Main Auditorium, Building A
- What to bring: Questions and excitement!

Please RSVP by replying to this email.

Looking forward to meeting you!

Best regards,
Kimberly Palsson
Advancement Director
Stockholm International School`,
        html: null
      },
      receivedAt: serverTimestamp(),
      status: 'pending',
      processed: false,
      aiProcessing: {
        status: 'pending',
        attempts: 0
      }
    };
    
    // Add to both collections
    const emailRef = await addDoc(collection(db, 'emailInbox'), testEmail);
    console.log('✅ Added email to emailInbox:', emailRef.id);
    
    const unifiedRef = await addDoc(collection(db, 'unifiedInbox'), {
      ...testEmail,
      originalId: emailRef.id,
      originalCollection: 'emailInbox'
    });
    console.log('✅ Added email to unifiedInbox:', unifiedRef.id);
    
    return { success: true, emailId: emailRef.id, unifiedId: unifiedRef.id };
  } catch (error) {
    console.error('❌ Error fixing inbox:', error);
    return { success: false, error: error.message };
  }
}

// Auto-run if called directly from console
if (typeof window !== 'undefined' && window.fixEmailInbox === undefined) {
  window.fixEmailInbox = fixEmailInbox;
  console.log('📧 Email fix utility loaded!');
  console.log('Run: fixEmailInbox("RmB1xqGQTchw2jRy7Wop") to add test email');
}