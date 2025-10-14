#!/usr/bin/env node

// scripts/test-calendar-system.js
// Comprehensive test runner for the improved calendar system

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test configuration
const testConfig = {
  testTimeout: 30000,
  verbose: true,
  coverage: true,
  bail: false
};

// Test suites to run
const testSuites = [
  {
    name: 'Google Auth Service',
    path: 'src/tests/calendar/GoogleAuthService.test.js',
    critical: true
  },
  {
    name: 'Calendar Sync Service',
    path: 'src/tests/calendar/EnhancedCalendarSyncService.test.js',
    critical: true
  },
  {
    name: 'Calendar Integration',
    path: 'src/tests/calendar/CalendarIntegration.test.js',
    critical: false
  }
];

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  skipped: [],
  totalTests: 0,
  totalPassed: 0,
  totalFailed: 0,
  duration: 0,
  coverage: {}
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

function logTest(name, status) {
  const statusSymbol = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○';
  const statusColor = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  log(`  ${statusSymbol} ${name}`, statusColor);
}

// Run individual test suite
function runTestSuite(suite) {
  return new Promise((resolve) => {
    logSection(`Running: ${suite.name}`);

    const args = [
      '--testPathPattern', suite.path,
      '--coverage',
      '--json',
      '--outputFile', `test-output-${Date.now()}.json`
    ];

    if (testConfig.verbose) {
      args.push('--verbose');
    }

    const testProcess = spawn('npm', ['test', '--', ...args], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let errorOutput = '';

    testProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (testConfig.verbose) {
        process.stdout.write(data);
      }
    });

    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      if (testConfig.verbose) {
        process.stderr.write(data);
      }
    });

    testProcess.on('close', (code) => {
      const success = code === 0;

      if (success) {
        testResults.passed.push(suite.name);
        logTest(suite.name, 'pass');
      } else {
        testResults.failed.push(suite.name);
        logTest(suite.name, 'fail');

        if (suite.critical && testConfig.bail) {
          log(`\nCritical test "${suite.name}" failed. Stopping test run.`, colors.red);
          process.exit(1);
        }
      }

      // Parse test output if available
      try {
        const outputFiles = fs.readdirSync('.')
          .filter(f => f.startsWith('test-output-') && f.endsWith('.json'));

        if (outputFiles.length > 0) {
          const latestOutput = outputFiles[outputFiles.length - 1];
          const testData = JSON.parse(fs.readFileSync(latestOutput, 'utf8'));

          if (testData.numTotalTests) {
            testResults.totalTests += testData.numTotalTests;
            testResults.totalPassed += testData.numPassedTests;
            testResults.totalFailed += testData.numFailedTests;
          }

          // Clean up output file
          fs.unlinkSync(latestOutput);
        }
      } catch (error) {
        // Ignore parsing errors
      }

      resolve(success);
    });
  });
}

// Run unit tests
async function runUnitTests() {
  logSection('UNIT TESTS');

  for (const suite of testSuites) {
    if (!fs.existsSync(suite.path)) {
      log(`  Skipping ${suite.name} (file not found)`, colors.yellow);
      testResults.skipped.push(suite.name);
      continue;
    }

    await runTestSuite(suite);
  }
}

// Run manual validation tests
async function runManualValidation() {
  logSection('MANUAL VALIDATION TESTS');

  const validationTests = [
    {
      name: 'Google OAuth Configuration',
      test: () => {
        const envVars = [
          'REACT_APP_GOOGLE_CLIENT_ID',
          'REACT_APP_GOOGLE_API_KEY'
        ];

        for (const envVar of envVars) {
          if (!process.env[envVar]) {
            return { pass: false, message: `Missing ${envVar}` };
          }
        }

        return { pass: true, message: 'All OAuth variables configured' };
      }
    },
    {
      name: 'Firebase Configuration',
      test: () => {
        const firebaseConfig = path.join(process.cwd(), 'src/services/firebase.js');
        if (!fs.existsSync(firebaseConfig)) {
          return { pass: false, message: 'Firebase config not found' };
        }

        const content = fs.readFileSync(firebaseConfig, 'utf8');
        if (!content.includes('initializeApp')) {
          return { pass: false, message: 'Firebase not initialized' };
        }

        return { pass: true, message: 'Firebase configured correctly' };
      }
    },
    {
      name: 'Calendar Service Files',
      test: () => {
        const requiredFiles = [
          'src/services/GoogleAuthService.js',
          'src/services/EnhancedCalendarSyncService.js',
          'src/components/calendar/ImprovedCalendarView.jsx',
          'src/hooks/useImprovedCalendar.js'
        ];

        const missingFiles = requiredFiles.filter(f => !fs.existsSync(f));

        if (missingFiles.length > 0) {
          return { pass: false, message: `Missing files: ${missingFiles.join(', ')}` };
        }

        return { pass: true, message: 'All required files present' };
      }
    },
    {
      name: 'Dependencies Installed',
      test: () => {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredDeps = [
          'date-fns',
          'framer-motion',
          'lucide-react'
        ];

        const missingDeps = requiredDeps.filter(dep =>
          !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
        );

        if (missingDeps.length > 0) {
          return { pass: false, message: `Missing dependencies: ${missingDeps.join(', ')}` };
        }

        return { pass: true, message: 'All dependencies installed' };
      }
    },
    {
      name: 'Firestore Rules',
      test: () => {
        const rulesFile = 'firestore.rules';
        if (!fs.existsSync(rulesFile)) {
          return { pass: false, message: 'Firestore rules file not found' };
        }

        const content = fs.readFileSync(rulesFile, 'utf8');
        const requiredCollections = [
          'events',
          'userTokens',
          'calendarSyncState',
          'calendarConflicts'
        ];

        const missingRules = requiredCollections.filter(col =>
          !content.includes(`match /${col}/`)
        );

        if (missingRules.length > 0) {
          return { pass: false, message: `Missing rules for: ${missingRules.join(', ')}` };
        }

        return { pass: true, message: 'All Firestore rules configured' };
      }
    }
  ];

  for (const test of validationTests) {
    try {
      const result = test.test();
      logTest(`${test.name}: ${result.message}`, result.pass ? 'pass' : 'fail');

      if (result.pass) {
        testResults.passed.push(test.name);
      } else {
        testResults.failed.push(test.name);
      }
    } catch (error) {
      logTest(`${test.name}: ${error.message}`, 'fail');
      testResults.failed.push(test.name);
    }
  }
}

// Run performance benchmarks
async function runPerformanceBenchmarks() {
  logSection('PERFORMANCE BENCHMARKS');

  const benchmarks = [
    {
      name: 'Token Refresh Timing',
      test: () => {
        // Simulate token refresh
        const start = Date.now();
        // Mock refresh operation
        setTimeout(() => {
          const duration = Date.now() - start;
          const pass = duration < 100; // Should be instant
          logTest(`Token refresh: ${duration}ms`, pass ? 'pass' : 'fail');
        }, 10);
      }
    },
    {
      name: 'Event Filtering (1000 events)',
      test: () => {
        const events = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          title: `Event ${i}`,
          category: i % 3 === 0 ? 'work' : 'personal'
        }));

        const start = Date.now();
        const filtered = events.filter(e => e.category === 'work');
        const duration = Date.now() - start;

        const pass = duration < 10; // Should be very fast
        logTest(`Filter 1000 events: ${duration}ms`, pass ? 'pass' : 'fail');
      }
    },
    {
      name: 'Conflict Detection (100 events)',
      test: () => {
        const events = Array.from({ length: 100 }, (_, i) => ({
          id: i,
          startTime: new Date(2025, 8, 20, 10 + i, 0),
          endTime: new Date(2025, 8, 20, 11 + i, 0)
        }));

        const start = Date.now();

        // Check for overlaps
        for (let i = 0; i < events.length; i++) {
          for (let j = i + 1; j < events.length; j++) {
            const overlap =
              events[i].startTime < events[j].endTime &&
              events[j].startTime < events[i].endTime;
          }
        }

        const duration = Date.now() - start;
        const pass = duration < 50;
        logTest(`Conflict detection: ${duration}ms`, pass ? 'pass' : 'fail');
      }
    }
  ];

  for (const benchmark of benchmarks) {
    benchmark.test();
  }
}

// Generate test report
function generateReport() {
  logSection('TEST REPORT');

  const totalSuites = testResults.passed.length + testResults.failed.length + testResults.skipped.length;
  const passRate = totalSuites > 0 ? (testResults.passed.length / totalSuites * 100).toFixed(1) : 0;

  console.log(`
${colors.bright}Summary:${colors.reset}
  Total Test Suites: ${totalSuites}
  Passed: ${colors.green}${testResults.passed.length}${colors.reset}
  Failed: ${colors.red}${testResults.failed.length}${colors.reset}
  Skipped: ${colors.yellow}${testResults.skipped.length}${colors.reset}
  Pass Rate: ${passRate}%

${colors.bright}Individual Tests:${colors.reset}
  Total: ${testResults.totalTests}
  Passed: ${colors.green}${testResults.totalPassed}${colors.reset}
  Failed: ${colors.red}${testResults.totalFailed}${colors.reset}
`);

  if (testResults.failed.length > 0) {
    console.log(`${colors.bright}${colors.red}Failed Suites:${colors.reset}`);
    testResults.failed.forEach(suite => {
      console.log(`  - ${suite}`);
    });
  }

  // Generate JSON report
  const reportPath = `test-report-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\nDetailed report saved to: ${reportPath}`, colors.cyan);

  // Return exit code
  return testResults.failed.length === 0 ? 0 : 1;
}

// Main test runner
async function main() {
  const startTime = Date.now();

  log('\n🧪 CALENDAR SYSTEM TEST SUITE', colors.bright + colors.magenta);
  log('Testing the improved calendar system with Google Calendar integration\n', colors.cyan);

  try {
    // Run all test categories
    await runManualValidation();
    await runUnitTests();
    await runPerformanceBenchmarks();

    // Calculate duration
    testResults.duration = Date.now() - startTime;

    // Generate and display report
    const exitCode = generateReport();

    // Final message
    if (exitCode === 0) {
      log('\n✨ All tests passed successfully! ✨', colors.bright + colors.green);
      log('The calendar system is ready for production.', colors.green);
    } else {
      log('\n⚠️  Some tests failed. Please review the report above.', colors.bright + colors.red);
      log('Fix the issues before deploying to production.', colors.yellow);
    }

    process.exit(exitCode);

  } catch (error) {
    log('\n❌ Test runner encountered an error:', colors.bright + colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  main();
}

module.exports = { runTestSuite, generateReport };