// Help Kimberly navigate the survey by showing which questions to answer
(async function() {
  try {
    console.log('=== Kimberly Survey Navigation Helper ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj';
    
    // Get survey responses
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    let kimberlyResponses = {};
    
    responseQuery.forEach(doc => {
      const data = doc.data();
      if (data.memberName === 'Kimberly' || 
          (data.responses && Object.keys(data.responses).length === 54)) {
        kimberlyResponses = data.responses || {};
      }
    });
    
    // Find which initial questions (q1-q72) she's already answered
    const answeredInitial = [];
    const unansweredInitial = [];
    
    for (let i = 1; i <= 72; i++) {
      const qId = `q${i}`;
      if (kimberlyResponses[qId]) {
        answeredInitial.push(i);
      } else {
        unansweredInitial.push(i);
      }
    }
    
    console.log('\n📊 Kimberly\'s Initial Survey Progress:');
    console.log(`✅ Answered: ${answeredInitial.length}/72 questions`);
    console.log(`❌ Remaining: ${unansweredInitial.length}/72 questions`);
    
    console.log('\n✅ Questions Already Answered:');
    console.log(answeredInitial.join(', '));
    
    console.log('\n❌ Questions Still Needed (in order):');
    // Show first 20 unanswered questions
    const first20 = unansweredInitial.slice(0, 20);
    console.log(`First 20: q${first20.join(', q')}`);
    
    if (unansweredInitial.length > 20) {
      console.log(`... and ${unansweredInitial.length - 20} more`);
    }
    
    console.log('\n🎯 Navigation Tips for Kimberly:');
    console.log('1. When the survey shows a question, check if it\'s in the "Already Answered" list above');
    console.log('2. If already answered, click "Next" to skip to the next question');
    console.log('3. Only answer questions from the "Questions Still Needed" list');
    console.log('4. The survey might jump around - this is normal due to the mixed responses');
    
    console.log('\n📝 Quick Reference - Next 10 Questions to Answer:');
    const next10 = unansweredInitial.slice(0, 10);
    next10.forEach((qNum, index) => {
      console.log(`${index + 1}. Question ${qNum}`);
    });
    
    console.log('\n⚡ Alternative Solution:');
    console.log('If the survey is too confusing, we can create a clean slate for Kimberly');
    console.log('This would reset her to question 1 but she would need to re-answer all 72 questions');
    
    // Store for clipboard
    const questionList = `Kimberly needs to answer these questions: q${unansweredInitial.join(', q')}`;
    console.log('\n📋 Copy this list:');
    console.log(questionList);
    
  } catch (error) {
    console.error('Error:', error);
  }
})();