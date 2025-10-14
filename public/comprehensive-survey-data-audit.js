// Comprehensive Survey Data Audit Script
// Run this in browser console to analyze all survey data inconsistencies

console.log('🔍 Starting Comprehensive Survey Data Audit...');

const auditSurveyData = async () => {
  try {
    const familyId = 'mchhhvqsvwy5lh83shq';
    console.log('📊 Auditing family:', familyId);
    
    // Import services
    const { default: DatabaseService } = await import('../src/services/DatabaseService.js');
    const dbService = new DatabaseService();
    
    // 1. AUDIT FAMILYCONTEXT SURVEY RESPONSES
    console.log('\n=== 1. FAMILYCONTEXT SURVEYRESPONSES AUDIT ===');
    
    // Get the surveyResponses from localStorage/context (this is what ChatMessage sees)
    const familyDataKey = `family_${familyId}`;
    const familyData = JSON.parse(localStorage.getItem(familyDataKey) || '{}');
    const contextSurveyResponses = familyData.surveyResponses || {};
    
    console.log('📋 FamilyContext surveyResponses analysis:', {
      totalKeys: Object.keys(contextSurveyResponses).length,
      sampleKeys: Object.keys(contextSurveyResponses).slice(0, 10),
      keyFormats: Object.keys(contextSurveyResponses).slice(0, 10).map(k => ({
        key: k,
        hasUnderscore: k.includes('_'),
        hasDash: k.includes('-'),
        hasQ: k.includes('q'),
        matchesExpectedFormat: /^[^_]+_q[0-9]+$/.test(k),
        value: contextSurveyResponses[k]
      }))
    });
    
    // 2. AUDIT FIREBASE SURVEY COLLECTIONS
    console.log('\n=== 2. FIREBASE SURVEY COLLECTIONS AUDIT ===');
    
    // Get raw Firebase data
    const firebaseResponses = await dbService.getAllSurveyResponses(familyId);
    
    console.log('🔥 Firebase survey responses analysis:', {
      totalResponses: firebaseResponses.length,
      sampleResponses: firebaseResponses.slice(0, 5).map(r => ({
        questionId: r.questionId,
        response: r.response,
        memberId: r.memberId,
        memberRole: r.memberRole,
        surveyType: r.surveyType,
        timestamp: r.timestamp
      })),
      uniqueMembers: [...new Set(firebaseResponses.map(r => r.memberId))],
      uniqueQuestionIds: [...new Set(firebaseResponses.map(r => r.questionId))].slice(0, 10),
      surveyTypes: [...new Set(firebaseResponses.map(r => r.surveyType))]
    });
    
    // 3. AUDIT AGGREGATED DATA
    console.log('\n=== 3. AGGREGATED DATA AUDIT ===');
    
    const aggregatedData = await dbService.getAggregatedSurveyResponses(familyId);
    
    console.log('📈 Aggregated data analysis:', {
      hasAggregatedData: !!aggregatedData,
      aggregatedTotal: aggregatedData?.aggregatedTotal,
      parentResponseCount: aggregatedData?.parentResponseCount,
      memberCount: aggregatedData?.memberCount,
      responsesByMemberKeys: aggregatedData?.responsesByMember ? Object.keys(aggregatedData.responsesByMember) : [],
      sampleResponsesByMember: aggregatedData?.responsesByMember ? 
        Object.entries(aggregatedData.responsesByMember).slice(0, 2).map(([memberId, responses]) => ({
          memberId,
          responseCount: typeof responses === 'object' ? Object.keys(responses).length : 'Not object',
          sampleKeys: typeof responses === 'object' ? Object.keys(responses).slice(0, 5) : []
        })) : []
    });
    
    // 4. AUDIT DATA FORMAT INCONSISTENCIES
    console.log('\n=== 4. DATA FORMAT INCONSISTENCIES ===');
    
    const formatAnalysis = {
      contextVsFirebase: {
        contextHas70Keys: Object.keys(contextSurveyResponses).length === 70,
        firebaseHas75Responses: firebaseResponses.length === 75,
        keyFormatMismatch: Object.keys(contextSurveyResponses).filter(k => /^[^_]+_q\d+$/.test(k)).length === 0
      },
      duplicateDetection: {
        // Check for duplicate responses
        firebaseResponseKeys: firebaseResponses.map(r => `${r.memberId}_${r.questionId}`),
        uniqueFirebaseKeys: [...new Set(firebaseResponses.map(r => `${r.memberId}_${r.questionId}`))].length
      }
    };
    
    console.log('⚠️ Format inconsistencies:', formatAnalysis);
    
    // 5. AUDIT SPECIFIC MEMBER DATA
    console.log('\n=== 5. MEMBER-SPECIFIC DATA AUDIT ===');
    
    const memberIds = ['sOmi6l0zJ7hh0kN0rAX0pD37w3i1', 'scJTMz4MKVaqbnVmUI6TE3tbgHI2'];
    
    for (const memberId of memberIds) {
      const memberFirebaseResponses = firebaseResponses.filter(r => r.memberId === memberId);
      const memberContextKeys = Object.keys(contextSurveyResponses).filter(k => k.includes(memberId));
      
      console.log(`👤 Member ${memberId.slice(-8)} analysis:`, {
        firebaseResponseCount: memberFirebaseResponses.length,
        contextKeyCount: memberContextKeys.length,
        sampleContextKeys: memberContextKeys.slice(0, 5),
        sampleFirebaseQuestionIds: memberFirebaseResponses.slice(0, 5).map(r => r.questionId),
        expectedContextKeyFormat: memberContextKeys.filter(k => k.startsWith(`${memberId}_q`)).length
      });
    }
    
    // 6. RECOMMEND CLEANUP STRATEGY
    console.log('\n=== 6. CLEANUP STRATEGY RECOMMENDATIONS ===');
    
    const recommendations = {
      criticalIssues: [
        formatAnalysis.contextVsFirebase.keyFormatMismatch ? 'FamilyContext keys do not match expected format' : null,
        firebaseResponses.length !== formatAnalysis.duplicateDetection.uniqueFirebaseKeys ? 'Firebase has duplicate responses' : null,
        Math.abs(Object.keys(contextSurveyResponses).length - firebaseResponses.length) > 10 ? 'Major count mismatch between context and Firebase' : null
      ].filter(Boolean),
      
      cleanupOptions: [
        'OPTION 1: Complete data reset - Delete all survey data and start fresh',
        'OPTION 2: Data migration - Convert existing data to consistent format',
        'OPTION 3: Hybrid approach - Keep Firebase data, regenerate FamilyContext format'
      ]
    };
    
    console.log('🔧 Cleanup recommendations:', recommendations);
    
    // 7. GENERATE MIGRATION SCRIPT (if data is salvageable)
    if (firebaseResponses.length > 0 && recommendations.criticalIssues.length < 3) {
      console.log('\n=== 7. MIGRATION SCRIPT PREVIEW ===');
      
      const migrationPreview = {
        step1: 'Clear FamilyContext surveyResponses',
        step2: 'Regenerate FamilyContext from Firebase data using correct format',
        expectedContextKeys: firebaseResponses.slice(0, 5).map(r => `${r.memberId}_${r.questionId}`),
        step3: 'Update all response processing logic to use consistent format'
      };
      
      console.log('📋 Migration preview:', migrationPreview);
    }
    
    console.log('\n✅ Comprehensive audit complete!');
    
    return {
      contextData: contextSurveyResponses,
      firebaseData: firebaseResponses,
      aggregatedData,
      formatAnalysis,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    return null;
  }
};

// Run the audit
auditSurveyData();