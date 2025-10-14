// Trace why SMS isn't rendering despite being loaded
// Run this in browser console

(function traceSMSRendering() {
  console.log('🔍 Tracing SMS rendering issue...\n');
  
  // Check the actual inbox items
  const inboxContainer = document.querySelector('.overflow-y-auto.flex-1');
  if (!inboxContainer) {
    console.log('❌ Could not find inbox container');
    return;
  }
  
  // Count all inbox items
  const allItems = inboxContainer.querySelectorAll('[id^="inbox-item-"]');
  console.log(`📊 Total rendered items: ${allItems.length}`);
  
  // Look for SMS items specifically
  let smsFound = false;
  allItems.forEach((item, index) => {
    const text = item.textContent;
    if (text.includes('+46') || text.includes('SMS') || text.includes('Test SMS')) {
      console.log(`\n✅ Found SMS item at position ${index + 1}:`);
      console.log(`ID: ${item.id}`);
      console.log(`Text preview: ${text.substring(0, 100)}...`);
      smsFound = true;
    }
  });
  
  if (!smsFound) {
    console.log('\n❌ No SMS items found in rendered list');
    
    // Check if there's a "No items found" message
    const noItemsMessage = document.querySelector('.text-center.py-8.text-gray-500');
    if (noItemsMessage) {
      console.log('📭 "No items found" message is displayed');
    }
  }
  
  // Check filter state
  console.log('\n🔍 Checking filter state:');
  const filterButtons = document.querySelectorAll('button');
  filterButtons.forEach(btn => {
    const text = btn.textContent.trim();
    if (['All', 'Email', 'Document', 'SMS'].includes(text)) {
      const isActive = btn.className.includes('bg-blue') || btn.className.includes('text-white');
      console.log(`- ${text}: ${isActive ? '✓ ACTIVE' : 'inactive'}`);
    }
  });
  
  // Try clicking SMS filter specifically
  console.log('\n🔧 Trying SMS filter...');
  let clickedSMS = false;
  filterButtons.forEach(btn => {
    if (btn.textContent.trim() === 'SMS' && !clickedSMS) {
      console.log('Clicking SMS filter...');
      btn.click();
      clickedSMS = true;
    }
  });
  
  if (clickedSMS) {
    setTimeout(() => {
      const smsItems = document.querySelectorAll('[id^="inbox-item-"]');
      console.log(`\n📱 After clicking SMS filter: ${smsItems.length} items shown`);
      
      if (smsItems.length === 0) {
        console.log('❌ Still no items! The SMS might be filtered out by some other condition.');
        
        // Check if archived
        console.log('\n🔍 Possible reasons:');
        console.log('1. SMS might be archived');
        console.log('2. SMS might not match the filter criteria');
        console.log('3. Component state might be out of sync');
      } else {
        console.log('✅ SMS items are now visible!');
      }
    }, 500);
  }
  
  // Log React component info if available
  console.log('\n🔍 Checking React state:');
  const inboxElement = document.querySelector('.overflow-y-auto.flex-1')?.parentElement?.parentElement;
  if (inboxElement) {
    const reactKey = Object.keys(inboxElement).find(key => key.startsWith('__react'));
    if (reactKey) {
      console.log('Found React fiber');
      // This is just for debugging, actual state manipulation would be complex
    }
  }
})();