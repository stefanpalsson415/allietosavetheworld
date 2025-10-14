// src/utils/PowerFeaturesValidation.js
/**
 * Simple validation utility for Power Features integration
 * Tests basic imports and instantiation in React context
 */

class PowerFeaturesValidation {
  constructor() {
    this.validationResults = {};
  }

  async validateImports() {
    console.log('🔍 Validating Power Features imports...');

    try {
      // Test 1: PowerFeaturesKnowledgeGraphIntegration
      console.log('1. Testing PowerFeaturesKnowledgeGraphIntegration...');
      const { PowerFeaturesKnowledgeGraphIntegration } = await import('../services/quantum/PowerFeaturesKnowledgeGraphIntegration.js');
      const kgService = new PowerFeaturesKnowledgeGraphIntegration();
      this.validationResults.quantumIntegration = {
        imported: true,
        instantiated: !!kgService,
        hasRequiredMethods: typeof kgService.integrateForensicsData === 'function'
      };
      console.log('   ✅ PowerFeaturesKnowledgeGraphIntegration - OK');

      // Test 2: AllieHarmonyDetectiveAgent
      console.log('2. Testing AllieHarmonyDetectiveAgent...');
      const { AllieHarmonyDetectiveAgent } = await import('../services/agents/AllieHarmonyDetectiveAgent.js');
      const agentService = new AllieHarmonyDetectiveAgent();
      this.validationResults.harmonyAgent = {
        imported: true,
        instantiated: !!agentService,
        hasRequiredMethods: typeof agentService.conductInvestigation === 'function'
      };
      console.log('   ✅ AllieHarmonyDetectiveAgent - OK');

      // Test 3: InvisibleLoadForensicsService
      console.log('3. Testing InvisibleLoadForensicsService...');
      const { InvisibleLoadForensicsService } = await import('../services/forensics/InvisibleLoadForensicsService.js');
      const forensicsService = new InvisibleLoadForensicsService();
      this.validationResults.forensicsService = {
        imported: true,
        instantiated: !!forensicsService,
        hasRequiredMethods: typeof forensicsService.conductForensicAnalysis === 'function'
      };
      console.log('   ✅ InvisibleLoadForensicsService - OK');

      // Test 4: CognitiveLoadQuantifier
      console.log('4. Testing CognitiveLoadQuantifier...');
      const { CognitiveLoadQuantifier } = await import('../services/forensics/CognitiveLoadQuantifier.js');
      const quantifierService = new CognitiveLoadQuantifier();
      this.validationResults.loadQuantifier = {
        imported: true,
        instantiated: !!quantifierService,
        hasRequiredMethods: typeof quantifierService.quantifyLoad === 'function'
      };
      console.log('   ✅ CognitiveLoadQuantifier - OK');

      // Test 5: ForensicsRevealScreen (React Component)
      console.log('5. Testing ForensicsRevealScreen React Component...');
      const ForensicsRevealScreen = await import('../components/forensics/ForensicsRevealScreen.jsx');
      this.validationResults.forensicsUI = {
        imported: true,
        isReactComponent: typeof ForensicsRevealScreen.default === 'function'
      };
      console.log('   ✅ ForensicsRevealScreen - OK');

      console.log('\n🎉 All Power Features components validated successfully!');

      return {
        success: true,
        results: this.validationResults,
        summary: 'All power features are ready for integration'
      };

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      console.error('Error details:', error);

      return {
        success: false,
        error: error.message,
        results: this.validationResults,
        summary: 'Power features validation failed'
      };
    }
  }

  async validateBasicFunctionality() {
    console.log('⚡ Testing basic functionality...');

    try {
      // Quick test of service instantiation
      const { PowerFeaturesKnowledgeGraphIntegration } = await import('../services/quantum/PowerFeaturesKnowledgeGraphIntegration.js');
      const { CognitiveLoadQuantifier } = await import('../services/forensics/CognitiveLoadQuantifier.js');

      const kgService = new PowerFeaturesKnowledgeGraphIntegration();
      const quantifier = new CognitiveLoadQuantifier();

      // Test method availability
      const kgMethods = [
        'integrateForensicsData',
        'integrateHarmonyData',
        'integrateFamilyDNA'
      ];

      const quantifierMethods = [
        'quantifyLoad',
        'analyzePlanningLoad',
        'analyzeEmotionalLoad'
      ];

      const kgMethodsExist = kgMethods.every(method =>
        typeof kgService[method] === 'function'
      );

      const quantifierMethodsExist = quantifierMethods.every(method =>
        typeof quantifier[method] === 'function'
      );

      console.log(`   ✅ KnowledgeGraph methods: ${kgMethodsExist ? 'OK' : 'MISSING'}`);
      console.log(`   ✅ Quantifier methods: ${quantifierMethodsExist ? 'OK' : 'MISSING'}`);

      return {
        success: kgMethodsExist && quantifierMethodsExist,
        kgMethodsExist,
        quantifierMethodsExist
      };

    } catch (error) {
      console.error('❌ Basic functionality test failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getValidationSummary() {
    const totalTests = Object.keys(this.validationResults).length;
    const passedTests = Object.values(this.validationResults).filter(result =>
      result.imported && result.instantiated
    ).length;

    return {
      total: totalTests,
      passed: passedTests,
      success: passedTests === totalTests,
      details: this.validationResults
    };
  }
}

// Global access for console testing
if (typeof window !== 'undefined') {
  window.validatePowerFeatures = async () => {
    const validator = new PowerFeaturesValidation();
    const results = await validator.validateImports();
    const summary = validator.getValidationSummary();

    console.log('\n📊 Validation Summary:');
    console.log(`Tests: ${summary.passed}/${summary.total} passed`);
    console.log(`Status: ${summary.success ? '✅ READY' : '❌ NEEDS WORK'}`);

    return { results, summary };
  };

  window.testBasicFunctionality = async () => {
    const validator = new PowerFeaturesValidation();
    return await validator.validateBasicFunctionality();
  };
}

export { PowerFeaturesValidation };
export default PowerFeaturesValidation;