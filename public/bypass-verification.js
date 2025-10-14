// Bypass phone verification for testing
// Paste this in the browser console to skip verification

// Set verified phone in localStorage
localStorage.setItem('phoneVerified', 'true');
localStorage.setItem('verifiedPhone', '+460731536304');
localStorage.setItem('alliePhone', '+17197486209');

// Create a fake success event
const event = new CustomEvent('phoneVerified', { 
  detail: { 
    phoneNumber: '+460731536304',
    allieNumber: '+17197486209'
  } 
});
window.dispatchEvent(event);

// Update any verification UI
const verificationModal = document.querySelector('[role="dialog"]');
if (verificationModal) {
  // Find the close button and click it
  const closeButton = verificationModal.querySelector('button[aria-label="Close"]');
  if (closeButton) {
    closeButton.click();
  }
}

console.log('✅ Phone verification bypassed!');
console.log('You can now use the SMS test page at:');
console.log('http://localhost:3000/test-allie-sms.html');