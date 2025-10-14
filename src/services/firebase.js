// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs,
         doc, getDoc, updateDoc, deleteDoc, serverTimestamp, setDoc,
         writeBatch, orderBy, limit } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import config from '../config';
import logger from '../utils/logger';

// Firebase configuration with fallback
const firebaseConfig = config?.firebase || {
  apiKey: "AIzaSyALjXkZiFZ_Fy143N_dzdaUbyDCtabBr7Y",
  authDomain: "parentload-ba995.firebaseapp.com",
  projectId: "parentload-ba995",
  storageBucket: "parentload-ba995.firebasestorage.app",
  messagingSenderId: "363935868004",
  appId: "1:363935868004:web:8802abceeca81cc10deb71",
  measurementId: "G-7T846QZH0J"
};

// Validate config exists
if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.error("Firebase configuration is missing or invalid:", firebaseConfig);
  throw new Error("Firebase configuration is required");
}

// IMPORTANT: Ensure Firebase initialization is properly logged
logger.info("🔥 Firebase module initialization starting");
console.log("🔥 Firebase config:", Object.keys(firebaseConfig).join(", "));

// Initialize Firebase app FIRST, before any services
const app = initializeApp(firebaseConfig);
logger.info("🔥 Firebase app initialized:", app.name);

// Then initialize services
const db = getFirestore(app);
logger.info("🔥 Firestore initialized");

const auth = getAuth(app);
logger.info("🔥 Firebase Auth initialized");

// CRITICAL FIX: Enable auth persistence so tokens are saved to localStorage
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    logger.info("🔥 Firebase Auth persistence enabled (browserLocalPersistence)");
    console.log("✅ Firebase auth will persist across page refreshes");
  })
  .catch((error) => {
    logger.error("❌ Failed to set auth persistence:", error);
    console.error("Firebase auth persistence error:", error);
  });

const storage = getStorage(app);
logger.info("🔥 Firebase Storage initialized");

const googleProvider = new GoogleAuthProvider();

// Add scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Force Google to show account selection screen every time
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Export Firestore operations directly to make them more accessible
export {
  collection, addDoc, query, where, getDocs,
  doc, getDoc, updateDoc, deleteDoc, serverTimestamp,
  setDoc, writeBatch, orderBy, limit
};

// Export app first, then services
export { app, db, auth, storage, googleProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword };

// For compatibility with existing code that expects a 'firebase' export
// Create a firebase object with full Firestore functionality
export const firebase = {
  // Provide access to Firestore functions
  firestore: function() {
    return {
      collection: (path) => {
        logger.debug(`Creating collection reference to ${path}`);
        return {
          doc: (id) => {
            logger.debug(`Creating document reference to ${path}/${id}`);
            const docRef = doc(db, path, id);
            return {
              set: (data) => {
                logger.debug(`Setting doc ${id} in ${path}`);
                return updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
              },
              update: (data) => {
                logger.debug(`Updating doc ${id} in ${path}`);
                return updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
              },
              get: () => {
                logger.debug(`Getting doc ${id} from ${path}`);
                return getDoc(docRef);
              },
              delete: () => {
                logger.debug(`Deleting doc ${id} from ${path}`);
                return deleteDoc(docRef);
              }
            };
          },
          add: (data) => {
            logger.debug(`Adding new doc to ${path} with data:`, data);
            return addDoc(collection(db, path), {
              ...data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          },
          where: (field, op, value) => {
            logger.debug(`Creating query on ${path} where ${field} ${op} ${value}`);
            const q = query(collection(db, path), where(field, op, value));
            return {
              orderBy: () => ({
                limit: () => ({
                  get: () => getDocs(q)
                }),
                get: () => getDocs(q)
              }),
              get: () => getDocs(q)
            };
          },
          orderBy: () => ({
            limit: () => ({
              get: () => getDocs(collection(db, path))
            }),
            get: () => getDocs(collection(db, path))
          }),
          get: () => getDocs(collection(db, path))
        };
      },
      FieldValue: {
        serverTimestamp: () => serverTimestamp()
      }
    };
  },
  auth: auth,
  storage: storage,
  apps: [app]
};

// IMPORTANT: Make Firebase available globally for compatibility
if (typeof window !== 'undefined') {
  logger.info("🔥 Setting up global Firebase reference");

  // Create a backward compatible legacy-style firebase for window scope
  const legacyFirebase = {
    initializeApp: initializeApp,
    apps: [app],
    app: () => app,
    auth: () => auth,
    firestore: () => {
      return {
        collection: (path) => {
          return {
            doc: (id) => {
              const docRef = doc(db, path, id);
              return {
                set: (data) => updateDoc(docRef, data),
                update: (data) => updateDoc(docRef, data),
                get: () => getDoc(docRef),
                delete: () => deleteDoc(docRef)
              };
            },
            add: (data) => addDoc(collection(db, path), data),
            where: (field, op, value) => {
              const q = query(collection(db, path), where(field, op, value));
              return {
                get: () => getDocs(q),
                orderBy: () => ({
                  get: () => getDocs(q)
                }),
                limit: () => ({
                  get: () => getDocs(q)
                })
              };
            },
            get: () => getDocs(collection(db, path))
          };
        },
        FieldValue: {
          serverTimestamp: () => serverTimestamp()
        }
      };
    },
    storage: () => storage
  };

  // Make firebase available in the window scope
  window.firebase = window.firebase || legacyFirebase;

  // Dispatch event when Firebase is fully loaded
  window.dispatchEvent(new Event('firebase-ready'));

  // Set diagnostic flag
  window._firebaseInitialized = true;
}

// Export a verification function
export function verifyFirebaseInitialized() {
  if (typeof window !== 'undefined') {
    const status = {
      app: !!app,
      db: !!db,
      auth: !!auth,
      storage: !!storage,
      window: !!window.firebase,
      initialized: !!window._firebaseInitialized
    };

    logger.info("🔍 Firebase initialization status:", status);
    return status;
  }
  return false;
}

// Verify initialization immediately
verifyFirebaseInitialized();