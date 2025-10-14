// Simple Firebase client (not admin) for backend
// This uses the same client SDK as the frontend, avoiding credential issues

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

// Same config as frontend
const firebaseConfig = {
  apiKey: "AIzaSyBKkCKFrMGUVZXRXCbM_I35KpqOr9DWBPo",
  authDomain: "parentload-ba995.firebaseapp.com",
  projectId: "parentload-ba995",
  storageBucket: "parentload-ba995.appspot.com",
  messagingSenderId: "287915613247",
  appId: "1:287915613247:web:e0ba37285170dc0088df18",
  measurementId: "G-HWYT4J09S9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { db, auth };