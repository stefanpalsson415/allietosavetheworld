// Script to sync actual survey progress for Palsson family
(async function() {
  try {
    console.log('=== Syncing Actual Survey Progress ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj'; // Palsson family ID
    
    // 1. Get actual response counts from surveyResponses collection
    console.log('\n1. Getting actual response counts...');
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    const actualCounts = {};
    responseQuery.forEach(doc => {
      const data = doc.data();
      if (data.responses) {
        actualCounts[data.memberId] = Object.keys(data.responses).length;
      }
    });
    
    console.log('Actual response counts:', actualCounts);
    
    // 2. Get family document
    const familyRef = db.collection('families').doc(familyId);
    const familyDoc = await familyRef.get();
    
    if (!familyDoc.exists) {
      console.error('Family not found');
      return;
    }
    
    const familyData = familyDoc.data();
    
    // 3. Update family members with actual counts
    console.log('\n2. Updating family members with actual progress...');
    const updatedMembers = familyData.familyMembers.map(member => {
      const actualCount = actualCounts[member.id] || 0;
      const isActuallyComplete = actualCount >= 72; // Survey has 72 questions
      
      console.log(`\n${member.name}:`);
      console.log(`  Current status: ${member.surveys?.initial?.completed ? 'Complete' : 'Incomplete'}`);
      console.log(`  Actual responses: ${actualCount}/72`);
      console.log(`  Should be marked as: ${isActuallyComplete ? 'Complete' : 'Incomplete'}`);
      
      return {
        ...member,
        completed: isActuallyComplete, // Legacy field
        completedDate: isActuallyComplete ? member.completedDate || new Date().toISOString() : null,
        surveys: {
          ...member.surveys,
          initial: {
            ...member.surveys?.initial,
            completed: isActuallyComplete,
            responseCount: actualCount,
            completedDate: isActuallyComplete ? member.surveys?.initial?.completedDate || new Date().toISOString() : null,
            lastUpdated: new Date().toISOString()
          }
        }
      };
    });
    
    // 4. Check if all parents are actually complete
    const parents = updatedMembers.filter(m => m.role === 'parent');
    const allParentsComplete = parents.every(p => p.surveys?.initial?.completed === true);
    const allMembersComplete = updatedMembers.every(m => m.surveys?.initial?.completed === true);
    
    console.log('\n3. Family completion status:');
    console.log(`  All parents complete: ${allParentsComplete}`);
    console.log(`  All members complete: ${allMembersComplete}`);
    
    // 5. Update family document
    const updateData = {
      familyMembers: updatedMembers,
      updatedAt: new Date()
    };
    
    // Only mark week as complete if all parents have actually finished
    if (allParentsComplete) {
      updateData.completedWeeks = [1];
      updateData.currentWeek = 2;
    } else {
      updateData.completedWeeks = [];
      updateData.currentWeek = 1;
    }
    
    await familyRef.update(updateData);
    console.log('\n✅ Updated family document with actual progress');
    
    // 6. Update survey completions collection
    const completionRef = db.collection('surveyCompletions').doc(familyId);
    const completionData = {
      familyId,
      initial: {},
      allParentsCompleted: allParentsComplete,
      updatedAt: new Date()
    };
    
    updatedMembers.forEach(member => {
      completionData.initial[member.id] = {
        completed: member.surveys?.initial?.completed || false,
        responseCount: member.surveys?.initial?.responseCount || 0,
        completedDate: member.surveys?.initial?.completedDate || null
      };
    });
    
    await completionRef.set(completionData, { merge: true });
    console.log('✅ Updated survey completions record');
    
    // 7. Update aggregated survey data
    const aggregatedRef = db.collection('aggregatedSurveyData').doc(familyId);
    
    // Calculate aggregated totals
    let parentResponseCount = 0;
    let childResponseCount = 0;
    const byMember = {};
    
    updatedMembers.forEach(member => {
      const count = member.surveys?.initial?.responseCount || 0;
      byMember[member.id] = count;
      
      if (member.role === 'parent') {
        parentResponseCount += count;
      } else if (member.role === 'child') {
        childResponseCount += count;
      }
    });
    
    const aggregatedData = {
      familyId,
      parentResponseCount,
      childResponseCount,
      aggregatedTotal: parentResponseCount + childResponseCount,
      parentMemberCount: parents.length,
      childMemberCount: updatedMembers.filter(m => m.role === 'child').length,
      lastUpdated: new Date(),
      byMember
    };
    
    await aggregatedRef.set(aggregatedData, { merge: true });
    console.log('✅ Updated aggregated survey data');
    
    // 8. Summary
    console.log('\n=== SUMMARY ===');
    console.log('Survey completion status:');
    updatedMembers.forEach(member => {
      const percent = Math.round((member.surveys?.initial?.responseCount || 0) / 72 * 100);
      const status = member.surveys?.initial?.completed ? '✅' : '🔄';
      console.log(`${status} ${member.name}: ${member.surveys?.initial?.responseCount}/72 (${percent}%)`);
    });
    
    if (!allParentsComplete) {
      console.log('\n⚠️  Parents need to complete their surveys to unlock full features!');
      console.log('Stefan needs to answer', 72 - (actualCounts['Xs7d1dGHjPQ4rpkUj9FsHNRbN4C3'] || 0), 'more questions');
      console.log('Kimberly needs to answer', 72 - (actualCounts['fdOWfUKFbcNjfk83QkSUGTyM5bI3'] || 0), 'more questions');
    }
    
    if (!allMembersComplete) {
      console.log('\nKids are almost done - just 1 more question each!');
    }
    
    console.log('\nPlease refresh the page to see updated status.');
    
  } catch (error) {
    console.error('Error syncing survey progress:', error);
  }
})();