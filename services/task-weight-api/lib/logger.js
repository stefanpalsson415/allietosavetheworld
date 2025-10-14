/**
 * Logger Module for Task Weight API
 * 
 * Provides structured logging using Winston
 * Configurable log levels, formats and destinations
 */

const winston = require('winston');
const { format } = winston;

// Determine environment
const environment = process.env.NODE_ENV || 'development';

// Define log level based on environment
const logLevel = environment === 'production' ? 'info' : 'debug';

// Create formatter
const customFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  defaultMeta: { service: 'task-weight-api' },
  transports: [
    // Write to console
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(info => {
          const { timestamp, level, message, ...meta } = info;
          const metaString = Object.keys(meta).length 
            ? JSON.stringify(meta, null, 2) 
            : '';
          return `${timestamp} [${level}]: ${message} ${metaString}`;
        })
      )
    })
  ]
});

// Add file transport in production
if (environment === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }));
  
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }));
}

// Create Express middleware for request logging
const requestLogger = (req, res, next) => {
  // Generate a request ID
  req.requestId = Math.random().toString(36).substring(2, 10);
  
  // Log request details
  logger.info(`Received ${req.method} request`, {
    requestId: req.requestId,
    path: req.path,
    params: req.params,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Capture response time
  const start = Date.now();
  
  // Log when request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Completed request in ${duration}ms`, {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration
    });
  });
  
  next();
};

// Export logger and middleware
module.exports = {
  ...logger,
  requestLogger
};