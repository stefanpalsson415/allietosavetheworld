// Script to analyze actual survey question IDs and responses
(async function() {
  try {
    console.log('=== Analyzing Survey Question IDs ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj';
    
    // Get all survey responses
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    // Analyze question IDs for each member
    const memberQuestionAnalysis = {};
    
    responseQuery.forEach(doc => {
      const data = doc.data();
      const memberId = data.memberId;
      
      if (data.responses) {
        const questionIds = Object.keys(data.responses);
        const questionNumbers = questionIds.map(id => {
          const match = id.match(/q(\d+)/);
          return match ? parseInt(match[1]) : null;
        }).filter(n => n !== null);
        
        memberQuestionAnalysis[memberId] = {
          totalResponses: questionIds.length,
          questionIds: questionIds.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.match(/\d+/)?.[0] || 0);
            return numA - numB;
          }),
          minQuestionNumber: Math.min(...questionNumbers),
          maxQuestionNumber: Math.max(...questionNumbers),
          questionNumbers: questionNumbers.sort((a, b) => a - b),
          responses: data.responses
        };
      }
    });
    
    // Get family member names
    const familyDoc = await db.collection('families').doc(familyId).get();
    const familyMembers = familyDoc.data().familyMembers;
    const memberNameMap = {};
    familyMembers.forEach(m => memberNameMap[m.id] = m.name);
    
    // Display analysis for each member
    console.log('\n1. Question ID Analysis by Member:');
    Object.entries(memberQuestionAnalysis).forEach(([memberId, analysis]) => {
      const memberName = memberNameMap[memberId] || memberId;
      console.log(`\n${memberName}:`);
      console.log(`  Total responses: ${analysis.totalResponses}`);
      console.log(`  Question range: q${analysis.minQuestionNumber} to q${analysis.maxQuestionNumber}`);
      console.log(`  First 10 question IDs: ${analysis.questionIds.slice(0, 10).join(', ')}`);
      console.log(`  Last 10 question IDs: ${analysis.questionIds.slice(-10).join(', ')}`);
      
      // Check for gaps
      const expectedCount = analysis.maxQuestionNumber - analysis.minQuestionNumber + 1;
      const gaps = expectedCount - analysis.questionNumbers.length;
      if (gaps > 0) {
        console.log(`  ⚠️  Gaps detected: ${gaps} missing questions between q${analysis.minQuestionNumber} and q${analysis.maxQuestionNumber}`);
      }
    });
    
    // 2. Find all unique question IDs across all members
    console.log('\n2. All Unique Question IDs:');
    const allQuestionIds = new Set();
    const questionIdsByRange = {
      'q1-q72': [],
      'q73-q117': [],
      'q118+': []
    };
    
    Object.values(memberQuestionAnalysis).forEach(analysis => {
      analysis.questionIds.forEach(qId => {
        allQuestionIds.add(qId);
        const num = parseInt(qId.match(/\d+/)?.[0] || 0);
        if (num <= 72) {
          questionIdsByRange['q1-q72'].push(qId);
        } else if (num <= 117) {
          questionIdsByRange['q73-q117'].push(qId);
        } else {
          questionIdsByRange['q118+'].push(qId);
        }
      });
    });
    
    console.log(`Total unique question IDs: ${allQuestionIds.size}`);
    console.log(`Questions in range 1-72: ${new Set(questionIdsByRange['q1-q72']).size}`);
    console.log(`Questions in range 73-117: ${new Set(questionIdsByRange['q73-q117']).size}`);
    console.log(`Questions above 117: ${new Set(questionIdsByRange['q118+']).size}`);
    
    // 3. Sample some actual questions to see what they are
    console.log('\n3. Sample Questions and Answers:');
    const sampleMember = Object.keys(memberQuestionAnalysis)[0];
    const sampleAnalysis = memberQuestionAnalysis[sampleMember];
    
    // Sample from different ranges
    const samples = [
      { range: '1-10', ids: sampleAnalysis.questionIds.filter(id => {
        const num = parseInt(id.match(/\d+/)?.[0] || 0);
        return num >= 1 && num <= 10;
      }).slice(0, 3) },
      { range: '70-80', ids: sampleAnalysis.questionIds.filter(id => {
        const num = parseInt(id.match(/\d+/)?.[0] || 0);
        return num >= 70 && num <= 80;
      }).slice(0, 3) },
      { range: '110-117', ids: sampleAnalysis.questionIds.filter(id => {
        const num = parseInt(id.match(/\d+/)?.[0] || 0);
        return num >= 110 && num <= 117;
      }).slice(0, 3) }
    ];
    
    samples.forEach(sample => {
      console.log(`\nQuestions in range ${sample.range}:`);
      sample.ids.forEach(qId => {
        const answer = sampleAnalysis.responses[qId];
        console.log(`  ${qId}: "${answer}"`);
      });
    });
    
    // 4. Check if there's a pattern in the question numbering
    console.log('\n4. Question Numbering Pattern Analysis:');
    
    // Check if questions follow weekly patterns
    const weeklyPattern = {};
    Object.values(memberQuestionAnalysis).forEach(analysis => {
      analysis.questionNumbers.forEach(num => {
        const week = Math.floor((num - 1) / 72) + 1;
        if (!weeklyPattern[`week${week}`]) {
          weeklyPattern[`week${week}`] = new Set();
        }
        weeklyPattern[`week${week}`].add(num);
      });
    });
    
    Object.entries(weeklyPattern).forEach(([week, questions]) => {
      console.log(`${week}: ${questions.size} questions (range: q${Math.min(...questions)} - q${Math.max(...questions)})`);
    });
    
    console.log('\n=== CONCLUSION ===');
    console.log('It appears that question IDs may have been generated with:');
    console.log('- Week 1: q1-q72 (initial survey)');
    console.log('- Week 2: q73-q144 (but only partial data exists)');
    console.log('This explains why we see q117 as the highest question number.');
    
  } catch (error) {
    console.error('Error analyzing question IDs:', error);
  }
})();