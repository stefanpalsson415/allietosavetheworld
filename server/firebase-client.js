// Firebase client configuration for server use
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZL3M1GKJYZ-XApLYIJ6WeS6e7g6MmW-E",
  authDomain: "parentload-ba995.firebaseapp.com",
  projectId: "parentload-ba995",
  storageBucket: "parentload-ba995.appspot.com",
  messagingSenderId: "698155115015",
  appId: "1:698155115015:web:6e28f3e88fa2ea96a9fa40",
  measurementId: "G-QBJPGY4GYT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { db, auth };