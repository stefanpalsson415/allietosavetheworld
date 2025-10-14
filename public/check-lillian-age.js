// Check Lillian's age and birthdate
console.log('🔍 Checking Lillian\'s profile data...\n');

// Get family context
if (window._familyContext) {
  const { familyMembers, selectedUser } = window._familyContext;
  
  console.log('Current selected user:', selectedUser);
  console.log('Selected user details:', {
    name: selectedUser?.name,
    age: selectedUser?.age,
    birthdate: selectedUser?.birthdate,
    role: selectedUser?.role,
    id: selectedUser?.id
  });
  
  // Find Lillian in family members
  const lillian = familyMembers.find(m => 
    m.name?.toLowerCase() === 'lillian' || 
    m.id?.includes('lillian')
  );
  
  if (lillian) {
    console.log('\n✅ Found Lillian in family members:');
    console.log('Name:', lillian.name);
    console.log('Age:', lillian.age);
    console.log('Birthdate:', lillian.birthdate);
    console.log('Role:', lillian.role);
    console.log('ID:', lillian.id);
    
    // Calculate age from birthdate if available
    if (lillian.birthdate) {
      const birthDate = new Date(lillian.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      console.log('\nCalculated age from birthdate:', age);
    }
  } else {
    console.log('\n❌ Could not find Lillian in family members');
    console.log('Available family members:', familyMembers.map(m => m.name));
  }
  
  // Check localStorage for selected user
  const storedUserId = localStorage.getItem('selectedUserId');
  console.log('\nStored user ID in localStorage:', storedUserId);
  
  // Check if we're on the kid survey page
  console.log('\nCurrent page:', window.location.pathname);
  console.log('Should be using kid survey:', window.location.pathname.includes('kid-survey'));
  
} else {
  console.log('❌ Family context not available');
}

// Try to access Firestore data directly
if (window.db) {
  console.log('\n📊 Attempting to read from Firestore...');
  // This would need the actual Firestore query
}