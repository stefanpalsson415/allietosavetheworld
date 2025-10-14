// Complete phone verification bypass
// Paste this in console to skip phone verification

(async function() {
    console.log('🔄 Bypassing phone verification...');
    
    // Set all localStorage values
    localStorage.setItem('phoneVerified', 'true');
    localStorage.setItem('verifiedPhone', '+460731536304');
    localStorage.setItem('alliePhone', '+17197486209');
    localStorage.setItem('userPhone', '+460731536304');
    
    // Try to update Firebase if possible
    if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
        try {
            const user = window.firebase.auth().currentUser;
            const db = window.firebase.firestore();
            
            await db.collection('users').doc(user.uid).update({
                phoneNumber: '+460731536304',
                phoneVerified: true,
                phoneVerifiedAt: new Date().toISOString(),
                alliePhone: '+17197486209'
            });
            
            console.log('✅ Updated Firebase successfully!');
        } catch (error) {
            console.log('⚠️ Could not update Firebase, but localStorage is set');
        }
    }
    
    // Close any modals
    document.querySelectorAll('[role="dialog"]').forEach(modal => {
        modal.style.display = 'none';
    });
    
    document.querySelectorAll('.MuiBackdrop-root').forEach(backdrop => {
        backdrop.style.display = 'none';
    });
    
    // Override verification check functions
    window.isPhoneVerified = () => true;
    window.getVerifiedPhone = () => '+460731536304';
    window.getAlliePhone = () => '+17197486209';
    
    console.log('✅ Phone verification bypassed!');
    console.log('📱 Your phone: +460731536304');
    console.log('🤖 Allie phone: +17197486209');
    console.log('\n📝 You can now use the SMS test page:');
    console.log('http://localhost:3000/test-allie-sms.html');
    
    // Navigate directly to the test page
    if (confirm('Navigate to SMS test page now?')) {
        window.location.href = 'http://localhost:3000/test-allie-sms.html';
    } else {
        console.log('🔄 Refreshing page...');
        window.location.reload();
    }
})();