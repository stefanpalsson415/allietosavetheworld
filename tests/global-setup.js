// tests/global-setup.js - Global setup for Playwright tests
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

/**
 * Global setup for Playwright tests
 * This file handles environment preparation before any tests run
 */
module.exports = async config => {
  // Create test results directory if it doesn't exist
  const testResultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }

  // Log setup information for debugging
  console.log('Starting global test setup...');
  console.log(`Test environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Test URL: ${config.projects[0].use.baseURL}`);
  
  // Create a browser instance for global setup tasks if needed
  // This can be used for things like prefetched authentication
  // that can then be shared with tests via cookies/storage
  if (process.env.SETUP_AUTH === 'true') {
    console.log('Setting up authentication state...');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      // Navigate to login page and authenticate
      await page.goto(`${config.projects[0].use.baseURL}/login`);
      
      // Example: basic login flow
      await page.fill('#email', process.env.TEST_USERNAME || 'test@example.com');
      await page.fill('#password', process.env.TEST_PASSWORD || 'password');
      await page.click('button[type="submit"]');
      
      // Wait for successful login indicator
      await page.waitForSelector('.dashboard, .home-page, [data-testid="dashboard"]', { timeout: 10000 })
        .catch(() => console.log('Login verification element not found, but continuing'));
      
      // Store authentication state for tests to use
      await page.context().storageState({ path: 'tests/.auth/user.json' });
      console.log('✅ Authentication state saved');
    } catch (error) {
      console.error('❌ Authentication setup failed:', error);
    } finally {
      // Always close the browser
      await browser.close();
    }
  }
  
  // Ensure test-results directories exist for screenshots, videos, etc.
  const dirs = [
    path.join(testResultsDir, 'screenshots'),
    path.join(testResultsDir, 'videos'),
    path.join(testResultsDir, 'traces')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Create .auth directory for saved authentication state if needed
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  console.log('Global setup complete. Tests ready to run.');
  
  // Return an object that will be provided to tests
  return {
    // Storage state file path that tests can use to reuse authentication
    authFile: path.join(__dirname, '.auth', 'user.json'),
    // Test env info that tests can access
    testInfo: {
      setup: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  };
};