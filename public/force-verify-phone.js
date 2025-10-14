// Force phone verification bypass
// Run this in the console to bypass the verification modal

// Set all necessary values
localStorage.setItem('phoneVerified', 'true');
localStorage.setItem('verifiedPhone', '+460731536304');
localStorage.setItem('alliePhone', '+17197486209');

// Find and close the modal
const modal = document.querySelector('[role="dialog"]');
if (modal) {
    // Try to find the close button
    const closeButton = modal.querySelector('button[aria-label="Close"]');
    if (closeButton) {
        closeButton.click();
    } else {
        // If no close button, hide the modal directly
        modal.style.display = 'none';
        // Also try to remove any backdrop
        const backdrop = document.querySelector('.MuiBackdrop-root');
        if (backdrop) {
            backdrop.style.display = 'none';
        }
    }
}

// Dispatch success event
const event = new CustomEvent('phoneVerified', { 
    detail: { 
        phoneNumber: '+460731536304',
        allieNumber: '+17197486209',
        success: true
    } 
});
window.dispatchEvent(event);

// Update any phone verification UI elements
const phoneInputs = document.querySelectorAll('input[type="tel"]');
phoneInputs.forEach(input => {
    if (input.value.includes('073')) {
        input.style.borderColor = 'green';
        input.disabled = true;
    }
});

// Show success message
console.log('✅ Phone verification bypassed successfully!');
console.log('📱 Your phone: +460731536304');
console.log('🤖 Allie\'s phone: +17197486209');
console.log('\nYou can now:');
console.log('1. Use the SMS test page: http://localhost:3000/test-allie-sms.html');
console.log('2. Send SMS to Allie at +17197486209');
console.log('3. Continue with the app normally');

// Reload the page after a short delay to ensure clean state
setTimeout(() => {
    console.log('🔄 Reloading page to apply changes...');
    window.location.reload();
}, 1000);