// Quick verification that inbox is working
console.log('🔍 Verifying UnifiedInbox is working...\n');

// Check current page
const path = window.location.pathname + window.location.hash;
console.log('Current path:', path);

// Check for any React errors
const errorOverlay = document.getElementById('webpack-dev-server-client-overlay');
if (errorOverlay && errorOverlay.style.display !== 'none') {
  console.log('❌ React error overlay is visible');
} else {
  console.log('✅ No React error overlay');
}

// Check for inbox content
setTimeout(() => {
  // Check for loading state
  const loadingElement = document.querySelector('[class*="animate-spin"]');
  if (loadingElement) {
    console.log('⏳ Still loading...');
  }
  
  // Check for inbox items
  const inboxItems = document.querySelectorAll('[class*="border-b cursor-pointer"]');
  console.log(`\n📧 Inbox Status:`);
  console.log(`- ${inboxItems.length} items displayed`);
  
  if (inboxItems.length > 0) {
    console.log('✅ Inbox is displaying items successfully!');
    
    // Check first item details
    const firstItem = inboxItems[0];
    const dateText = firstItem.querySelector('[class*="text-xs text-gray-500"]')?.textContent;
    const subject = firstItem.querySelector('[class*="text-base font-medium"]')?.textContent;
    console.log(`\nFirst item:`);
    console.log(`- Subject: "${subject}"`);
    console.log(`- Date: "${dateText}"`);
  }
  
  // Check for email fixer component
  const emailFixer = document.querySelector('[class*="EmailFixer"]');
  if (emailFixer) {
    console.log('\n📧 Email fixer component is visible (no emails found)');
  }
  
  // Check for selected item detail
  const itemDetail = document.querySelector('[class*="AI Analysis"]');
  if (itemDetail) {
    console.log('\n✅ Item detail view is displayed');
  }
  
}, 1000);