// Check Kimberly's current authentication setup
console.log('🔍 Checking Kimberly\'s authentication setup...');

const checkKimberlyAuth = async () => {
  try {
    const familyId = 'mchhhvqsvwy5lh83shq';
    
    // Check localStorage for current auth info
    console.log('📋 Current localStorage auth data:');
    
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('auth') || key.includes('user') || key.includes('otp') || key.includes('family')
    );
    
    authKeys.forEach(key => {
      const value = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(value);
        console.log(`🔑 ${key}:`, parsed);
      } catch {
        console.log(`🔑 ${key}:`, value);
      }
    });
    
    // Check current user info
    console.log('');
    console.log('👤 Current user info:');
    
    if (window._familyContext) {
      console.log('Selected user:', window._familyContext.selectedUser);
      console.log('Family members:', window._familyContext.familyMembers);
    }
    
    // Check if Kimberly is using OTP or Firebase Auth
    const otpSession = localStorage.getItem('otpUserSession');
    if (otpSession) {
      const session = JSON.parse(otpSession);
      console.log('');
      console.log('📱 OTP Session found:', session);
      
      if (session.email === 'kimberly@palsson.family') {
        console.log('⚠️ Kimberly is using OTP with fake email');
        console.log('🔧 Changing email will require updating OTP session');
      }
    }
    
    // Check Firebase Auth
    const { auth } = await import('../src/services/firebase.js');
    if (auth.currentUser) {
      console.log('');
      console.log('🔥 Firebase Auth user:', {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified
      });
      
      if (auth.currentUser.email === 'kimberly@palsson.family') {
        console.log('⚠️ Kimberly is using Firebase Auth with fake email');
        console.log('🔧 Email change will require Firebase Auth email update');
      }
    }
    
    console.log('');
    console.log('🎯 RECOMMENDATIONS:');
    console.log('1. If using OTP: Update email in family profile first, then OTP session');
    console.log('2. If using Firebase Auth: Use Firebase Auth email change process');
    console.log('3. Test login with new email before finalizing');
    console.log('4. Consider keeping the fake email as a backup until new email works');
    
  } catch (error) {
    console.error('❌ Error checking auth:', error);
  }
};

checkKimberlyAuth();