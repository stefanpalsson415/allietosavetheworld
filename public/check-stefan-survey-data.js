// Diagnostic script to check Stefan's actual survey data
import { db } from '../src/services/firebase.js';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

async function checkStefanSurveyData() {
  console.log('=== Stefan Survey Data Check ===\n');
  
  try {
    // 1. Check the Palsson family ID
    const familiesSnapshot = await getDocs(collection(db, 'families'));
    let palssonFamilyId = null;
    
    familiesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.name?.toLowerCase().includes('palsson')) {
        palssonFamilyId = doc.id;
        console.log('Found Palsson family:', doc.id);
      }
    });
    
    if (!palssonFamilyId) {
      console.error('Could not find Palsson family!');
      return;
    }
    
    // 2. Get Stefan's user ID
    const familyDoc = await getDoc(doc(db, 'families', palssonFamilyId));
    const familyData = familyDoc.data();
    const stefanMember = familyData.members?.find(m => 
      m.name?.toLowerCase() === 'stefan' || 
      m.email?.includes('spalsson')
    );
    
    if (!stefanMember) {
      console.error('Could not find Stefan in family members!');
      console.log('Available members:', familyData.members?.map(m => m.name));
      return;
    }
    
    console.log('\nStefan member data:', {
      id: stefanMember.id,
      name: stefanMember.name,
      email: stefanMember.email,
      completed: stefanMember.completed,
      surveys: stefanMember.surveys
    });
    
    // 3. Check survey responses document
    const surveyDocId = `${palssonFamilyId}-${stefanMember.id}-initial`;
    console.log('\nChecking survey responses document:', surveyDocId);
    
    const surveyDoc = await getDoc(doc(db, 'surveyResponses', surveyDocId));
    
    if (surveyDoc.exists()) {
      const data = surveyDoc.data();
      console.log('\nSurvey document found!');
      console.log('Response count:', data.responseCount);
      console.log('Actual responses:', Object.keys(data.responses || {}).length);
      console.log('Completed at:', data.completedAt);
      console.log('Last updated:', data.lastUpdated);
      
      // Show first few responses
      const responseKeys = Object.keys(data.responses || {});
      console.log('\nFirst 5 response IDs:', responseKeys.slice(0, 5));
      console.log('Last 5 response IDs:', responseKeys.slice(-5));
      
      // Check for any gaps in question IDs
      const questionNumbers = responseKeys
        .filter(id => id.match(/^q\d+$/))
        .map(id => parseInt(id.substring(1)))
        .sort((a, b) => a - b);
      
      console.log('\nQuestion number range:', {
        min: Math.min(...questionNumbers),
        max: Math.max(...questionNumbers),
        count: questionNumbers.length
      });
      
      // Check for missing questions
      const missingQuestions = [];
      for (let i = 1; i <= 72; i++) {
        if (!responseKeys.includes(`q${i}`)) {
          missingQuestions.push(`q${i}`);
        }
      }
      
      if (missingQuestions.length > 0) {
        console.log('\nMissing questions:', missingQuestions.length);
        console.log('Missing question IDs:', missingQuestions);
      }
      
    } else {
      console.log('\nNo survey responses document found!');
      
      // Try alternative query
      console.log('\nTrying query approach...');
      const responsesQuery = await getDocs(query(
        collection(db, 'surveyResponses'),
        where('memberId', '==', stefanMember.id),
        where('familyId', '==', palssonFamilyId)
      ));
      
      console.log('Found documents:', responsesQuery.size);
      responsesQuery.forEach(doc => {
        console.log('Document ID:', doc.id);
        console.log('Data:', doc.data());
      });
    }
    
    // 4. Check survey completions collection
    console.log('\n\nChecking survey completions...');
    const completionsQuery = await getDocs(query(
      collection(db, 'surveyCompletions'),
      where('userId', '==', stefanMember.id)
    ));
    
    console.log('Found completion records:', completionsQuery.size);
    completionsQuery.forEach(doc => {
      console.log('Completion:', doc.data());
    });
    
  } catch (error) {
    console.error('Error checking survey data:', error);
  }
}

// Run the check
checkStefanSurveyData();