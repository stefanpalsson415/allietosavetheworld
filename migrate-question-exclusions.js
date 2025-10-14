// migrate-question-exclusions.js
// This script migrates family-wide question exclusions to member-specific exclusions

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateQuestionExclusions() {
  try {
    console.log('Starting migration of question exclusions...');
    
    // Get all families with question settings
    const familySettingsSnapshot = await getDocs(collection(db, 'familyQuestionSettings'));
    
    for (const familyDoc of familySettingsSnapshot.docs) {
      const familyId = familyDoc.id;
      const familyData = familyDoc.data();
      const excludedQuestions = familyData.excludedQuestions || [];
      
      if (excludedQuestions.length === 0) {
        console.log(`Family ${familyId} has no excluded questions, skipping...`);
        continue;
      }
      
      console.log(`\nProcessing family ${familyId} with ${excludedQuestions.length} excluded questions...`);
      
      // Get all survey responses for this family to identify who excluded what
      const feedbackQuery = query(
        collection(db, 'questionFeedback'),
        where('familyId', '==', familyId)
      );
      const feedbackSnapshot = await getDocs(feedbackQuery);
      
      // Create a map of userId -> excluded questions
      const userExclusions = {};
      
      feedbackSnapshot.forEach(feedbackDoc => {
        const feedback = feedbackDoc.data();
        if (feedback.feedbackType === 'not_applicable' && feedback.userId) {
          if (!userExclusions[feedback.userId]) {
            userExclusions[feedback.userId] = new Set();
          }
          userExclusions[feedback.userId].add(feedback.questionId);
        }
      });
      
      // If we couldn't determine user-specific exclusions from feedback,
      // we'll need to look at survey responses to see who answered what
      if (Object.keys(userExclusions).length === 0) {
        console.log(`No user-specific feedback found for family ${familyId}, checking survey responses...`);
        
        // Get family members
        const familyDocRef = doc(db, 'families', familyId);
        const familyDocSnap = await getDoc(familyDocRef);
        
        if (familyDocSnap.exists()) {
          const members = familyDocSnap.data().members || [];
          
          // For each excluded question, try to determine who excluded it
          for (const questionId of excludedQuestions) {
            // Check survey responses to see who hasn't answered this question
            const surveyResponsesQuery = query(
              collection(db, 'surveyResponses'),
              where('familyId', '==', familyId)
            );
            const surveySnapshot = await getDocs(surveyResponsesQuery);
            
            // This is a simplified approach - in reality, you'd need to analyze
            // the survey response patterns to determine who excluded what
            console.log(`Question ${questionId} was excluded at family level - needs manual review`);
          }
        }
      }
      
      // Create member-specific exclusion documents
      for (const [userId, questionSet] of Object.entries(userExclusions)) {
        const memberDocRef = doc(db, 'memberQuestionSettings', `${familyId}-${userId}`);
        
        await setDoc(memberDocRef, {
          familyId,
          userId,
          excludedQuestions: Array.from(questionSet),
          updatedAt: serverTimestamp(),
          migratedFrom: 'familyQuestionSettings'
        });
        
        console.log(`Created member-specific exclusions for user ${userId}: ${questionSet.size} questions`);
      }
      
      // Optionally, clear the family-wide exclusions after migration
      // await setDoc(doc(db, 'familyQuestionSettings', familyId), {
      //   ...familyData,
      //   excludedQuestions: [],
      //   migratedAt: serverTimestamp()
      // });
    }
    
    console.log('\nMigration completed!');
    
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration
migrateQuestionExclusions();