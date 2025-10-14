// migrate-survey-subcategories.js
// Script to migrate existing survey responses to include subcategory data

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { firebaseConfig } from './src/services/firebase.js';
import SubCategoryAnalyzer from './src/services/SubCategoryAnalyzer.js';
import { SUB_CATEGORY_DEFINITIONS } from './src/utils/SubCategoryDefinitions.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Map question text to subcategories based on keywords
 * This is a fallback for questions that don't have subcategory metadata
 */
function inferSubcategoryFromQuestion(questionText, category) {
  if (!questionText || !category) return null;
  
  const text = questionText.toLowerCase();
  const categoryDef = SUB_CATEGORY_DEFINITIONS[category];
  
  if (!categoryDef) return null;
  
  // Check each subcategory's keywords and examples
  for (const subcategory of categoryDef.subcategories) {
    // Check if any example questions match
    if (subcategory.questionExamples) {
      for (const example of subcategory.questionExamples) {
        if (example.toLowerCase().includes(text) || text.includes(example.toLowerCase())) {
          return {
            subcategory: subcategory.id,
            subcategoryLabel: subcategory.label
          };
        }
      }
    }
    
    // Check for keyword matches based on subcategory
    const keywords = getKeywordsForSubcategory(subcategory.id);
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return {
          subcategory: subcategory.id,
          subcategoryLabel: subcategory.label
        };
      }
    }
  }
  
  return null;
}

/**
 * Get keywords for each subcategory to help with inference
 */
function getKeywordsForSubcategory(subcategoryId) {
  const keywordMap = {
    // Invisible Parental Tasks
    'worrying': ['worry', 'concern', 'anxious', 'health', 'development', 'future'],
    'planning_ahead': ['schedule', 'appointment', 'plan', 'coordinate', 'organize'],
    'remembering': ['remember', 'track', 'forget', 'remind', 'permission', 'birthday'],
    'emotional_support': ['emotion', 'feeling', 'comfort', 'upset', 'support', 'confidence'],
    'anticipating': ['anticipate', 'predict', 'notice', 'need', 'hungry', 'tired'],
    'mediating': ['mediate', 'conflict', 'fight', 'sibling', 'dispute', 'resolve'],
    
    // Visible Parental Tasks
    'driving': ['drive', 'transport', 'pickup', 'dropoff', 'carpool'],
    'homework': ['homework', 'study', 'school', 'project', 'assignment'],
    'events': ['event', 'conference', 'performance', 'game', 'field trip'],
    'meals': ['breakfast', 'lunch', 'snack', 'meal', 'food', 'pack'],
    'activities': ['activity', 'play', 'supervise', 'craft', 'screen time'],
    'bedtime': ['bedtime', 'bath', 'story', 'tuck', 'sleep'],
    
    // Invisible Household Tasks
    'meal_planning': ['meal plan', 'menu', 'recipe', 'grocery list'],
    'scheduling': ['calendar', 'schedule', 'coordinate', 'manage time'],
    'research': ['research', 'find', 'compare', 'review', 'contractor'],
    'tracking': ['track', 'monitor', 'supply', 'inventory', 'expiration'],
    'organizing': ['organize', 'system', 'routine', 'paperwork', 'filing'],
    'budgeting': ['budget', 'finance', 'bill', 'expense', 'money'],
    
    // Visible Household Tasks
    'cleaning': ['clean', 'vacuum', 'mop', 'dust', 'tidy'],
    'laundry': ['laundry', 'wash', 'fold', 'clothes', 'linens'],
    'groceries': ['grocery', 'shop', 'store', 'market'],
    'cooking': ['cook', 'dinner', 'prepare', 'meal', 'kitchen'],
    'repairs': ['repair', 'fix', 'maintenance', 'broken'],
    'yard': ['yard', 'lawn', 'garden', 'snow', 'outdoor']
  };
  
  return keywordMap[subcategoryId] || [];
}

/**
 * Load all existing survey questions to build a mapping
 */
async function loadQuestionMapping() {
  const questionMap = {};
  
  try {
    // Try to load from a questions collection if it exists
    const questionsSnapshot = await getDocs(collection(db, 'surveyQuestions'));
    questionsSnapshot.forEach(doc => {
      const question = doc.data();
      questionMap[question.id] = {
        text: question.text,
        category: question.category,
        subcategory: question.subcategory,
        subcategoryLabel: question.subcategoryLabel
      };
    });
    console.log(`Loaded ${Object.keys(questionMap).length} questions from database`);
  } catch (error) {
    console.log('No surveyQuestions collection found, will use inference');
  }
  
  return questionMap;
}

/**
 * Migrate a single survey response document
 */
async function migrateSurveyResponse(docRef, data, questionMap) {
  const responses = data.responses || {};
  let enrichedResponses = {};
  let hasChanges = false;
  
  // Check if already migrated
  if (data.subcategoryAnalysis) {
    console.log(`Document ${docRef.id} already has subcategory analysis, skipping`);
    return false;
  }
  
  // Process each response
  Object.entries(responses).forEach(([questionId, responseData]) => {
    // Handle both simple string responses and enriched objects
    if (typeof responseData === 'string') {
      // Simple format - need to enrich
      const questionInfo = questionMap[questionId] || {};
      const category = questionInfo.category || 'Unknown';
      
      // Try to infer subcategory
      const subcategoryInfo = inferSubcategoryFromQuestion(
        questionInfo.text || questionId,
        category
      );
      
      enrichedResponses[questionId] = {
        answer: responseData,
        category: category,
        subcategory: subcategoryInfo?.subcategory || null,
        subcategoryLabel: subcategoryInfo?.subcategoryLabel || null,
        weight: '1',
        timestamp: data.completedAt || new Date().toISOString()
      };
      hasChanges = true;
    } else if (typeof responseData === 'object') {
      // Already enriched format
      enrichedResponses[questionId] = responseData;
      
      // Add subcategory if missing
      if (!responseData.subcategory && responseData.category) {
        const questionInfo = questionMap[questionId] || {};
        const subcategoryInfo = inferSubcategoryFromQuestion(
          questionInfo.text || questionId,
          responseData.category
        );
        
        if (subcategoryInfo) {
          enrichedResponses[questionId].subcategory = subcategoryInfo.subcategory;
          enrichedResponses[questionId].subcategoryLabel = subcategoryInfo.subcategoryLabel;
          hasChanges = true;
        }
      }
    }
  });
  
  // Perform subcategory analysis
  const subcategoryAnalysis = SubCategoryAnalyzer.analyzeSubCategories(enrichedResponses);
  const mostImbalancedSubcategory = SubCategoryAnalyzer.getMostImbalancedSubcategory(subcategoryAnalysis);
  
  // Update the document
  await updateDoc(docRef, {
    responses: enrichedResponses,
    subcategoryAnalysis: subcategoryAnalysis,
    mostImbalancedSubcategory: mostImbalancedSubcategory,
    migratedAt: new Date().toISOString()
  });
  
  return true;
}

/**
 * Main migration function
 */
async function migrateSurveyResponses() {
  console.log('Starting survey response migration...');
  
  try {
    // Load question mapping
    const questionMap = await loadQuestionMapping();
    
    // Get all survey response documents
    const surveyResponsesSnapshot = await getDocs(collection(db, 'surveyResponses'));
    
    console.log(`Found ${surveyResponsesSnapshot.size} survey response documents to process`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process in batches
    const batch = writeBatch(db);
    let batchCount = 0;
    
    for (const docSnapshot of surveyResponsesSnapshot.docs) {
      try {
        const migrated = await migrateSurveyResponse(
          docSnapshot.ref,
          docSnapshot.data(),
          questionMap
        );
        
        if (migrated) {
          migratedCount++;
        } else {
          skippedCount++;
        }
        
        batchCount++;
        
        // Commit batch every 100 documents
        if (batchCount >= 100) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} documents`);
          batchCount = 0;
        }
      } catch (error) {
        console.error(`Error migrating document ${docSnapshot.id}:`, error);
        errorCount++;
      }
    }
    
    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} documents`);
    }
    
    console.log('\nMigration complete!');
    console.log(`- Migrated: ${migratedCount} documents`);
    console.log(`- Skipped (already migrated): ${skippedCount} documents`);
    console.log(`- Errors: ${errorCount} documents`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
console.log('Survey Response Subcategory Migration Tool');
console.log('=========================================');
console.log('This script will:');
console.log('1. Add subcategory metadata to all survey responses');
console.log('2. Calculate subcategory analysis for each response set');
console.log('3. Identify the most imbalanced subcategory');
console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(() => {
  migrateSurveyResponses()
    .then(() => {
      console.log('\nMigration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nMigration failed:', error);
      process.exit(1);
    });
}, 5000);