// Logger utility that only logs in development
const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, you might want to send errors to a service
      // like Sentry or LogRocket
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  // Production-safe logging that strips sensitive data
  logSafe: (message, data = {}) => {
    if (isDevelopment) {
      console.log(message, data);
    } else {
      // Strip sensitive fields in production
      const safeData = { ...data };
      delete safeData.password;
      delete safeData.token;
      delete safeData.apiKey;
      delete safeData.authToken;
      
      console.log(message, safeData);
    }
  }
};

export default logger;