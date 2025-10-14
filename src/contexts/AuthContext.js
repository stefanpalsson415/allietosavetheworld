// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult } from 'firebase/auth';
import { db } from '../services/firebase';
import DatabaseService from '../services/DatabaseService';
import { doc, getDoc, query, collection, where, getDocs, orderBy, limit, setDoc, serverTimestamp } from 'firebase/firestore';
import googleAuthService from '../services/GoogleAuthService';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [effectiveUser, setEffectiveUser] = useState(null); // The user we're viewing the app as
  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState(null);
  const [availableFamilies, setAvailableFamilies] = useState([]);

  // Sign up function
  async function signup(email, password) {
    return DatabaseService.createUser(email, password);
  }

  // Login function
  async function login(email, password) {
    return DatabaseService.signIn(email, password);
  }

  // Magic link login function (mocked for now)
  async function loginWithMagicLink(email) {
    // In a real implementation, this would send an email with Firebase Auth
    // For now, we'll mock it
    console.log('Magic link login requested for:', email);
    return Promise.resolve({ email, magicLinkSent: true });
  }
  
  // Passwordless login with OTP
  async function loginWithOTP(email, familyId, customToken) {
    try {
      console.log('Starting OTP login for:', email, 'familyId:', familyId, 'customToken:', !!customToken);

      // If we have a custom token from the backend, use it to create a real Firebase Auth session
      if (customToken) {
        try {
          console.log('Signing in with custom token...');
          const { signInWithCustomToken } = await import('firebase/auth');
          const { auth } = await import('../services/firebase');
          const userCredential = await signInWithCustomToken(auth, customToken);
          console.log('Successfully signed in with custom token:', userCredential.user.uid);

          // The real Firebase user is now authenticated
          // Update the user document with familyId if needed
          const userDoc = doc(db, 'users', userCredential.user.uid);
          await setDoc(userDoc, {
            email: email,
            familyId: familyId,
            lastLogin: serverTimestamp()
          }, { merge: true });

          // Continue with normal flow - the auth state listener will handle the rest
          setCurrentUser(userCredential.user);
          setLoading(false);

          // Load family data
          if (familyId) {
            console.log('Loading family data for authenticated OTP user...');
            await loadFamilyData(familyId);
          }

          return { success: true, user: userCredential.user };
        } catch (tokenError) {
          console.error('Failed to sign in with custom token:', tokenError);
          // Fall back to fake user if token auth fails
        }
      }

      // Fallback: Create a fake user object if no custom token (old behavior)
      // This will be removed once custom token auth is working
      console.warn('No custom token provided, using fallback fake user (no real auth)');

      // Since OTP is already verified by the backend, we just need to:
      // 1. Create a session for the user
      // 2. Load their family data
      
      // Extract a display name from the email
      let userName = 'User'; // Default fallback
      if (email) {
        // Extract username from email (before @ symbol)
        const emailParts = email.split('@');
        if (emailParts.length > 0) {
          const emailName = emailParts[0];
          // Capitalize first letter
          userName = emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
          
          // Handle common email formats
          // stefan.palsson -> Stefan
          // stefan_palsson -> Stefan  
          // stefan-palsson -> Stefan
          if (userName.includes('.') || userName.includes('_') || userName.includes('-')) {
            const nameParts = userName.split(/[._-]/);
            if (nameParts.length > 0) {
              userName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
            }
          }
        }
      }
      
      // Set a temporary user object (OTP users don't have Firebase Auth)
      const otpUser = {
        uid: `otp_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: email,
        emailVerified: true,
        isOTPUser: true,
        familyId: familyId, // Store familyId with the user object
        displayName: userName, // Add display name
        name: userName // Add name field for compatibility
      };
      
      // Store OTP user session with all user data including userName
      localStorage.setItem('otpUserSession', JSON.stringify({
        user: otpUser,
        userId: otpUser.uid,
        userName: userName, // Store userName at top level for easy access
        userEmail: email,
        familyId: familyId,
        timestamp: Date.now()
      }));
      
      // Set the current user
      setCurrentUser(otpUser);
      setLoading(false);
      
      // Load family data if familyId is provided
      if (familyId) {
        console.log('Loading family data for OTP user...');
        await loadFamilyData(familyId);
      }
      
      return { success: true, user: otpUser };
    } catch (error) {
      console.error('Error in OTP login:', error);
      throw error;
    }
  }

  // Google Sign-In function
  async function signInWithGoogle(options = {}) {
    const {
      usePopup = false, // Default to redirect (more reliable)
      email = null, // Optional: email to validate against
      onProgress = null // Optional: callback for progress updates
    } = options;

    try {
      console.log('🔐 Starting Google Sign-In...', { usePopup, email });

      if (onProgress) onProgress('Initializing Google Sign-In...');

      // Create Google Auth Provider
      const provider = new GoogleAuthProvider();

      // Add calendar scopes
      provider.addScope('https://www.googleapis.com/auth/calendar');
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

      // Always show account picker
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      let userCredential;
      let accessToken;

      if (usePopup) {
        // Popup flow (may be blocked by browser)
        if (onProgress) onProgress('Opening Google Sign-In popup...');
        console.log('📱 Using popup flow');

        try {
          userCredential = await signInWithPopup(auth, provider);
          const credential = GoogleAuthProvider.credentialFromResult(userCredential);
          accessToken = credential?.accessToken;
          console.log('✅ Popup sign-in successful');
        } catch (popupError) {
          if (popupError.code === 'auth/popup-blocked') {
            throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
          }
          throw popupError;
        }
      } else {
        // Redirect flow (more reliable)
        console.log('🔄 Using redirect flow');

        // Check if we're returning from a redirect
        if (onProgress) onProgress('Checking for redirect result...');
        const redirectResult = await getRedirectResult(auth);

        if (redirectResult) {
          // We just returned from Google OAuth
          console.log('✅ Redirect result found');
          userCredential = redirectResult;
          const credential = GoogleAuthProvider.credentialFromResult(redirectResult);
          accessToken = credential?.accessToken;
        } else {
          // Start the redirect flow
          if (onProgress) onProgress('Redirecting to Google...');
          console.log('🔄 Starting redirect to Google');
          await signInWithRedirect(auth, provider);
          // Function will not continue past this point as page will redirect
          return { success: true, redirecting: true };
        }
      }

      // If we got here, authentication was successful
      const user = userCredential.user;
      console.log('✅ User authenticated:', user.email);

      // Validate email match if provided
      if (email && user.email && user.email.toLowerCase() !== email.toLowerCase()) {
        console.error('❌ Email mismatch!', { expected: email, got: user.email });
        await auth.signOut();
        throw new Error(`The Google account you selected (${user.email}) doesn't match the email you entered (${email}). Please try again with ${email}.`);
      }

      if (onProgress) onProgress('Setting up Google Calendar integration...');

      // Initialize GoogleAuthService for calendar integration
      if (accessToken) {
        try {
          await googleAuthService.handleTokenResponse({
            access_token: accessToken,
            expires_in: 3600,
            token_type: 'Bearer'
          });
          console.log('✅ GoogleAuthService initialized for calendar');
        } catch (serviceError) {
          console.warn('⚠️ GoogleAuthService init failed (non-blocking):', serviceError);
        }
      }

      if (onProgress) onProgress('Loading your family data...');

      // Load user's families
      try {
        const families = await loadAllFamilies(user.uid);
        console.log(`✅ Loaded ${families.length} families`);

        if (families && families.length > 0) {
          const primaryFamilyId = families[0].id || families[0].familyId;
          await loadFamilyData(primaryFamilyId);
          console.log('✅ Family data loaded');
        }
      } catch (familyError) {
        console.warn('⚠️ Could not load family data (user may need to create family):', familyError);
      }

      if (onProgress) onProgress('Sign-in complete!');

      return {
        success: true,
        user: user,
        accessToken: accessToken,
        needsFamily: !familyData || !familyData.familyId
      };

    } catch (error) {
      console.error('❌ Google Sign-In error:', error);

      // Provide user-friendly error messages
      let errorMessage = error.message || 'Failed to sign in with Google. Please try again.';

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google Sign-In. Please contact support.';
      }

      throw new Error(errorMessage);
    }
  }

  // Added helper function to ensure families are loaded
  async function ensureFamiliesLoaded(userId) {
    try {
      console.log("Ensuring families are loaded for user:", userId);
      
      // First load all families
      const families = await loadAllFamilies(userId);
      console.log("Found families:", families.length);
      
      // Then if there are families, load the primary family
      if (families && families.length > 0) {
        // Use the actual family ID, not the user ID
        const primaryFamilyId = families[0].id || families[0].familyId;
        await loadFamilyData(primaryFamilyId);
      }

      return families;
    } catch (error) {
      console.error("Error ensuring families are loaded:", error);
      throw error;
    }
  }

  // Logout function
  async function logout() {
    try {
      // Clear OTP user from state if present
      if (currentUser?.isOTPUser) {
        setCurrentUser(null);
        setEffectiveUser(null);
        setFamilyData(null);
        setAvailableFamilies([]);
      }
      
      // Call the database service signOut which handles both OTP and regular users
      await DatabaseService.signOut();
      
      return true;
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  }

  // Create a new family
  async function createFamily(familyData) {
    return DatabaseService.createFamily(familyData);
  }

  // Load family data
  async function loadFamilyData(idParam) {
    try {
      console.log("Loading family data for:", idParam);
      let data;
      
      // Special handling for OTP users
      if (currentUser?.isOTPUser) {
        // For OTP users, use the stored familyId
        const otpSession = localStorage.getItem('otpUserSession');
        if (otpSession) {
          const { familyId } = JSON.parse(otpSession);
          if (familyId && idParam && idParam.startsWith('otp_')) {
            // If trying to load by OTP user ID, use the stored familyId instead
            idParam = familyId;
            console.log("OTP user detected, using stored familyId:", familyId);
          }
        }
      }
      
      // Check if this is a direct family ID
      if (typeof idParam === 'string' && idParam.length > 0) {
        console.log("Attempting to load family directly");
        
        try {
          // Try to load the family directly from Firestore
          const docRef = doc(db, "families", idParam);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            // Load ALL survey responses (remove the 50 limit that was causing issues)
            console.log("Loading survey responses for family:", idParam);
            
            // Use DatabaseService to get properly formatted survey responses
            const surveyData = await DatabaseService.loadSurveyResponses(idParam);
            
            // The allResponses already has the correct memberId_questionId format
            const surveyResponses = surveyData.allResponses || {};
            
            console.log("Loaded survey responses:", {
              totalFound: surveyData.totalCount,
              formattedCount: Object.keys(surveyResponses).length,
              sampleKeys: Object.keys(surveyResponses).slice(0, 5)
            });
            
            data = { 
              ...docSnap.data(), 
              familyId: idParam,
              surveyResponses: surveyResponses
            };
            console.log("Successfully loaded family directly:", data);
          } else {
            console.log("No family found with ID:", idParam);
            // Instead of throwing an error, return null
            return null;
          }
        } catch (error) {
          console.error("Error loading family by ID:", error);
          // Don't throw, just return null
          return null;
        }
      } else {
        // Assume it's a user ID
        data = await DatabaseService.loadFamilyByUserId(idParam);
        console.log("Loaded family by user ID:", data);
      }
      
      if (!data || !data.familyId) {
        console.error("Invalid family data:", data);
        throw new Error("Invalid family data");
      }
      
      console.log("Setting family data in state:", data.familyId);
      setFamilyData(data);
      
      // Reset calendar circuit breaker when loading a family
      if (typeof window !== 'undefined' && window._resetCalendarCircuitBreaker) {
        console.log("Resetting calendar circuit breaker for family load");
        window._resetCalendarCircuitBreaker();
        // Also reset the global counter directly to be sure
        window._eventEmptyResultCounter = 0;
        window._forceEventCircuitBreaker = false;
      }
      
      // Important: Return the data for chaining
      return data;
    } catch (error) {
      console.error("Error loading family data:", error);
      throw error;
    }
  }

  // Load all families for a user
  async function loadAllFamilies(userId) {
    try {
      console.log("Loading all families for user:", userId);
      const families = await DatabaseService.getAllFamiliesByUserId(userId);
      console.log("Found families:", families.length);
      setAvailableFamilies(families);
      return families;
    } catch (error) {
      console.error("Error loading all families:", error);
      throw error;
    }
  }

  // Set selected family member
  async function setSelectedFamilyMember(memberId) {
    try {
      console.log("Explicitly setting selected family member:", memberId);

      if (!familyData || !familyData.familyMembers) {
        console.error("No family data available to select member");
        return false;
      }

      // familyMembers might be an object - convert to array first
      const members = typeof familyData.familyMembers === 'object' && !Array.isArray(familyData.familyMembers)
        ? Object.values(familyData.familyMembers)
        : familyData.familyMembers;
      const member = (Array.isArray(members) ? members : []).find(m => m.id === memberId);
      if (!member) {
        console.error("Member not found in family:", memberId);
        return false;
      }
      
      // Store the selection in localStorage
      localStorage.setItem('selectedUserId', memberId);
      console.log("Selected user ID stored:", memberId);
      
      // Return the member data
      return member;
    } catch (error) {
      console.error("Error setting selected family member:", error);
      return false;
    }
  }

  // NEW CODE
useEffect(() => {
  let isMounted = true;
  
  // First set loading to true
  setLoading(true);
  
  // Check for OTP user session first
  const otpSession = localStorage.getItem('otpUserSession');
  if (otpSession) {
    try {
      const sessionData = JSON.parse(otpSession);
      const { user: otpUser, familyId, timestamp, userName, userEmail } = sessionData;
      
      // Check if session is still valid (24 hours)
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        // If old session without userName, extract it from email
        if (!otpUser.name || !otpUser.displayName) {
          let extractedName = userName || 'User'; // Use top-level userName if available
          
          // If no userName at top level either, extract from email
          if (!userName && (userEmail || otpUser.email)) {
            const email = userEmail || otpUser.email;
            const emailParts = email.split('@');
            if (emailParts.length > 0) {
              const emailName = emailParts[0];
              extractedName = emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
              
              // Handle common email formats
              if (extractedName.includes('.') || extractedName.includes('_') || extractedName.includes('-')) {
                const nameParts = extractedName.split(/[._-]/);
                if (nameParts.length > 0) {
                  extractedName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
                }
              }
            }
          }
          
          // Update the otpUser object with proper name fields
          otpUser.name = extractedName;
          otpUser.displayName = extractedName;
          
          // Update the session with the fixed data
          const updatedSession = {
            ...sessionData,
            user: otpUser,
            userName: extractedName
          };
          localStorage.setItem('otpUserSession', JSON.stringify(updatedSession));
        }
        
        console.log("Restoring OTP user session:", otpUser.email, "with name:", otpUser.name);
        setCurrentUser(otpUser);
        // Load family data for OTP user
        if (familyId) {
          loadFamilyData(familyId).then(() => {
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
        // Don't wait for Firebase auth since OTP users don't use it
        return () => {};
      } else {
        // Session expired, clear it
        localStorage.removeItem('otpUserSession');
      }
    } catch (error) {
      console.error("Error restoring OTP session:", error);
      localStorage.removeItem('otpUserSession');
    }
  }
  
  // Set a flag to track if auth state has been checked
  let authStateChecked = false;
  
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!isMounted) return;
    
    // Mark that auth state has been checked
    authStateChecked = true;
    
    console.log("Auth state changed:", user ? `User logged in: ${user.uid}` : "No user");
    
    // Don't override OTP user with null Firebase user
    if (!user && currentUser?.isOTPUser) {
      console.log("Keeping OTP user session active");
      return;
    }
    
    setCurrentUser(user);
    
    if (user) {
      // Reset calendar circuit breaker on login
      if (typeof window !== 'undefined' && window._resetCalendarCircuitBreaker) {
        console.log("Resetting calendar circuit breaker on login");
        window._resetCalendarCircuitBreaker();
        // Also reset the global counter directly to be sure
        window._eventEmptyResultCounter = 0;
        window._forceEventCircuitBreaker = false;
      }
      
      try {
        console.log("Loading family data for user:", user.uid);

        // Load all families first
        const families = await loadAllFamilies(user.uid);
        console.log(`Loaded ${families.length} families for user`);

        // Then load the primary family data
        if (families && families.length > 0) {
          // Use the actual family ID, not the user ID
          const primaryFamilyId = families[0].id || families[0].familyId;
          console.log(`Loading primary family: ${primaryFamilyId}`);
          await loadFamilyData(primaryFamilyId);
        }
      } catch (error) {
        console.error("Error loading family data on auth change:", error);
      }
    } else {
      // Clear family data on logout
      setFamilyData(null);
      setAvailableFamilies([]);
    }
    
    if (isMounted) {
      setLoading(false);
    }
  });

  // Add a timeout to prevent hanging indefinitely - increased to 30 seconds
  const timeout = setTimeout(() => {
    if (isMounted) {
      console.log("Auth loading timeout - forcing render");
      
      // If auth state hasn't been checked yet, this is a real timeout
      if (!authStateChecked) {
        console.warn("Auth state was never checked - possible Firebase issue");
      }
      
      setLoading(false);
    }
  }, 30000); // Increased to 30 seconds for slower connections
  
  return () => {
    isMounted = false;
    clearTimeout(timeout);
    unsubscribe();
  };
}, []);

  // Listen for profile switches and update effectiveUser
  useEffect(() => {
    const handleProfileSwitch = (event) => {
      console.log('Profile switched to:', event.detail);
      const { member } = event.detail;
      
      if (member) {
        // Create an effective user that combines auth data with member data
        setEffectiveUser({
          uid: member.id,
          email: member.email,
          displayName: member.name,
          photoURL: member.profilePicture || member.profilePictureUrl,
          // Include all member data
          ...member,
          // Keep track that this is a switched profile
          isProfileSwitch: true,
          // Keep reference to the actual authenticated user
          authenticatedUserId: currentUser?.uid
        });
      }
    };
    
    window.addEventListener('profile-switched', handleProfileSwitch);
    
    // Initialize effectiveUser with currentUser if no profile switch
    if (currentUser && !effectiveUser) {
      setEffectiveUser(currentUser);
    }
    
    return () => {
      window.removeEventListener('profile-switched', handleProfileSwitch);
    };
  }, [currentUser]);

  // Context value
  const value = {
    currentUser: effectiveUser || currentUser, // Use effectiveUser as the primary user
    actualUser: currentUser, // Keep reference to the actually authenticated user
    effectiveUser, // Explicitly provide effectiveUser for components that need it
    familyData,
    availableFamilies,
    signup,
    signUp: signup,  // Alias for compatibility
    login,
    loginWithMagicLink,
    loginWithOTP,
    signInWithGoogle, // Google Sign-In method
    logout,
    createFamily,
    loadFamilyData,
    loadAllFamilies,
    ensureFamiliesLoaded,
    setSelectedFamilyMember,
    reload: () => loadFamilyData(currentUser?.uid),
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}