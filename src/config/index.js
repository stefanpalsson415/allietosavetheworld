// Centralized configuration with validation
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_MAPBOX_TOKEN'
];

// Validate environment variables
const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Missing environment variables:', missing.join(', '));
      console.warn('Using default values. Create a .env file based on .env.example');
    } else {
      // In production, log errors for missing critical variables
      console.error('❌ Missing required environment variables:', missing.join(', '));
    }
  }
  
  return missing.length === 0;
};

// Run validation on import
validateEnvironment();

const config = {
  // Firebase configuration
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyALjXkZiFZ_Fy143N_dzdaUbyDCtabBr7Y",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "parentload-ba995.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "parentload-ba995",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "parentload-ba995.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "363935868004",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:363935868004:web:8802abceeca81cc10deb71",
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-7T846QZH0J"
  },
  
  // Mapbox configuration
  mapbox: {
    accessToken: process.env.REACT_APP_MAPBOX_TOKEN || "pk.eyJ1Ijoic3BhbHNzb24iLCJhIjoiY21hN3lmMHE3MTF4eTJsc2dodXlhY3V6ZSJ9.LM8VtdOBYFVzGG0nfFjc2A"
  },
  
  // Backend URLs
  backend: {
    url: process.env.REACT_APP_BACKEND_URL || (
      process.env.NODE_ENV === 'production' 
        ? 'https://parentload-backend-363935868004.us-central1.run.app'
        : 'http://localhost:3002'
    ),
    claudeUrl: process.env.REACT_APP_CLAUDE_URL || (
      process.env.NODE_ENV === 'production'
        ? 'https://parentload-backend-363935868004.us-central1.run.app/api/claude'
        : 'http://localhost:3002/api/claude'
    )
  },
  
  // Payment configuration
  payment: {
    // Coupons now stored securely in environment variables
    // Set REACT_APP_VALID_COUPONS in .env as comma-separated values
    validCoupons: process.env.REACT_APP_VALID_COUPONS 
      ? process.env.REACT_APP_VALID_COUPONS.split(',').map(c => c.trim().toLowerCase())
      : [],
    tempPasswordPrefix: process.env.REACT_APP_TEMP_PASSWORD_PREFIX || 'Allie2024'
  },
  
  // Feature flags
  features: {
    enableLogging: process.env.NODE_ENV === 'development',
    enableDebugTools: process.env.NODE_ENV === 'development'
  }
};

// Export validation function for use in other modules
export { validateEnvironment };

export default config;