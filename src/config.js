// src/config.js
const config = {
  backend: {
    url: process.env.NODE_ENV === 'production'
      ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/auth'
      : 'http://localhost:3002/api/auth'
  },
  stripe: {
    publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
    prices: {
      monthly: process.env.REACT_APP_STRIPE_MONTHLY_PRICE_ID || 'price_1SLhErKrwosuk0SZe75qGPCC',
      annual: process.env.REACT_APP_STRIPE_ANNUAL_PRICE_ID || 'price_1SLhGTKrwosuk0SZYGZDu9Gl'
    }
  },
  payment: {
    validCoupons: ['olytheawesome', 'freeforallie', 'familyfirst'],
    tempPasswordPrefix: process.env.REACT_APP_TEMP_PASSWORD_PREFIX || 'Allie2024',
    pricing: {
      monthly: {
        sek: 299,
        eur: 29.99,
        usd: 29.99
      },
      annual: {
        sek: 2599,
        eur: 259,
        usd: 259
      }
    }
  }
};

export default config;