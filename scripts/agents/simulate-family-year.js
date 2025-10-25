#!/usr/bin/env node
/**
 * simulate-family-year.js - Run 1-Year Palsson Family Agent Simulation
 *
 * This script runs a full year simulation of the Palsson family using AI agents:
 * - Stefan (Dad) - Low awareness → High awareness
 * - Kimberly (Mom) - High mental load → Balanced
 * - Lillian (14) - Skeptical → Helpful
 * - Oly (11) - Curious → Contributing
 * - Tegner (7) - Chaotic energy → Engaged learner
 *
 * The simulation generates:
 * - 2,400+ calendar events
 * - 1,800+ tasks
 * - 450+ documents
 * - 5,000+ Allie interactions
 *
 * Usage:
 *   # Dry run (no Firestore writes, fast test)
 *   node scripts/agents/simulate-family-year.js --dry-run
 *
 *   # Full simulation with Firestore writes
 *   node scripts/agents/simulate-family-year.js --write
 *
 *   # Use existing family
 *   node scripts/agents/simulate-family-year.js --family-id=existing_id --dry-run
 *
 *   # Adjust speed (1x = real time, 100x = 100x faster)
 *   node scripts/agents/simulate-family-year.js --speed=1000 --dry-run
 */

const AgentOrchestrator = require('./AgentOrchestrator');
const { createPalssonFamily } = require('./create-agent-family');
const admin = require('firebase-admin');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || !args.includes('--write');
const speedMultiplier = parseInt(args.find(arg => arg.startsWith('--speed='))?.split('=')[1]) || 100;
const familyId = args.find(arg => arg.startsWith('--family-id='))?.split('=')[1];
const verbose = !args.includes('--quiet');

/**
 * Main simulation function
 */
async function runSimulation() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   PALSSON FAMILY AGENT SIMULATION                          ║');
  console.log('║   1 Year of Family Transformation                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Initialize Firebase Admin SDK if not dry run
  let db;
  if (!dryRun) {
    const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
        databaseURL: 'https://parentload-ba995.firebaseio.com'
      });
    }

    db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized\n');
  }

  // Create or get family
  let family;
  if (familyId) {
    console.log(`📁 Using existing family: ${familyId}\n`);
    family = {
      familyId,
      userIds: {
        stefan: 'stefan_palsson_agent',
        kimberly: 'kimberly_palsson_agent',
        lillian: 'lillian_palsson_agent',
        oly: 'oly_palsson_agent',
        tegner: 'tegner_palsson_agent'
      }
    };
  } else {
    console.log('👨‍👩‍👧‍👦 Creating new Palsson family...\n');
    family = await createPalssonFamily();
    console.log('');
  }

  // Initialize orchestrator
  const orchestrator = new AgentOrchestrator({
    familyId: family.familyId,
    speedMultiplier,
    dryRun,
    verbose,
    startDate: new Date('2025-01-01')
  });

  // Initialize all 5 agents
  orchestrator.initializeAgents(family.userIds);

  console.log('\n⚙️  SIMULATION SETTINGS:');
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no Firestore writes)' : 'LIVE (writes to Firestore)'}`);
  console.log(`   Speed: ${speedMultiplier}x real time`);
  console.log(`   Start Date: 2025-01-01`);
  console.log(`   Duration: 365 days (1 year)`);
  console.log(`   Verbose: ${verbose ? 'Yes' : 'No'}\n`);

  // Confirm before running live
  if (!dryRun) {
    console.log('⚠️  WARNING: This will write data to Firestore!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Run the simulation
  console.log('🚀 Starting simulation...\n');
  const startTime = Date.now();

  try {
    const results = await orchestrator.runYearSimulation();

    // Print results
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   SIMULATION RESULTS                                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const actualDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    const realTimeEquivalent = (365 * 24 * 60 * 60 / speedMultiplier).toFixed(0); // seconds

    console.log(`⏱️  Performance:`);
    console.log(`   Actual Duration: ${actualDuration}s`);
    console.log(`   Simulated Time: 365 days (1 year)`);
    console.log(`   Speed Factor: ${(365 * 24 * 60 * 60 / actualDuration).toFixed(0)}x real time`);
    console.log(`   Events Generated: ${results.eventLog.length.toLocaleString()}\n`);

    console.log(`📊 Data Generated:`);
    console.log(`   Calendar Events: ${results.stats.calendarEvents.toLocaleString()}`);
    console.log(`   Tasks Created: ${results.stats.tasksCreated.toLocaleString()}`);
    console.log(`   Allie Interactions: ${results.stats.allieInteractions.toLocaleString()}\n`);

    console.log(`✅ SIMULATION COMPLETE!`);

    if (dryRun) {
      console.log(`\n💡 TIP: Run with --write to save data to Firestore`);
      console.log(`   node scripts/agents/simulate-family-year.js --write --family-id=${family.familyId}\n`);
    }

    // Save event log to file
    const fs = require('fs');
    const outputPath = path.resolve(__dirname, `../../simulation-results-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify({
      familyId: family.familyId,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      duration: actualDuration,
      stats: results.stats,
      eventLog: results.eventLog.slice(0, 100) // Save first 100 events as sample
    }, null, 2));

    console.log(`📁 Results saved to: ${outputPath}\n`);

    return results;

  } catch (error) {
    console.error('\n❌ Simulation failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runSimulation()
    .then(() => {
      console.log('✅ Script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { runSimulation };
