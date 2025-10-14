// playwright.production.config.js
// Configuration for testing against production (checkallie.com)
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Production testing configuration
 * Points to https://checkallie.com instead of localhost
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,

  expect: {
    timeout: 10000
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/production-test-results.json' }]
  ],

  use: {
    // PRODUCTION URL - Tests run against live site
    baseURL: 'https://checkallie.com',

    trace: 'retain-on-failure', // Only on failures for production
    screenshot: 'only-on-failure', // Only on failures for production
    video: 'retain-on-failure', // Only on failures for production

    viewport: { width: 1280, height: 900 },
    navigationTimeout: 15000,
    actionTimeout: 10000,
    ignoreHTTPSErrors: true,
    bypassCSP: true,

    launchOptions: {
      args: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
      ]
    }
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        // Use stored auth from local testing
        storageState: 'tests/.auth/user.json',
      },
    },
  ],

  // No webServer needed - testing against production!
  outputDir: 'test-results/production',
});
