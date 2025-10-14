// src/config.js
const config = {
  backend: {
    url: process.env.NODE_ENV === 'production' 
      ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/auth'
      : 'http://localhost:3002/api/auth'
  }
};

export default config;