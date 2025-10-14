// Script to check and debug Lilly's balance
// Run this in the browser console while logged in

(async function() {
  console.log('=== Checking Lilly\'s Balance ===');
  
  const childId = 'lilly-m93tlovs6ty9sg8k0c8';
  
  try {
    // Get Firebase instances
    const { db } = window.firebase || {};
    if (!db) {
      console.error('Firebase not initialized. Make sure you are logged in.');
      return;
    }
    
    // Import Firestore functions
    const { doc, getDoc, collection, query, where, getDocs, orderBy } = window.firebase;
    
    // Check balance document
    console.log(`\nChecking balance document for Lilly (${childId})...`);
    const balanceRef = doc(db, 'bucksBalances', childId);
    const balanceSnap = await getDoc(balanceRef);
    
    if (balanceSnap.exists()) {
      const balanceData = balanceSnap.data();
      console.log('Current balance document:', balanceData);
      console.log(`Stored balance: ${balanceData.currentBalance}`);
      console.log(`Lifetime earned: ${balanceData.lifetimeEarned}`);
      console.log(`Lifetime spent: ${balanceData.lifetimeSpent}`);
    } else {
      console.log('❌ No balance document found for Lilly!');
    }
    
    // Get transaction history
    console.log('\nLoading transaction history...');
    const transactionsRef = collection(db, 'bucksTransactions');
    const q = query(
      transactionsRef,
      where('childId', '==', childId),
      orderBy('createdAt', 'desc')
    );
    
    const transactionsSnap = await getDocs(q);
    const transactions = transactionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    
    console.log(`Found ${transactions.length} transactions`);
    
    // Calculate balance from transactions
    let calculatedBalance = 0;
    let totalEarned = 0;
    let totalSpent = 0;
    
    console.log('\nTransaction history:');
    transactions.forEach((transaction, index) => {
      const amount = transaction.amount || 0;
      calculatedBalance += amount;
      
      if (amount > 0) {
        totalEarned += amount;
      } else {
        totalSpent += Math.abs(amount);
      }
      
      const date = transaction.createdAt ? transaction.createdAt.toLocaleString() : 'Unknown date';
      const sign = amount > 0 ? '+' : '';
      console.log(`${index + 1}. ${date}: ${sign}${amount} - ${transaction.description || 'No description'} (Running balance: ${calculatedBalance})`);
    });
    
    console.log('\n=== Summary ===');
    console.log(`Calculated balance from transactions: ${calculatedBalance}`);
    console.log(`Total earned: ${totalEarned}`);
    console.log(`Total spent: ${totalSpent}`);
    
    if (balanceSnap.exists()) {
      const storedBalance = balanceSnap.data().currentBalance;
      if (calculatedBalance !== storedBalance) {
        console.log(`\n⚠️  BALANCE MISMATCH DETECTED!`);
        console.log(`Stored balance: ${storedBalance}`);
        console.log(`Calculated balance: ${calculatedBalance}`);
        console.log(`Difference: ${storedBalance - calculatedBalance}`);
      } else {
        console.log('\n✅ Balance is correct!');
      }
    }
    
    // Check if BucksService is available
    if (window.BucksService) {
      console.log('\n=== Testing BucksService Methods ===');
      
      // Test getBalance
      try {
        const balance1 = await window.BucksService.getBalance(childId);
        console.log('getBalance() result:', balance1);
      } catch (error) {
        console.error('getBalance() error:', error.message);
      }
      
      // Test getChildBalance
      try {
        // Get family ID from context or storage
        const familyId = localStorage.getItem('selectedFamilyId') || window.familyId;
        if (familyId) {
          const balance2 = await window.BucksService.getChildBalance(familyId, childId);
          console.log('getChildBalance() result:', balance2);
        } else {
          console.log('No family ID found in localStorage or window');
        }
      } catch (error) {
        console.error('getChildBalance() error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
})();