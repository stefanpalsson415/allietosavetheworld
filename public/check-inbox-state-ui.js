// Check the current state of the inbox UI
// Run this in browser console

(function checkInboxState() {
  console.log('🔍 Checking inbox UI state...\n');
  
  // Check what's visible in the inbox
  const inboxItems = document.querySelectorAll('[id^="inbox-item-"]');
  console.log(`📊 Total items visible in inbox: ${inboxItems.length}`);
  
  // Check filter buttons
  const filterButtons = document.querySelectorAll('button');
  let activeFilter = 'unknown';
  
  filterButtons.forEach(btn => {
    const text = btn.textContent.trim();
    if (['All', 'Email', 'Document', 'SMS'].includes(text)) {
      // Check if button has active styling
      const classes = btn.className;
      if (classes.includes('bg-blue') || classes.includes('text-white')) {
        activeFilter = text;
      }
    }
  });
  
  console.log(`🔍 Current filter: ${activeFilter}`);
  
  // Check search input
  const searchInput = document.querySelector('input[placeholder*="Search"]');
  const searchValue = searchInput ? searchInput.value : '';
  console.log(`🔍 Search term: "${searchValue}"`);
  
  // Count items by type
  const itemTypes = {
    email: 0,
    document: 0,
    sms: 0,
    unknown: 0
  };
  
  inboxItems.forEach(item => {
    const text = item.textContent.toLowerCase();
    if (text.includes('@') && text.includes('.com')) {
      itemTypes.email++;
    } else if (text.includes('sms') || text.includes('+46') || text.includes('+1')) {
      itemTypes.sms++;
    } else if (text.includes('document') || text.includes('upload')) {
      itemTypes.document++;
    } else {
      itemTypes.unknown++;
    }
  });
  
  console.log('\n📊 Items by type:');
  console.log(`- Emails: ${itemTypes.email}`);
  console.log(`- Documents: ${itemTypes.document}`);
  console.log(`- SMS: ${itemTypes.sms}`);
  console.log(`- Unknown: ${itemTypes.unknown}`);
  
  // Check if we're on the Document Hub tab
  const activeTab = document.querySelector('[class*="bg-blue-50"]');
  if (activeTab) {
    console.log(`\n📍 Active tab: ${activeTab.textContent.trim()}`);
  }
  
  // Try to click the All filter
  console.log('\n🔧 Clicking "All" filter button...');
  let clickedAll = false;
  
  filterButtons.forEach(btn => {
    if (btn.textContent.trim() === 'All' && !clickedAll) {
      console.log('Found "All" button, clicking it...');
      btn.click();
      clickedAll = true;
    }
  });
  
  if (clickedAll) {
    console.log('✅ Clicked "All" filter');
    console.log('Check if SMS messages appear now!');
  } else {
    console.log('❌ Could not find "All" filter button');
  }
  
  // Clear search if any
  if (searchInput && searchInput.value) {
    console.log('\n🔧 Clearing search input...');
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Cleared search');
  }
  
  console.log('\n📱 SMS messages should now be visible if the filter was the issue.');
})();