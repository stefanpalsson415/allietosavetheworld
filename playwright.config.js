// playwright.config.js
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 * Enhanced configuration with more resilient test settings
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for - optimized for faster execution */
  timeout: 30 * 1000, // 30 seconds (was 120s)

  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 10000 // 10 seconds (was 20s)
  },

  /* Run tests in parallel for faster execution */
  fullyParallel: true, // Enable parallel execution

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry tests to overcome transient failures */
  retries: process.env.CI ? 2 : 1, // Retry once in dev, twice in CI

  /* Enable parallel execution with 4 workers */
  workers: process.env.CI ? 2 : 4, // 4 parallel workers in dev, 2 in CI
  
  /* Reporter to use - more detailed reporting for debugging test failures */
  reporter: [
    ['html', { open: 'never' }], 
    ['list'],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace for all test runs for better debugging */
    trace: 'on', // Capture trace for all test runs
    
    /* Take screenshots for all tests to help debug issues */
    screenshot: 'on', // Take screenshots for all tests
    
    /* Record video for all tests to help debug UI interactions */
    video: 'on', // Capture video for all tests
    
    /* Viewport size - larger to ensure all elements are visible */
    viewport: { width: 1280, height: 900 },
    
    /* Optimized timeouts for faster test execution */
    navigationTimeout: 15000, // 15 seconds (was 60s)

    /* Actionability checks to ensure elements are ready */
    actionTimeout: 10000, // 10 seconds (was 30s)

    /* Other useful settings */
    ignoreHTTPSErrors: true, // Ignore HTTPS errors
    bypassCSP: true, // Bypass Content-Security-Policy

    /* Launch options optimized for speed */
    launchOptions: {
      // slowMo removed - was slowing tests by 300ms per action
      args: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
      ]
    }
  },

  /* Configure projects for major browsers */
  projects: [
    /* Setup project - runs auth.setup.js for OTP-based login */
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
      timeout: 360000, // 6 minutes for manual login
    },

    /* Main testing target - Chrome with larger viewport and stored auth */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        // Use stored authentication state from setup project
        storageState: 'tests/.auth/user.json',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins',
            '--disable-site-isolation-trials',
            '--window-size=1280,900'
          ]
        }
      },
      // dependencies: ['setup'], // Commented out - auth file already captured
    },
    /* Firefox tests */
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    /* Safari tests */
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Mobile tests - for responsive design testing */
    {
      name: 'mobile',
      use: { 
        ...devices['Pixel 5'],
        // Set longer timeouts for mobile where operations can be slower
        actionTimeout: 45000,
        navigationTimeout: 75000
      },
    },
  ],

  /* Run your local dev server before starting the tests with more reliable settings */
  webServer: {
    command: 'npm run start',
    port: 3000,
    timeout: 120 * 1000, // 2 minutes to allow server to start up fully
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  
  /* Output location for test artifacts */
  outputDir: 'test-results',

  /* Global setup */
  globalSetup: require.resolve('./tests/global-setup.js'),
});