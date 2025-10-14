/**
 * Cron Job for Task Weight API Evolution
 * 
 * Scheduled job to run the weight evolution cycle automatically
 * Can be deployed as a standalone process or as a Cloud Function
 */

const cron = require('node-cron');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Logger setup
const winston = require('winston');
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'task-weight-cron' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// API base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  logger.error('ADMIN_API_KEY environment variable is not set!');
  process.exit(1);
}

// Config for cron schedules
const cronConfig = {
  // Run feedback processing every 6 hours
  feedbackProcessing: process.env.CRON_FEEDBACK_PROCESSING || '0 */6 * * *',
  
  // Run full evolution cycle daily at 2 AM
  evolutionCycle: process.env.CRON_EVOLUTION_CYCLE || '0 2 * * *',
  
  // Run profile correlation analysis weekly on Sunday at 3 AM
  profileCorrelations: process.env.CRON_PROFILE_CORRELATIONS || '0 3 * * 0'
};

/**
 * Schedule the feedback processing job
 */
function scheduleFeedbackProcessing() {
  logger.info(`Scheduling feedback processing job: ${cronConfig.feedbackProcessing}`);
  
  cron.schedule(cronConfig.feedbackProcessing, async () => {
    try {
      logger.info('Running scheduled feedback processing');
      
      const response = await axios.post(`${API_BASE_URL}/evolution/process-feedback`, {}, {
        headers: {
          'x-api-key': ADMIN_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        logger.info('Feedback processing completed successfully', { 
          processed: response.data.processed,
          globalAdjustments: Object.keys(response.data.globalAdjustments || {}).length,
          familyAdjustments: Object.keys(response.data.familyAdjustments || {}).length
        });
      } else {
        logger.error('Feedback processing failed', { status: response.status });
      }
    } catch (error) {
      logger.error('Error running feedback processing job', { 
        error: error.message,
        response: error.response?.data
      });
    }
  });
}

/**
 * Schedule the evolution cycle job
 */
function scheduleEvolutionCycle() {
  logger.info(`Scheduling evolution cycle job: ${cronConfig.evolutionCycle}`);
  
  cron.schedule(cronConfig.evolutionCycle, async () => {
    try {
      logger.info('Running scheduled evolution cycle');
      
      const response = await axios.post(`${API_BASE_URL}/evolution/cycle`, {}, {
        headers: {
          'x-api-key': ADMIN_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        logger.info('Evolution cycle completed successfully', { 
          feedbackProcessed: response.data.feedbackProcessed,
          globalAdjustmentsApplied: response.data.globalAdjustmentsApplied,
          familyAdjustmentsApplied: response.data.familyAdjustmentsApplied,
          correlationsFound: response.data.correlationsFound
        });
      } else {
        logger.error('Evolution cycle failed', { status: response.status });
      }
    } catch (error) {
      logger.error('Error running evolution cycle job', { 
        error: error.message,
        response: error.response?.data
      });
    }
  });
}

/**
 * Schedule the profile correlations job
 */
function scheduleProfileCorrelations() {
  logger.info(`Scheduling profile correlations job: ${cronConfig.profileCorrelations}`);
  
  cron.schedule(cronConfig.profileCorrelations, async () => {
    try {
      logger.info('Running scheduled profile correlations analysis');
      
      const response = await axios.get(`${API_BASE_URL}/evolution/profile-correlations`, {
        headers: {
          'x-api-key': ADMIN_API_KEY
        }
      });
      
      if (response.status === 200) {
        logger.info('Profile correlations analysis completed successfully', { 
          correlationsFound: response.data.correlations.length
        });
      } else {
        logger.error('Profile correlations analysis failed', { status: response.status });
      }
    } catch (error) {
      logger.error('Error running profile correlations job', { 
        error: error.message,
        response: error.response?.data
      });
    }
  });
}

/**
 * Initialize all scheduled jobs
 */
function initScheduledJobs() {
  scheduleFeedbackProcessing();
  scheduleEvolutionCycle();
  scheduleProfileCorrelations();
  
  logger.info('All scheduled jobs initialized');
}

// Run immediately if executed directly
if (require.main === module) {
  logger.info('Starting Task Weight Evolution cron service');
  initScheduledJobs();
} else {
  // Export for programmatic usage
  module.exports = { initScheduledJobs };
}