#!/usr/bin/env node
/**
 * Test Suite for Palsson Family Agents
 *
 * Tests all 5 agents to ensure:
 * 1. Agents initialize correctly
 * 2. Personality traits are accurate
 * 3. Decision-making works with Claude API
 * 4. Transformation phases work
 * 5. Behavior patterns are realistic
 */

const StefanAgent = require('./StefanAgent');
const KimberlyAgent = require('./KimberlyAgent');
const LillianAgent = require('./LillianAgent');
const OlyAgent = require('./OlyAgent');
const TegnerAgent = require('./TegnerAgent');

// Test colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log('green', `✅ ${message}`);
}

function error(message) {
  log('red', `❌ ${message}`);
}

function info(message) {
  log('cyan', `ℹ️  ${message}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log('blue', `  ${title}`);
  console.log('='.repeat(60) + '\n');
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function assert(condition, testName) {
  if (condition) {
    success(testName);
    testResults.passed++;
    testResults.tests.push({ name: testName, passed: true });
    return true;
  } else {
    error(testName);
    testResults.failed++;
    testResults.tests.push({ name: testName, passed: false });
    return false;
  }
}

/**
 * Test 1: Agent Initialization
 */
async function testAgentInitialization() {
  section('TEST 1: Agent Initialization');

  try {
    const stefan = new StefanAgent('stefan_test_uid');
    assert(stefan.name === 'Stefan', 'Stefan agent name correct');
    assert(stefan.role === 'parent', 'Stefan role correct');
    assert(stefan.personality.awareness === 0.30, 'Stefan awareness starts at 30%');
    assert(stefan.currentState.mentalLoad === 0.30, 'Stefan mental load starts at 30%');

    const kimberly = new KimberlyAgent('kimberly_test_uid');
    assert(kimberly.name === 'Kimberly', 'Kimberly agent name correct');
    assert(kimberly.currentState.mentalLoad === 0.87, 'Kimberly mental load starts at 87%');
    assert(kimberly.behaviorPatterns.taskCreationRate === 0.85, 'Kimberly creates 85% of tasks');

    const lillian = new LillianAgent('lillian_test_uid');
    assert(lillian.name === 'Lillian', 'Lillian agent name correct');
    assert(lillian.age === 14, 'Lillian age correct');
    assert(lillian.allieSkepticism === 0.70, 'Lillian starts skeptical (70%)');

    const oly = new OlyAgent('oly_test_uid');
    assert(oly.name === 'Oly', 'Oly agent name correct');
    assert(oly.age === 11, 'Oly age correct');
    assert(oly.questionFrequency === 'very_high', 'Oly asks lots of questions');

    const tegner = new TegnerAgent('tegner_test_uid');
    assert(tegner.name === 'Tegner', 'Tegner agent name correct');
    assert(tegner.age === 7, 'Tegner age correct');
    assert(tegner.energyLevel === 0.95, 'Tegner has very high energy');
    assert(tegner.boredomThreshold === 8, 'Tegner boredom threshold correct (15 - age)');

    success('All 5 agents initialized successfully!');
    return true;

  } catch (err) {
    error(`Agent initialization failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 2: Personality Traits
 */
async function testPersonalityTraits() {
  section('TEST 2: Personality Traits');

  const stefan = new StefanAgent('stefan_test_uid');
  const kimberly = new KimberlyAgent('kimberly_test_uid');

  // Stefan traits
  assert(stefan.personality.helpfulness === 0.80, 'Stefan helpfulness 80%');
  assert(stefan.personality.awareness === 0.30, 'Stefan awareness 30% (grows to 80%)');
  assert(stefan.personality.followThrough === 0.90, 'Stefan follow-through 90%');
  assert(stefan.behaviorPatterns.responseStyle === 'brief', 'Stefan response style: brief');

  // Kimberly traits
  assert(kimberly.personality.helpfulness === 1.00, 'Kimberly helpfulness 100%');
  assert(kimberly.personality.awareness === 0.95, 'Kimberly awareness 95%');
  assert(kimberly.behaviorPatterns.responseStyle === 'detailed', 'Kimberly response style: detailed');

  // Perception gap
  assert(stefan.perceptionGap === 0.44, 'Stefan perception gap 44 points');
  info(`Stefan thinks Kimberly has 43% load, actually ${kimberly.currentState.mentalLoad * 100}%`);

  return true;
}

/**
 * Test 3: Transformation Phases
 */
async function testTransformationPhases() {
  section('TEST 3: Transformation Phases');

  const stefan = new StefanAgent('stefan_test_uid');

  // Initial phase
  assert(stefan.transformationPhase === 'chaos', 'Stefan starts in chaos phase');
  assert(stefan.personality.awareness === 0.30, 'Initial awareness 30%');

  // Advance to discovery
  stefan.advancePhase('discovery');
  assert(stefan.transformationPhase === 'discovery', 'Stefan advances to discovery');
  assert(stefan.personality.awareness === 0.55, 'Awareness increases to 55%');
  assert(stefan.perceptionGap === 0.30, 'Perception gap shrinks');

  // Advance to integration
  stefan.advancePhase('integration');
  assert(stefan.transformationPhase === 'integration', 'Stefan advances to integration');
  assert(stefan.personality.awareness === 0.70, 'Awareness increases to 70%');
  assert(stefan.behaviorPatterns.taskCreationRate === 0.30, 'Task creation increases to 30%');

  // Advance to balanced
  stefan.advancePhase('balanced');
  assert(stefan.transformationPhase === 'balanced', 'Stefan advances to balanced');
  assert(stefan.personality.awareness === 0.80, 'Awareness increases to 80%');
  assert(stefan.currentState.mentalLoad === 0.48, 'Mental load balanced at 48%');

  // Test Kimberly relief
  const kimberly = new KimberlyAgent('kimberly_test_uid');
  const initialStress = kimberly.currentState.mentalLoad;

  kimberly.advancePhase('balanced');
  assert(kimberly.currentState.mentalLoad === 0.62, 'Kimberly mental load drops to 62%');
  assert(kimberly.reliefMetrics.stressReductionPercent === 54, 'Kimberly stress reduced 54%');

  const relief = initialStress - kimberly.currentState.mentalLoad;
  success(`Kimberly relief: ${(relief * 100).toFixed(0)}% reduction in mental load!`);

  return true;
}

/**
 * Test 4: Decision-Making (with Claude API)
 */
async function testDecisionMaking() {
  section('TEST 4: Decision-Making with Claude API');

  info('Testing Stefan\'s decision-making...');

  const stefan = new StefanAgent('stefan_test_uid');

  const context = {
    situation: 'It\'s Saturday morning. You notice the dishes need to be done and Kimberly mentioned Oly has science club on Thursday.',
    availableActions: [
      { type: 'do_dishes', description: 'Do the dishes (visible task)' },
      { type: 'check_calendar', description: 'Check the calendar for Oly\'s science club' },
      { type: 'ask_kimberly', description: 'Ask Kimberly what needs to be done' },
      { type: 'wait', description: 'Continue watching TV' }
    ]
  };

  try {
    info('Calling Claude API for Stefan\'s decision...');
    const decision = await stefan.decideNextAction(context);

    assert(decision.action !== undefined, 'Stefan made a decision');
    assert(decision.data !== undefined, 'Decision has data');
    assert(decision.timestamp !== undefined, 'Decision has timestamp');

    console.log('\n📊 Stefan\'s Decision:');
    console.log(JSON.stringify(decision, null, 2));

    // Stefan prefers visible tasks initially
    if (decision.action === 'do_dishes' || decision.action === 'wait') {
      success('Stefan chose a typical chaos-phase action (visible task or wait)');
    }

    success('Decision-making with Claude API works!');
    return true;

  } catch (err) {
    if (err.message.includes('API key')) {
      error('Claude API key not set - skipping decision test');
      info('Set ANTHROPIC_API_KEY environment variable to test decision-making');
      return true; // Don't fail test if API key not set
    } else {
      error(`Decision-making failed: ${err.message}`);
      return false;
    }
  }
}

/**
 * Test 5: Child Agent Behaviors
 */
async function testChildAgents() {
  section('TEST 5: Child Agent Behaviors');

  const lillian = new LillianAgent('lillian_test_uid');
  const oly = new OlyAgent('oly_test_uid');
  const tegner = new TegnerAgent('tegner_test_uid');

  // Lillian
  assert(lillian.activities.length > 0, 'Lillian has activities');
  assert(lillian.choreHabits.length > 0, 'Lillian has chore habits');
  assert(lillian.choreHabits[0].title === 'Water plants', 'Lillian waters plants daily');

  // Oly
  const olyQuestion = await oly.askAllieQuestion('science');
  assert(olyQuestion.question.length > 0, 'Oly asks science questions');
  assert(olyQuestion.followUpQuestions === 2, 'Oly always has follow-up questions');
  info(`Oly asks: "${olyQuestion.question}"`);

  // Tegner
  const tegnerBoredom = tegner.expressBoredom();
  assert(tegnerBoredom.expression.length > 0, 'Tegner expresses boredom');
  assert(tegnerBoredom.volume === 'loud', 'Tegner is loud when bored');
  info(`Tegner says: "${tegnerBoredom.expression}"`);

  // Tegner's sleep improvement
  tegner.advancePhase('balanced');

  // Verify bedtime routine method exists and works
  if (typeof tegner.bedtimeRoutine === 'function') {
    const bedtime = await tegner.bedtimeRoutine();
    assert(bedtime.sleepImprovement === 0.40, 'Tegner sleep improves 40%');
    assert(bedtime.routine === 'Stefan reads stories', 'Stefan reads bedtime stories');
  } else {
    // Fallback test - check sleep quality improved
    assert(tegner.sleepQuality === 0.84, 'Tegner sleep quality at 84% (40% improvement from 60%)');
    success('Tegner sleep improved through transformation');
  }

  return true;
}

/**
 * Test 6: Behavior Patterns
 */
async function testBehaviorPatterns() {
  section('TEST 6: Behavior Patterns');

  const stefan = new StefanAgent('stefan_test_uid');
  const kimberly = new KimberlyAgent('kimberly_test_uid');

  // Stefan's task generation
  const stefanTasks = stefan.generateTypicalTasks();
  assert(stefanTasks.length > 0, 'Stefan generates tasks');
  const visibleTasks = stefanTasks.filter(t => ['chore', 'errand', 'maintenance'].includes(t.category));
  assert(visibleTasks.length >= 3, 'Stefan prefers visible tasks initially');
  info(`Stefan's typical tasks: ${stefanTasks.map(t => t.title).join(', ')}`);

  // Kimberly's invisible labor
  const kimberlyTasks = kimberly.generateTypicalTasks();
  assert(kimberlyTasks.length > 0, 'Kimberly generates tasks');
  const invisibleTasks = kimberlyTasks.filter(t => ['anticipation', 'coordination', 'monitoring'].includes(t.category));
  assert(invisibleTasks.length >= 3, 'Kimberly has lots of invisible labor tasks');
  info(`Kimberly's invisible labor: ${invisibleTasks.map(t => t.title).join(', ')}`);

  // Calendar check patterns
  const stefanCalendar = await stefan.checkCalendar();
  const kimberlyCalendar = await kimberly.checkCalendar();

  assert(stefanCalendar.frequency === 'weekly', 'Stefan checks calendar weekly initially');
  assert(kimberlyCalendar.frequency === 'multiple_daily', 'Kimberly checks calendar multiple times daily');
  assert(kimberlyCalendar.timesPerDay === 4, 'Kimberly checks calendar 4x/day in chaos phase');

  return true;
}

/**
 * Test 7: Survey Responses
 */
async function testSurveyResponses() {
  section('TEST 7: Survey Responses');

  const stefan = new StefanAgent('stefan_test_uid');
  const kimberly = new KimberlyAgent('kimberly_test_uid');

  // Stefan's survey style
  const stefanWeekly = await stefan.completeSurvey('weekly_checkin');
  if (stefanWeekly.completed) {
    assert(stefanWeekly.time === '5 minutes', 'Stefan takes 5-min version');
    assert(stefanWeekly.completeness === 'basic', 'Stefan skips open-ended questions');
    assert(stefanWeekly.responseStyle === 'brief', 'Stefan gives brief responses');
  } else {
    info('Stefan skipped survey (realistic - 50% completion rate)');
  }

  // Stefan's Fair Play assessment
  const stefanFairPlay = await stefan.completeSurvey('fair_play_assessment');
  if (stefanFairPlay.completed) {
    assert(stefanFairPlay.time === '45 minutes', 'Stefan takes 45 min for Fair Play');
    assert(stefanFairPlay.midSurveyRealization === true, 'Stefan has "aha moment" mid-survey');
    info('Stefan realizes: "Wait, Kimberly does ALL of this?"');
  }

  // Kimberly's survey style
  const kimberlyWeekly = await kimberly.completeSurvey('weekly_checkin');
  if (kimberlyWeekly.completed) {
    assert(kimberlyWeekly.time === '15 minutes', 'Kimberly takes full 15-min version');
    assert(kimberlyWeekly.completeness === 'detailed', 'Kimberly answers all questions');
    assert(kimberlyWeekly.providesExamples === true, 'Kimberly provides detailed examples');
  }

  return true;
}

/**
 * Test 8: Allie Interaction
 */
async function testAllieInteraction() {
  section('TEST 8: Allie Interaction');

  const stefan = new StefanAgent('stefan_test_uid');
  const kimberly = new KimberlyAgent('kimberly_test_uid');
  const oly = new OlyAgent('oly_test_uid');

  // Stefan's response to Allie suggestion
  const suggestion = {
    type: 'coordination',
    title: 'Take Oly to science club Thursday 3:30pm',
    assignedBy: 'Allie'
  };

  const stefanResponse = await stefan.respondToSuggestion(suggestion);
  info(`Stefan: "${stefanResponse.responseText}" (accepted: ${stefanResponse.accepted})`);

  // Oly LOVES science suggestions
  const scienceSuggestion = {
    type: 'science_experiment',
    title: 'Volcano eruption experiment'
  };

  const olyResponse = await oly.respondToAllie(scienceSuggestion);
  assert(olyResponse.accepted === true, 'Oly accepts science suggestions enthusiastically');
  assert(olyResponse.confidence === 0.95, 'Oly very confident about science');
  info(`Oly: "${olyResponse.responseText}" (enthusiasm: ${olyResponse.enthusiasm})`);

  return true;
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n');
  log('cyan', '╔════════════════════════════════════════════════════════════╗');
  log('cyan', '║   PALSSON FAMILY AGENT TEST SUITE                          ║');
  log('cyan', '╚════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    log('yellow', '\n⚠️  WARNING: ANTHROPIC_API_KEY not set');
    log('yellow', '   Decision-making test will be skipped');
    log('yellow', '   To test with Claude API: export ANTHROPIC_API_KEY=your-key\n');
  }

  try {
    // Run all tests
    await testAgentInitialization();
    await testPersonalityTraits();
    await testTransformationPhases();
    await testDecisionMaking();
    await testChildAgents();
    await testBehaviorPatterns();
    await testSurveyResponses();
    await testAllieInteraction();

    // Print results
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n');
    log('cyan', '╔════════════════════════════════════════════════════════════╗');
    log('cyan', '║   TEST RESULTS                                              ║');
    log('cyan', '╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    success(`Passed: ${testResults.passed}`);
    if (testResults.failed > 0) {
      error(`Failed: ${testResults.failed}`);
    }
    console.log(`Duration: ${duration}s\n`);

    if (testResults.failed === 0) {
      log('green', '🎉 ALL TESTS PASSED! Ready to build AgentOrchestrator!');
      console.log('\n✨ Next step: Run the orchestrator to simulate 1 year!\n');
      return true;
    } else {
      log('red', '❌ Some tests failed. Fix errors before proceeding.');
      return false;
    }

  } catch (err) {
    error(`\nTest suite crashed: ${err.message}`);
    console.error(err.stack);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runAllTests };
