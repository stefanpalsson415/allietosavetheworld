const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function checkSurveyStructure() {
  console.log('🔍 Checking survey response structure...\n');

  const familyId = 'palsson_family_simulation';

  // Get a sample of survey responses
  const snapshot = await db.collection('surveyResponses')
    .where('familyId', '==', familyId)
    .limit(10)
    .get();

  console.log(`📋 Found ${snapshot.size} survey responses (showing first 10)\n`);

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Doc ID:', doc.id);
    console.log('Member ID:', data.memberId);
    console.log('Member Name:', data.memberName);
    console.log('Cycle:', data.cycleNumber);
    console.log('Response Count:', data.responseCount);
    console.log('Survey Type:', data.surveyType);

    // Show first 5 responses with their answers
    const responses = data.responses || {};
    const entries = Object.entries(responses).slice(0, 5);
    console.log('\nSample responses:');
    entries.forEach(([questionId, answerId]) => {
      console.log(`  ${questionId}: ${answerId}`);
    });

    // Count who answered what
    const answerCounts = {};
    Object.values(responses).forEach(answerId => {
      answerCounts[answerId] = (answerCounts[answerId] || 0) + 1;
    });
    console.log('\nAnswer distribution:');
    Object.entries(answerCounts).forEach(([answerId, count]) => {
      const percentage = ((count / Object.keys(responses).length) * 100).toFixed(1);
      console.log(`  ${answerId}: ${count} (${percentage}%)`);
    });
    console.log('');
  });

  // Get all survey responses for aggregation analysis
  const allSnapshot = await db.collection('surveyResponses')
    .where('familyId', '==', familyId)
    .get();

  console.log('\n📊 AGGREGATE ANALYSIS (all 225 responses):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Group by member
  const byMember = {};
  allSnapshot.forEach(doc => {
    const data = doc.data();
    const memberId = data.memberId;

    if (!byMember[memberId]) {
      byMember[memberId] = {
        name: data.memberName,
        cycles: [],
        totalResponses: 0,
        answerCounts: {}
      };
    }

    byMember[memberId].cycles.push(data.cycleNumber);
    byMember[memberId].totalResponses += Object.keys(data.responses).length;

    // Count answers
    Object.values(data.responses).forEach(answerId => {
      byMember[memberId].answerCounts[answerId] =
        (byMember[memberId].answerCounts[answerId] || 0) + 1;
    });
  });

  console.log('Per-member breakdown:');
  Object.entries(byMember).forEach(([memberId, stats]) => {
    console.log(`\n${stats.name} (${memberId}):`);
    console.log(`  Cycles: ${stats.cycles.length} (${Math.min(...stats.cycles)} to ${Math.max(...stats.cycles)})`);
    console.log(`  Total responses: ${stats.totalResponses}`);
    console.log(`  Answer distribution:`);
    Object.entries(stats.answerCounts).forEach(([answerId, count]) => {
      const percentage = ((count / stats.totalResponses) * 100).toFixed(1);
      console.log(`    ${answerId}: ${count} (${percentage}%)`);
    });
  });

  console.log('\n\n🎯 KEY FINDINGS FOR RADAR CHART:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check if we have parent responses (need these for mama/papa mapping)
  const parentMembers = Object.entries(byMember)
    .filter(([id]) => id.includes('palsson_agent') && !id.includes('child'));

  if (parentMembers.length === 2) {
    console.log('✅ Found 2 parent responses (needed for mama/papa mapping)');
    parentMembers.forEach(([id, stats]) => {
      console.log(`   ${stats.name}: ${id}`);
    });
  } else {
    console.log('❌ Expected 2 parent responses, found:', parentMembers.length);
  }

  console.log('\n💡 Member ID Format:');
  console.log('   Generated: kimberly_palsson_agent, stefan_palsson_agent');
  console.log('   Expected by UI: Need to map to "mama" and "papa" roles');
  console.log('\n   This mapping must happen in TasksTab or DatabaseService!');

  process.exit(0);
}

checkSurveyStructure().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
