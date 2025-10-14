// src/services/DatabaseService.js
// First import Firebase
import { app, db, auth, storage } from './firebase';

// Then import Firebase functions
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, getAuth
} from 'firebase/auth';

// src/services/DatabaseService.js
import { 
  collection, doc, setDoc, getDoc, updateDoc, 
  getDocs, addDoc, query, where, serverTimestamp,
  arrayUnion, orderBy, limit
} from 'firebase/firestore';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import FamilyProfileService from './FamilyProfileService';

class DatabaseService {
  constructor() {
    this.db = db;
    this.auth = auth;
    this.storage = storage;
  }

  // ---- Authentication Methods ----

  // Create a new user account
  async createUser(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Sign in existing user
  async signIn(email, password) {
    try {
      console.log("DatabaseService: Attempting to sign in with email:", email);
      console.log("DatabaseService: Auth object available:", !!this.auth);
      console.log("DatabaseService: signInWithEmailAndPassword function available:", typeof signInWithEmailAndPassword);
      
      if (!this.auth) {
        throw new Error("Firebase Auth not initialized");
      }
      
      if (!email || !password) {
        throw new Error("Email and password are required");
      }
      
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log("DatabaseService: Sign in successful:", userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error("DatabaseService: Error signing in:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Provide more user-friendly error messages
      let userFriendlyMessage = error.message;
      switch (error.code) {
        case 'auth/user-not-found':
          userFriendlyMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          userFriendlyMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          userFriendlyMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          userFriendlyMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          userFriendlyMessage = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          userFriendlyMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          userFriendlyMessage = `Login failed: ${error.message}`;
      }
      
      const enhancedError = new Error(userFriendlyMessage);
      enhancedError.code = error.code;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  // Sign out current user
  async signOut() {
    try {
      // Check if there's an OTP user session
      const otpSession = localStorage.getItem('otpUserSession');
      if (otpSession) {
        console.log("Signing out OTP user");
        // Clear OTP session data
        localStorage.removeItem('otpUserSession');
      } else {
        // Regular Firebase Auth signout
        await firebaseSignOut(this.auth);
      }
      
      // Clear all session data
      localStorage.removeItem('selectedUserId');
      localStorage.removeItem('selectedFamilyId');
      localStorage.removeItem('otpUserSession'); // Ensure OTP session is cleared
      
      // Navigate to login page after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Development login function - use only for testing
  async signInForDevelopment(email = "test@example.com") {
    try {
      console.log("DEVELOPMENT MODE: Creating test user");
      
      // Create a mock user
      const mockUser = {
        uid: "test-user-" + Date.now(),
        email: email,
        displayName: "Test User",
        photoURL: null
      };
      
      // For testing only - in a real app, this would be handled by Firebase Auth
      localStorage.setItem('devModeUser', JSON.stringify(mockUser));
      
      return mockUser;
    } catch (error) {
      console.error("Error in development login:", error);
      throw error;
    }
  }

  // Upload image to Firebase Storage
  async uploadProfileImage(userId, file) {
    try {
      console.log("DatabaseService: Starting profile image upload for user ID:", userId);
      
      // Add file extension to create a better filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExtension}`;
      
      // Create a unique path for the file
      const storageRef = ref(this.storage, `profile-pictures/${fileName}`);
      console.log("Storage reference created:", storageRef);
      
      // Upload the file to Firebase Storage with explicit content type
      const metadata = {
        contentType: file.type
      };
      
      console.log("Uploading file to storage...");
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log("File uploaded successfully, getting URL...");
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("Download URL obtained:", downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error("DatabaseService Error uploading image:", error);
      console.log("Error details:", {
        userId,
        errorCode: error.code,
        errorMessage: error.message,
        errorStack: error.stack
      });
      throw error;
    }
  }


  // Add this method to your DatabaseService class/object
/**
 * Get family meeting notes for a specific week
 * @param {string} familyId - Family ID
 * @param {number} weekNumber - Week number
 * @returns {Promise<object|null>} Meeting notes or null if not found
 */
async getFamilyMeetingNotes(familyId, weekNumber) {
  try {
    if (!familyId) throw new Error("No family ID available");
    
    const notesDoc = await getDoc(doc(db, "families", familyId, "meetingNotes", `week${weekNumber}`));
    if (notesDoc.exists()) {
      return notesDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting family meeting notes:", error);
    return null;
  }
}

  // Load all survey responses for a family
  async loadSurveyResponses(familyId, forceRefresh = false) {
    try {
      console.log("Loading all survey responses for family:", familyId, forceRefresh ? "(force refresh)" : "");
      
      // Query all survey response documents for this family
      const surveyResponsesQuery = query(
        collection(this.db, "surveyResponses"), 
        where("familyId", "==", familyId)
      );
      
      // Get the query snapshot
      let querySnapshot = await getDocs(surveyResponsesQuery);
      
      // If force refresh is requested and data is from cache, fetch fresh data
      if (forceRefresh && querySnapshot.metadata.fromCache) {
        console.log("Force refreshing survey data from server (bypassing cache)");
        // Force a server fetch by getting docs again
        // This works because Firestore will try to get fresh data on subsequent calls
        querySnapshot = await getDocs(surveyResponsesQuery);
      }
      
      // Combine all responses BY MEMBER to avoid overwriting
      const responsesByMember = {};
      const allResponses = {};
      let totalResponseCount = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const memberId = data.memberId;
        
        if (data.responses && memberId) {
          responsesByMember[memberId] = responsesByMember[memberId] || {};
          
          // Handle both simple and enriched response formats
          if (typeof Object.values(data.responses)[0] === 'object') {
            // Enriched format with metadata
            Object.entries(data.responses).forEach(([key, value]) => {
              // Only count if there's an actual answer
              const answer = value.answer || value;
              if (answer && answer !== '' && answer !== 'undefined' && answer !== null) {
                responsesByMember[memberId][key] = answer;
                // Also add to combined responses with member prefix to track source
                allResponses[`${memberId}_${key}`] = answer;
                totalResponseCount++;
              }
            });
          } else {
            // Simple format
            Object.entries(data.responses).forEach(([key, value]) => {
              // Only count if there's an actual answer
              if (value && value !== '' && value !== 'undefined' && value !== null) {
                responsesByMember[memberId][key] = value;
                // Also add to combined responses with member prefix to track source
                allResponses[`${memberId}_${key}`] = value;
                totalResponseCount++;
              }
            });
          }
        }
      });
      
      // Check for duplicate responses across members (same question answered by same person in different documents)
      const uniqueResponses = {};
      const duplicateCount = 0;
      
      Object.entries(responsesByMember).forEach(([memberId, responses]) => {
        Object.entries(responses).forEach(([questionId, response]) => {
          const uniqueKey = `${questionId}`;
          // Only keep the latest response for each question per member
          uniqueResponses[uniqueKey] = response;
        });
      });
      
      const actualUniqueCount = Object.keys(uniqueResponses).length;
      
      console.log(`Found ${totalResponseCount} total survey responses from ${Object.keys(responsesByMember).length} family members`);
      console.log("Responses by member:", Object.entries(responsesByMember).map(([id, responses]) => 
        `${id}: ${Object.keys(responses).length} responses`
      ));
      console.log(`Unique responses after deduplication: ${actualUniqueCount}`);
      
      // Return both combined and by-member data
      return {
        allResponses,
        responsesByMember,
        totalCount: totalResponseCount,
        memberCount: Object.keys(responsesByMember).length
      };
    } catch (error) {
      console.error("Error loading survey responses:", error);
      return { allResponses: {}, responsesByMember: {}, totalCount: 0, memberCount: 0 };
    }
  }

  // Upload family picture to Firebase Storage
  async uploadFamilyPicture(familyId, file) {
    try {
      console.log("Starting family picture upload for family ID:", familyId);
      
      // Create a reference to Firebase Storage
      const storageRef = ref(this.storage, `family-pictures/${familyId}_${Date.now()}`);
      
      // Upload the file
      console.log("Uploading file to Firebase Storage...");
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      console.log("Getting download URL...");
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log("Family picture uploaded successfully:", downloadURL);
      
      // Update the family document with just the URL
      await this.saveFamilyData({ familyPicture: downloadURL }, familyId);
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading family picture:", error);
      throw error;
    }
  }

  // ---- Family Data Methods ----

  // Save couple check-in data
  async saveCoupleCheckInData(familyId, weekNumber, data) {
    try {
      const docRef = doc(this.db, "coupleCheckIns", `${familyId}-week${weekNumber}`);
      await setDoc(docRef, {
        familyId,
        weekNumber,
        data,
        completedAt: serverTimestamp()
      });
      
      // Also update the family document to indicate this check-in is complete
      const familyDocRef = doc(this.db, "families", familyId);
      await updateDoc(familyDocRef, {
        [`coupleCheckIns.week${weekNumber}`]: {
          completed: true,
          completedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error("Error saving couple check-in data:", error);
      throw error;
    }
  }

  // Load couple check-in data for all weeks
  async loadCoupleCheckInData(familyId) {
    try {
      const checkInData = {};
      
      // Query all documents for this family
      const q = query(
        collection(this.db, "coupleCheckIns"), 
        where("familyId", "==", familyId)
      );
      
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Extract week number from doc ID (format: familyId-week1)
        const weekMatch = doc.id.match(/-week(\d+)$/);
        if (weekMatch && weekMatch[1]) {
          const weekNumber = parseInt(weekMatch[1]);
          checkInData[weekNumber] = data.data;
        }
      });
      
      return checkInData;
    } catch (error) {
      console.error("Error loading couple check-in data:", error);
      return {};
    }
  }
  
  // Load family data from Firestore
  async loadFamilyData(familyId) {
    try {
      const docRef = doc(this.db, "families", familyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Get survey responses with just a limit for now (no timestamp filter to avoid index requirement)
        const surveyResponsesQuery = query(
          collection(this.db, "surveyResponses"), 
          where("familyId", "==", familyId),
          limit(50) // Limit to most recent 50 responses
        );
        const surveyResponsesSnapshot = await getDocs(surveyResponsesQuery);
        
        // Process survey responses
        const surveyResponses = {};
        surveyResponsesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.responses) {
            // Merge all responses together
            Object.assign(surveyResponses, data.responses);
          }
        });
        
        return {
          ...docSnap.data(),
          surveyResponses: surveyResponses
        };
      } else {
        console.log("No such family document!");
        return null;
      }
    } catch (error) {
      console.error("Error loading family data:", error);
      throw error;
    }
  }

  // Load family by user ID
  async loadFamilyByUserId(userId) {
    try {
      const q = query(collection(this.db, "families"), where("memberIds", "array-contains", userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const familyId = querySnapshot.docs[0].id;
        const familyData = querySnapshot.docs[0].data();
        
        // Get survey responses with just a limit for now (no timestamp filter to avoid index requirement)
        const surveyResponsesQuery = query(
          collection(this.db, "surveyResponses"), 
          where("familyId", "==", familyId),
          limit(50) // Limit to most recent 50 responses
        );
        const surveyResponsesSnapshot = await getDocs(surveyResponsesQuery);
        
        // Process survey responses
        const surveyResponses = {};
        surveyResponsesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.responses) {
            // Merge all responses together
            Object.assign(surveyResponses, data.responses);
          }
        });
        
        return {
          ...familyData,
          familyId: familyId,
          surveyResponses: surveyResponses
        };
      } else {
        console.log("No family found for this user!");
        return null;
      }
    } catch (error) {
      console.error("Error loading family by user:", error);
      throw error;
    }
  }

  // Add this method to get all families for a user
  async getAllFamiliesByUserId(userId) {
    try {
      // Special handling for OTP users
      if (userId && userId.startsWith('otp_')) {
        // Extract email from OTP user ID
        // Format: otp_spalsson_gmail_com -> spalsson@gmail.com
        let email = userId.replace('otp_', '');
        
        // Find the last two underscores which separate email parts
        const parts = email.split('_');
        if (parts.length >= 3) {
          // Reconstruct email: everything except last 2 parts is the local part
          const localPart = parts.slice(0, -2).join('_');
          const domain = parts[parts.length - 2];
          const tld = parts[parts.length - 1];
          email = `${localPart}@${domain}.${tld}`;
        }
        
        console.log("OTP user detected, searching families by email:", email);

        // Debug: Check if we're authenticated
        const auth = getAuth();
        console.log("Current auth state:", {
          currentUser: auth.currentUser,
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email
        });

        // Search all families to find ones containing this email
        const allFamiliesQuery = query(collection(this.db, "families"));
        const querySnapshot = await getDocs(allFamiliesQuery);
        
        const families = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Check if main email matches
          if (data.email && data.email.toLowerCase() === email.toLowerCase()) {
            families.push({
              ...data,
              familyId: doc.id
            });
            return;
          }
          
          // Check if primaryEmail matches
          if (data.primaryEmail && data.primaryEmail.toLowerCase() === email.toLowerCase()) {
            families.push({
              ...data,
              familyId: doc.id
            });
            return;
          }
          
          // Check if any family member has this email
          if (data.familyMembers) {
            // familyMembers is an object, not an array - convert to array first
            const members = typeof data.familyMembers === 'object' && !Array.isArray(data.familyMembers)
              ? Object.values(data.familyMembers)
              : data.familyMembers;

            const memberWithEmail = Array.isArray(members) ? members.find(member =>
              member.email && member.email.toLowerCase() === email.toLowerCase()
            ) : null;

            if (memberWithEmail) {
              families.push({
                ...data,
                familyId: doc.id
              });
              return;
            }
          }
          
          // Check parents array if it exists
          if (data.parents) {
            // parents might also be an object - convert to array if needed
            const parents = typeof data.parents === 'object' && !Array.isArray(data.parents)
              ? Object.values(data.parents)
              : data.parents;

            const parentWithEmail = Array.isArray(parents) ? parents.find(parent =>
              parent.email && parent.email.toLowerCase() === email.toLowerCase()
            ) : null;

            if (parentWithEmail) {
              families.push({
                ...data,
                familyId: doc.id
              });
              return;
            }
          }
        });
        
        return families;
      }
      
      // Regular user - search by memberIds
      const q = query(collection(this.db, "families"), where("memberIds", "array-contains", userId));
      const querySnapshot = await getDocs(q);
      
      const families = [];
      querySnapshot.forEach((doc) => {
        families.push({
          ...doc.data(),
          familyId: doc.id
        });
      });
      
      return families;
    } catch (error) {
      console.error("Error loading all families by user:", error);
      throw error;
    }
  }

  // Save family data to Firestore
  async saveFamilyData(data, familyId) {
    try {
      const docRef = doc(this.db, "families", familyId);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Error saving family data:", error);
      throw error;
    }
  }

  // Store email for weekly updates
  async saveEmailForUpdates(email, familyId) {
    try {
      const docRef = doc(this.db, "emailSubscriptions", familyId);
      await setDoc(docRef, {
        email,
        familyId,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Error saving email:", error);
      throw error;
    }
  }

  // Update member survey completion with improved tracking
async updateMemberSurveyCompletion(familyId, memberId, surveyType, isCompleted) {
  try {
    if (!familyId || !memberId) {
      throw new Error("Family ID and Member ID are required");
    }
    
    console.log(`Updating survey completion for member ${memberId} in family ${familyId} - ${surveyType}: ${isCompleted}`);
    
    const docRef = doc(this.db, "families", familyId);
    const familyData = await getDoc(docRef);
    
    if (!familyData.exists()) {
      throw new Error("Family not found");
    }
    
    const familyDoc = familyData.data();
    // familyMembers might be an object - convert to array first
    const familyMembersRaw = familyDoc.familyMembers || [];
    const familyMembers = typeof familyMembersRaw === 'object' && !Array.isArray(familyMembersRaw)
      ? Object.values(familyMembersRaw)
      : familyMembersRaw;
    const updatedMembers = (Array.isArray(familyMembers) ? familyMembers : []).map(member => {
      if (member.id === memberId) {
        if (surveyType === 'initial') {
          return {
            ...member,
            completed: isCompleted,
            completedDate: new Date().toISOString().split('T')[0],
            surveys: {
              ...member.surveys,
              initial: {
                completed: isCompleted,
                completedAt: new Date().toISOString(),
                responses: member.surveys?.initial?.responses || {}
              }
            }
          };
        } else if (surveyType.startsWith('weekly-')) {
          const weekIndex = parseInt(surveyType.replace('weekly-', '')) - 1;
          const updatedWeeklyCompleted = [...(member.weeklyCompleted || [])];
          
          while (updatedWeeklyCompleted.length <= weekIndex) {
            updatedWeeklyCompleted.push({
              id: updatedWeeklyCompleted.length + 1,
              completed: false,
              date: null
            });
          }
          
          updatedWeeklyCompleted[weekIndex] = {
            ...updatedWeeklyCompleted[weekIndex],
            completed: isCompleted,
            date: new Date().toISOString().split('T')[0]
          };
          
          return {
            ...member,
            weeklyCompleted: updatedWeeklyCompleted
          };
        }
      }
      return member;
    });
    
    // Check if this completes all parents' initial surveys
    const allParentsCompleted = updatedMembers
      .filter(m => m.role === 'parent')
      .every(p => p.completed);
    
    // Update family document with member completion status
    const updateData = {
      familyMembers: updatedMembers,
      updatedAt: serverTimestamp()
    };
    
    // If all parents have completed their surveys, mark week 1 as completed
    if (allParentsCompleted && surveyType === 'initial' && isCompleted) {
      console.log("All parents have completed surveys - marking week 1 as complete");
      
      // Add first week to completedWeeks if not already there
      const completedWeeks = familyDoc.completedWeeks || [];
      if (!completedWeeks.includes(1)) {
        updateData.completedWeeks = [...completedWeeks, 1];
      }
      
      // Also make sure currentWeek is at least 2
      if (!familyDoc.currentWeek || familyDoc.currentWeek <= 1) {
        updateData.currentWeek = 2;
      }
    }
    
    await updateDoc(docRef, updateData);
    
    // Also update survey completion status in a separate document for redundancy
    try {
      const completionRef = doc(this.db, "surveyCompletions", familyId);
      await setDoc(completionRef, {
        familyId,
        [surveyType]: {
          [memberId]: {
            completed: isCompleted,
            completedDate: new Date().toISOString()
          }
        },
        allParentsCompleted: allParentsCompleted,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Non-critical error updating survey completion tracker:", err);
      // Continue even if this fails
    }
    
    console.log(`Successfully updated survey completion status for ${memberId}`);
    return true;
  } catch (error) {
    console.error("Error updating member completion:", error);
    throw error;
  }
}

  // Update member survey progress (for partial completion tracking)
  async updateMemberSurveyProgress(familyId, memberId, surveyType, responseCount) {
    try {
      if (!familyId || !memberId) {
        throw new Error("Family ID and Member ID are required");
      }
      
      console.log(`Updating survey progress for member ${memberId} - ${surveyType}: ${responseCount} responses`);
      
      const docRef = doc(this.db, "families", familyId);
      const familyData = await getDoc(docRef);
      
      if (!familyData.exists()) {
        throw new Error("Family not found");
      }
      
      const familyDoc = familyData.data();
      // familyMembers might be an object - convert to array first
      const familyMembersRaw2 = familyDoc.familyMembers || [];
      const familyMembers2 = typeof familyMembersRaw2 === 'object' && !Array.isArray(familyMembersRaw2)
        ? Object.values(familyMembersRaw2)
        : familyMembersRaw2;
      const updatedMembers = (Array.isArray(familyMembers2) ? familyMembers2 : []).map(member => {
        if (member.id === memberId) {
          return {
            ...member,
            surveys: {
              ...member.surveys,
              [surveyType]: {
                ...member.surveys?.[surveyType],
                responseCount: responseCount,
                lastUpdated: new Date().toISOString()
              }
            }
          };
        }
        return member;
      });
      
      await updateDoc(docRef, {
        familyMembers: updatedMembers,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Successfully updated survey progress for ${memberId} with ${responseCount} responses`);
      return true;
    } catch (error) {
      console.error("Error updating member survey progress:", error);
      throw error;
    }
  }

  // Save survey responses
  async saveSurveyResponses(familyId, memberId, surveyType, responses) {
    try {
      const responseCount = Object.keys(responses).length;
      console.log(`Attempting to save ${responseCount} survey responses for member ${memberId}`);

      const docRef = doc(this.db, "surveyResponses", `${familyId}-${memberId}-${surveyType}`);

      // First check if document exists to merge responses
      const docSnap = await getDoc(docRef);
      let mergedResponses = responses;

      if (docSnap.exists()) {
        // Merge with existing responses
        const existingData = docSnap.data();
        mergedResponses = {
          ...existingData.responses,  // Keep existing responses
          ...responses                 // Add/override with new responses
        };
        console.log(`Merging with ${Object.keys(existingData.responses || {}).length} existing responses`);
      }

      const totalResponseCount = Object.keys(mergedResponses).length;

      await setDoc(docRef, {
        familyId,
        memberId,
        surveyType,
        responses: mergedResponses,
        responseCount: totalResponseCount,
        completedAt: serverTimestamp(),
        lastUpdated: new Date().toISOString()
      });

      console.log(`Successfully saved ${totalResponseCount} total responses to Firebase (${responseCount} new)`);
      return true;
    } catch (error) {
      console.error("Error saving survey responses:", error);
      console.error("Error details:", error.code, error.message);
      throw error;
    }
  }

  // Repair function to fix response count discrepancies
  async repairSurveyResponseCount(familyId, memberId, surveyType = 'initial') {
    try {
      console.log(`🔧 Repairing response count for ${memberId}...`);
      
      const docId = `${familyId}-${memberId}-${surveyType}`;
      const docRef = doc(this.db, "surveyResponses", docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const actualCount = Object.keys(data.responses || {}).length;
        const storedCount = data.responseCount || 0;
        
        console.log(`📊 Response count check: stored=${storedCount}, actual=${actualCount}`);
        
        if (actualCount !== storedCount) {
          // Don't downgrade force-completed surveys (where stored count is higher)
          if (storedCount > actualCount && data.forceCompleted) {
            console.log(`⚠️ Skipping downgrade: Force-completed survey (stored=${storedCount}, actual=${actualCount})`);
            return { fixed: false, count: storedCount, skipped: true };
          }
          
          // Only upgrade counts, never downgrade
          const newCount = Math.max(actualCount, storedCount);
          if (newCount > storedCount) {
            await updateDoc(docRef, {
              responseCount: newCount,
              lastUpdated: new Date().toISOString()
            });
            
            console.log(`✅ Fixed: Updated responseCount from ${storedCount} to ${newCount}`);
            return { fixed: true, oldCount: storedCount, newCount: newCount };
          } else {
            console.log(`⚠️ Skipping downgrade: ${storedCount} → ${actualCount}`);
            return { fixed: false, count: storedCount, skipped: true };
          }
        } else {
          console.log(`✅ No fix needed: counts already match (${actualCount})`);
          return { fixed: false, count: actualCount };
        }
      } else {
        console.log(`❌ Document not found: ${docId}`);
        return { error: 'Document not found' };
      }
    } catch (error) {
      console.error("❌ Error repairing response count:", error);
      throw error;
    }
  }

  // Force complete survey for members with nearly complete responses (70+ out of 72)
  async forceCompleteSurvey(familyId, memberId, surveyType = 'initial') {
    try {
      console.log(`🔧 Force completing survey for ${memberId}...`);
      
      const docId = `${familyId}-${memberId}-${surveyType}`;
      const docRef = doc(this.db, "surveyResponses", docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const actualCount = Object.keys(data.responses || {}).length;
        
        console.log(`📊 Current response count: ${actualCount}`);
        
        if (actualCount >= 70) {
          // Mark survey responses as complete
          await updateDoc(docRef, {
            responseCount: 72, // Force to 72 to mark as complete
            completedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            forceCompleted: true,
            originalResponseCount: actualCount
          });
          
          // Also update user document (create if it doesn't exist)
          const userDocRef = doc(this.db, 'users', memberId);
          try {
            await updateDoc(userDocRef, {
              'surveys.initial.completed': true,
              'surveys.initial.completedAt': new Date().toISOString(),
              'surveys.initial.responseCount': 72
            });
          } catch (userDocError) {
            if (userDocError.code === 'not-found') {
              // User document doesn't exist, create it
              console.log("🔧 Creating user document for force completion");
              await setDoc(userDocRef, {
                surveys: {
                  initial: {
                    completed: true,
                    completedAt: new Date().toISOString(),
                    responseCount: 72
                  }
                }
              });
            } else {
              throw userDocError;
            }
          }
          
          console.log(`✅ Force completed: ${actualCount} → 72 responses`);
          return { forced: true, originalCount: actualCount, newCount: 72 };
        } else {
          console.log(`❌ Too few responses (${actualCount}) to force complete`);
          return { error: 'Insufficient responses', count: actualCount };
        }
      } else {
        console.log(`❌ Document not found: ${docId}`);
        return { error: 'Document not found' };
      }
    } catch (error) {
      console.error("❌ Error force completing survey:", error);
      throw error;
    }
  }

  // Quick fix to restore a specific user to 72 (for emergency fixes)
  async quickFixUserTo72(familyId, memberId, surveyType = 'initial') {
    try {
      console.log(`🚨 Quick fix: Setting ${memberId} to 72 responses...`);
      
      const docId = `${familyId}-${memberId}-${surveyType}`;
      const docRef = doc(this.db, "surveyResponses", docId);
      
      await updateDoc(docRef, {
        responseCount: 72,
        forceCompleted: true,
        quickFixed: true,
        lastUpdated: new Date().toISOString()
      });
      
      console.log(`✅ Quick fix applied: ${memberId} set to 72 responses`);
      return { success: true, count: 72 };
      
    } catch (error) {
      console.error("❌ Error in quick fix:", error);
      throw error;
    }
  }

  // Enhanced survey response storage with metadata
  async saveSurveyResponsesWithMetadata(familyId, memberId, surveyType, responses, questionMetadata) {
    try {
      if (!familyId) throw new Error("No family ID available");
      
      const enrichedResponses = {};
        
      // Add metadata to each response
      Object.entries(responses).forEach(([questionId, answer]) => {
        const metadata = questionMetadata[questionId] || {};
          
        enrichedResponses[questionId] = {
          answer,
          category: metadata.category || 'unknown',
          subcategory: metadata.subcategory || null,
          subcategoryLabel: metadata.subcategoryLabel || null,
          weight: metadata.totalWeight || '1',
          timestamp: new Date().toISOString()
        };
      });
      
      // Import SubCategoryAnalyzer if not already imported
      const SubCategoryAnalyzer = (await import('./SubCategoryAnalyzer')).default;
      
      // Perform subcategory analysis
      const subcategoryAnalysis = SubCategoryAnalyzer.analyzeSubCategories(enrichedResponses);
      const mostImbalancedSubcategory = SubCategoryAnalyzer.getMostImbalancedSubcategory(subcategoryAnalysis);
        
      // Save to Firestore
      const docRef = doc(this.db, "surveyResponses", `${familyId}-${memberId}-${surveyType}`);
      await setDoc(docRef, {
        familyId,
        memberId,
        surveyType,
        responses: enrichedResponses,
        responseCount: Object.keys(enrichedResponses).length,
        subcategoryAnalysis: subcategoryAnalysis,
        mostImbalancedSubcategory: mostImbalancedSubcategory,
        completedAt: serverTimestamp()
      });
      
      console.log(`Saved ${Object.keys(enrichedResponses).length} enriched survey responses for ${memberId}`);
      return true;
    } catch (error) {
      console.error("Error saving survey responses with metadata:", error);
      throw error;
    }
  }

  // Load member survey responses
  async loadMemberSurveyResponses(familyId, memberId, surveyType) {
    try {
      const docRef = doc(this.db, "surveyResponses", `${familyId}-${memberId}-${surveyType}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().responses || {};
      } else {
        return {};
      }
    } catch (error) {
      console.error("Error loading member survey responses:", error);
      throw error;
    }
  }

  // Get aggregated survey responses for ELO calculations
  async getAggregatedSurveyResponses(familyId, forceRefresh = false) {
    try {
      console.log("Getting aggregated survey responses for ELO calculations", forceRefresh ? "(force refresh)" : "");
      
      const surveyData = await this.loadSurveyResponses(familyId, forceRefresh);
      
      // Get family data to access member roles
      const familyDoc = await getDoc(doc(this.db, "families", familyId));
      const familyMembers = familyDoc.exists() ? familyDoc.data().familyMembers || [] : [];
      
      // Create a map of member IDs to their roles
      const memberRoleMap = {};
      const memberSurveyProgress = {};
      
      familyMembers.forEach(member => {
        memberRoleMap[member.id] = {
          role: member.role,
          name: member.name,
          roleType: member.roleType // For parents: 'Mama' or 'Papa'
        };
        
        // Track survey progress from member data
        if (member.surveys?.initial?.responseCount) {
          memberSurveyProgress[member.id] = {
            responseCount: member.surveys.initial.responseCount,
            completed: member.surveys.initial.completed || false
          };
        }
      });
      
      // Extract unique questions answered across all members
      const aggregatedResponses = [];
      const questionsSeen = new Set();
      const responseCountByMember = {};
      
      if (surveyData.responsesByMember) {
        Object.entries(surveyData.responsesByMember).forEach(([memberId, responses]) => {
          let memberResponseCount = 0;
          
          Object.entries(responses).forEach(([questionId, response]) => {
            // Skip NA/skipped responses in counting
            if (response && response !== 'NA' && response !== 'Skip') {
              // Create a unique key for this member-question combination
              const responseKey = `${memberId}_${questionId}`;
              
              if (!questionsSeen.has(responseKey)) {
                questionsSeen.add(responseKey);
                memberResponseCount++;
                
                aggregatedResponses.push({
                  memberId,
                  questionId,
                  response,
                  timestamp: new Date().toISOString(),
                  // Add member role information
                  memberRole: memberRoleMap[memberId]?.role || 'unknown',
                  memberName: memberRoleMap[memberId]?.name || 'Unknown',
                  memberRoleType: memberRoleMap[memberId]?.roleType || null
                });
              }
            }
          });
          
          responseCountByMember[memberId] = memberResponseCount;
        });
      }
      
      // Add role information to responsesByMember as well
      const responsesByMemberWithRoles = {};
      if (surveyData.responsesByMember) {
        Object.entries(surveyData.responsesByMember).forEach(([memberId, responses]) => {
          responsesByMemberWithRoles[memberId] = {
            responses,
            responseCount: responseCountByMember[memberId] || 0,
            memberInfo: memberRoleMap[memberId] || { role: 'unknown', name: 'Unknown' },
            surveyProgress: memberSurveyProgress[memberId] || { responseCount: 0, completed: false }
          };
        });
      }
      
      // Calculate role-specific counts
      let parentResponseCount = 0;
      let childResponseCount = 0;
      let totalValidResponses = 0;
      
      aggregatedResponses.forEach(response => {
        if (response.memberRole === 'parent') {
          parentResponseCount++;
        } else if (response.memberRole === 'child') {
          childResponseCount++;
        }
        totalValidResponses++;
      });
      
      console.log(`Aggregated ${totalValidResponses} total valid responses from ${surveyData.memberCount} members`);
      console.log(`Parent responses: ${parentResponseCount}, Child responses: ${childResponseCount}`);
      
      return {
        responses: aggregatedResponses,
        totalCount: totalValidResponses,
        parentResponseCount,
        childResponseCount,
        memberCount: surveyData.memberCount,
        responsesByMember: surveyData.responsesByMember,
        responsesByMemberWithRoles,
        memberRoleMap,
        responseCountByMember
      };
    } catch (error) {
      console.error("Error getting aggregated survey responses:", error);
      return { 
        responses: [], 
        totalCount: 0, 
        parentResponseCount: 0,
        childResponseCount: 0,
        memberCount: 0, 
        responsesByMember: {},
        responsesByMemberWithRoles: {},
        memberRoleMap: {},
        responseCountByMember: {}
      };
    }
  }

  // Add task comment
  async addTaskComment(familyId, taskId, userId, userName, text) {
    try {
      const docRef = doc(this.db, "families", familyId);
      const familyData = await getDoc(docRef);
      
      if (familyData.exists()) {
        const comment = {
          id: Date.now(),
          userId,
          userName,
          text,
          timestamp: new Date().toLocaleString()
        };
        
        const taskData = familyData.data().tasks || [];
        const updatedTasks = taskData.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              comments: [...(task.comments || []), comment]
            };
          }
          return task;
        });
        
        await updateDoc(docRef, {
          tasks: updatedTasks,
          updatedAt: serverTimestamp()
        });
        
        return comment;
      } else {
        throw new Error("Family not found");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  // Update task completion - now with timestamp
  async updateTaskCompletion(familyId, taskId, isCompleted, completedDate) {
    try {
      console.log(`Updating task ${taskId} completion to: ${isCompleted} with date: ${completedDate}`);
      
      const docRef = doc(this.db, "families", familyId);
      const familyData = await getDoc(docRef);
      
      if (familyData.exists()) {
        const taskData = familyData.data().tasks || [];
        const updatedTasks = taskData.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              completed: isCompleted,
              completedDate: completedDate
            };
          }
          return task;
        });
        
        await updateDoc(docRef, {
          tasks: updatedTasks,
          updatedAt: serverTimestamp()
        });
        
        console.log(`Task ${taskId} completion successfully updated`);
        return true;
      } else {
        throw new Error("Family not found");
      }
    } catch (error) {
      console.error("Error updating task completion:", error);
      throw error;
    }
  }

  // Update subtask completion with timestamp
  async updateSubtaskCompletion(familyId, taskId, subtaskId, isCompleted, completedDate) {
    try {
      console.log(`Updating subtask ${subtaskId} of task ${taskId} completion to: ${isCompleted} with date: ${completedDate}`);
      
      const docRef = doc(this.db, "families", familyId);
      const familyData = await getDoc(docRef);
      
      if (familyData.exists()) {
        const taskData = familyData.data().tasks || [];
        const updatedTasks = taskData.map(task => {
          if (task.id.toString() === taskId.toString()) {
            // Update the specific subtask
            const updatedSubtasks = (task.subTasks || []).map(subtask => {
              if (subtask.id === subtaskId) {
                return {
                  ...subtask,
                  completed: isCompleted,
                  completedDate: completedDate
                };
              }
              return subtask;
            });
            
            // Check if all subtasks are completed
            const allSubtasksComplete = updatedSubtasks.every(st => st.completed);
            
            return {
              ...task,
              subTasks: updatedSubtasks,
              // Update the main task's completion status based on subtasks
              completed: allSubtasksComplete,
              completedDate: allSubtasksComplete ? new Date().toISOString() : null
            };
          }
          return task;
        });
        
        await updateDoc(docRef, {
          tasks: updatedTasks,
          updatedAt: serverTimestamp()
        });
        
        console.log(`Subtask ${subtaskId} of task ${taskId} completion successfully updated`);
        return true;
      } else {
        throw new Error("Family not found");
      }
    } catch (error) {
      console.error("Error updating subtask completion:", error);
      throw error;
    }
  }

// Save document metadata to Firestore
async saveDocument(documentData) {
  try {
    if (!documentData.familyId) {
      throw new Error("No family ID provided for document");
    }
    
    const docRef = await addDoc(collection(this.db, "familyDocuments"), {
      ...documentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log("Document saved with ID:", docRef.id);
    return { success: true, documentId: docRef.id };
  } catch (error) {
    console.error("Error saving document:", error);
    throw error;
  }
}


  // Save family meeting notes
  async saveFamilyMeetingNotes(familyId, weekNumber, notes) {
    try {
      const docRef = doc(this.db, "familyMeetings", `${familyId}-week${weekNumber}`);
      await setDoc(docRef, {
        familyId,
        weekNumber,
        notes,
        completedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error saving family meeting notes:", error);
      throw error;
    }
  }

  // Get tasks for the current week
  async getTasksForWeek(familyId, weekNumber) {
    try {
      if (!familyId) throw new Error("No family ID available");
      
      const docRef = doc(this.db, "families", familyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Return the tasks array from the family document
        return docSnap.data().tasks || [];
      } else {
        console.log("No family document found");
        return [];
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      throw error;
    }
  }  

  // Get family meeting notes
  async getFamilyMeetingNotes(familyId, weekNumber) {
    try {
      const docRef = doc(this.db, "familyMeetings", `${familyId}-week${weekNumber}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().notes || {};
      } else {
        console.log("No meeting notes found");
        return {};
      }
    } catch (error) {
      console.error("Error getting family meeting notes:", error);
      return {};
    }
  }

  // Create a new family
  async createFamily(familyData) {
    try {
      const { familyName, parents, children, phoneNumber, phoneVerified, email, emailVerified, familyEmail, familyEmailPrefix } = familyData;
      
      // Create user accounts for parents
      const parentUsers = [];
      const parentData = Array.isArray(parents) ? parents : [];
      for (const parent of parentData) {
        // Handle Google Auth OR password authentication
        if (parent.googleAuth && parent.googleAuth.authenticated) {
          // Google Auth - REQUIRE valid UID (no placeholders allowed)
          const googleUid = parent.googleAuth.uid;

          if (!googleUid) {
            const errorMsg =
              `Google Auth completed but no Firebase UID available for ${parent.name}. ` +
              `This indicates a session persistence issue. ` +
              `Please close this tab, open a new one, and try the onboarding flow again.`;

            console.error('❌ CRITICAL:', errorMsg);
            console.error('Google Auth data:', parent.googleAuth);

            throw new Error(errorMsg);
          }

          console.log(`✅ Using Google Auth UID for ${parent.role}:`, googleUid);

          // Store Google auth tokens in userTokens collection for calendar integration
          try {
            const tokenDocRef = doc(this.db, "userTokens", googleUid);
            const tokenData = {
              email: parent.googleAuth.email || parent.email,
              provider: 'google',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            // Only add fields that exist (Firestore doesn't allow undefined values)
            if (parent.googleAuth.accessToken) {
              tokenData.accessToken = parent.googleAuth.accessToken;
            }
            if (parent.googleAuth.refreshToken) {
              tokenData.refreshToken = parent.googleAuth.refreshToken;
            }
            if (parent.googleAuth.expiresAt) {
              tokenData.expiresAt = parent.googleAuth.expiresAt;
            }

            await setDoc(tokenDocRef, tokenData);
            console.log(`✅ Stored Google auth tokens for ${parent.role}`);
          } catch (tokenError) {
            console.error(`⚠️ Error storing Google tokens for ${parent.role}:`, tokenError);
            // Non-critical - continue with family creation
          }

          parentUsers.push({
            uid: googleUid,
            email: parent.googleAuth.email || parent.email,
            role: parent.role,
            name: parent.googleAuth.displayName || parent.name,
            authMethod: 'google'
          });
        } else if (parent.email && parent.password) {
          // Password authentication - create Firebase user
          try {
            const user = await this.createUser(parent.email, parent.password);
            parentUsers.push({
              uid: user.uid,
              email: parent.email,
              role: parent.role,
              name: parent.name,
              authMethod: 'password'
            });
            console.log(`Created password user for ${parent.role}:`, user.uid);
          } catch (error) {
            console.error(`Error creating password user for ${parent.role}:`, error);

            // If email already exists, try to sign in instead
            if (error.code === 'auth/email-already-in-use' || error.message?.includes('email-already-in-use')) {
              console.log(`Email ${parent.email} already exists, attempting to sign in...`);
              try {
                const existingUser = await this.signIn(parent.email, parent.password);
                if (existingUser) {
                  parentUsers.push({
                    uid: existingUser.uid,
                    email: parent.email,
                    role: parent.role,
                    name: parent.name
                  });
                  console.log(`Signed in existing user for ${parent.role}:`, existingUser.uid);
                } else {
                  // If sign in failed, still add placeholder
                  parentUsers.push({
                    uid: null,
                    email: parent.email,
                    role: parent.role,
                    name: parent.name
                  });
                }
              } catch (signInError) {
                console.error(`Failed to sign in existing user ${parent.email}:`, signInError);
                // Still add a placeholder for this parent
                parentUsers.push({
                  uid: null,
                  email: parent.email,
                  role: parent.role,
                  name: parent.name
                });
              }
            } else {
              // For other errors, still add placeholder
              parentUsers.push({
                uid: null,
                email: parent.email,
                role: parent.role,
                name: parent.name
              });
            }
          }
        } else {
          // Parent doesn't have email/password yet - add placeholder
          console.log(`Parent ${parent.role} has no email/password yet, creating placeholder`);
          parentUsers.push({
            uid: null,
            email: parent.email || null,
            role: parent.role,
            name: parent.name
          });
        }
      }

      if (parentUsers.length === 0) {
        throw new Error("No parent users could be created");
      }
        
      // Generate a simple family ID instead of using addDoc
      const familyId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      console.log("Generated familyId:", familyId);
      console.log("Parent users created:", parentUsers);
      console.log("Family data being prepared:", {
        familyName,
        parentData: parentData.map(p => ({...p, password: '****'})),
        childrenData: Array.isArray(children) ? children : []
      });
            
      // Create family members array AND collect all member IDs
      const allMemberIds = []; // Track ALL member IDs for memberIds array

      const familyMembers = [
        ...parentData.map((parent, index) => {
          const userId = parentUsers[index]?.uid || `${parent.role.toLowerCase()}-${familyId}`;
          console.log(`Creating family member for ${parent.name} with ID ${userId}`);

          // Add EVERY parent ID to the memberIds array (including generated ones)
          allMemberIds.push(userId);

          return {
            id: userId,
            name: parent.name,
            role: 'parent',
            roleType: parent.role,
            email: parent.email,
            phoneNumber: index === 0 && phoneNumber ? phoneNumber : parent.phoneNumber || null,
            phoneVerified: index === 0 && phoneVerified ? phoneVerified : false,
            completed: false,
            completedDate: null,
            weeklyCompleted: [],
            profilePicture: parent.profilePicture || null
          };
        }),
        ...(Array.isArray(children) ? children : []).map(child => {
          const childId = `${child.name.toLowerCase()}-${familyId}`;
          console.log(`Creating family member for child ${child.name} with ID ${childId}`);

          // Add child IDs too for completeness
          allMemberIds.push(childId);

          return {
            id: childId,
            name: child.name,
            role: 'child',
            age: child.age,
            completed: false,
            completedDate: null,
            weeklyCompleted: [],
            profilePicture: child.profilePicture || null
          };
        })
      ];

      // Log the memberIds to verify all parents are included
      console.log("All member IDs being saved to memberIds array:", allMemberIds);
      console.log("Family members count:", familyMembers.length);
      console.log("Parent users (with/without UIDs):", parentUsers);

      // Prepare family document data
      const familyDoc = {
        familyId,
        familyName,
        familyMembers,
        tasks: [],
        completedWeeks: [],
        currentWeek: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        memberIds: allMemberIds, // Use ALL member IDs, not just those with Firebase UIDs
        surveySchedule: {}, // Initialize empty survey schedule
        familyPicture: familyData.familyPicture || null,
        // Store email and phone verification data
        primaryEmail: email || parentData[0]?.email || null,
        emailVerified: emailVerified || false,
        phoneNumber: phoneNumber || null,
        phoneVerified: phoneVerified || false,
        familyEmail: familyEmail || null,
        familyEmailPrefix: familyEmailPrefix || null,
        // Store onboarding preferences
        communication: familyData.communication || {},
        preferences: familyData.preferences || {},
        priorities: familyData.priorities || {},
        aiPreferences: familyData.aiPreferences || {}
      };
            
      console.log("Attempting to save family document:", familyId);
            
      // Create the family document directly with a specific ID
      await setDoc(doc(this.db, "families", familyId), familyDoc);
      console.log("Family document created successfully");

      // Register the family email if one was selected during onboarding
      if (familyEmailPrefix && familyEmail) {
        try {
          console.log("Registering family email:", familyEmail);
          await setDoc(doc(this.db, "email_registry", familyEmailPrefix), {
            familyId,
            familyName: familyData.familyName || 'Unknown Family',
            createdAt: new Date().toISOString(),
            domain: 'families.checkallie.com',
            fullEmail: familyEmail
          });
          console.log("Family email registered in email_registry");
        } catch (emailError) {
          console.error("Error registering family email:", emailError);
          // Don't fail family creation if email registration fails
        }
      }
            
      // Initialize enhanced profiles for all family members
      try {
        console.log("Initializing enhanced profiles for family members...");
        const profileIds = await FamilyProfileService.initializeProfiles(familyId, familyMembers, this);
        console.log("Enhanced profiles initialized:", profileIds);

        // Update the family document with profile IDs
        await updateDoc(doc(this.db, "families", familyId), {
          enhancedProfiles: profileIds
        });
      } catch (profileError) {
        console.error("Error initializing enhanced profiles:", profileError);
        // Non-critical error - family is still created, profiles can be initialized later
      }
      
      // Record family creation analytics
      try {
        await this.recordAnalyticsEvent(familyId, {
          event: 'family_created',
          familyName: familyName,
          memberCount: familyMembers.length,
          parentCount: parentData.length,
          childCount: Array.isArray(children) ? children.length : 0,
          timestamp: new Date().toISOString()
        });
      } catch (analyticsError) {
        console.error("Analytics error during family creation:", analyticsError);
        // Non-critical, don't block family creation
      }
            
      return familyDoc;
    } catch (error) {
      console.error("Error in createFamily:", error);
      throw error;
    }
  }

  // Update family member profile picture
  async updateMemberProfilePicture(familyId, memberId, file) {
    try {
      // Upload the image to Firebase Storage
      const downloadURL = await this.uploadProfileImage(memberId, file);
      
      // Update the family member's profile picture URL in Firestore
      const docRef = doc(this.db, "families", familyId);
      const familyData = await getDoc(docRef);
      
      if (!familyData.exists()) {
        throw new Error("Family not found");
      }

      // familyMembers might be an object - convert to array first
      const familyMembersRaw3 = familyData.data().familyMembers || [];
      const familyMembers3 = typeof familyMembersRaw3 === 'object' && !Array.isArray(familyMembersRaw3)
        ? Object.values(familyMembersRaw3)
        : familyMembersRaw3;
      const updatedMembers = (Array.isArray(familyMembers3) ? familyMembers3 : []).map(member => {
        if (member.id === memberId) {
          return {
            ...member,
            profilePicture: downloadURL
          };
        }
        return member;
      });
      
      await updateDoc(docRef, {
        familyMembers: updatedMembers,
        updatedAt: serverTimestamp()
      });
      
      return downloadURL;
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw error;
    }
  }

  // Store AI preferences
  async storeAIPreferences(familyId, preferences) {
    try {
      if (!familyId) throw new Error("No family ID available");
      
      // Create a properly structured object for AI use
      const aiData = {
        communicationStyle: preferences.communication?.style || 'open',
        challengeAreas: preferences.communication?.challengeAreas || [],
        priorities: {
          highestPriority: preferences.priorities?.highestPriority || null,
          secondaryPriority: preferences.priorities?.secondaryPriority || null,
          tertiaryPriority: preferences.priorities?.tertiaryPriority || null
        },
        aiPreferences: {
          style: preferences.aiPreferences?.style || 'friendly',
          length: preferences.aiPreferences?.length || 'balanced',
          topics: preferences.aiPreferences?.topics || []
        },
        relationship: preferences.relationship || {},
        updatedAt: serverTimestamp()
      };
        
      // Store in a dedicated collection for AI engine
      const docRef = doc(this.db, "familyAIData", familyId);
      await setDoc(docRef, aiData, { merge: true });
        
      // Also store in the main family document for completeness
      await this.saveFamilyData({
        aiPreferences: preferences.aiPreferences || {},
        communication: preferences.communication || {},
        priorities: preferences.priorities || {},
        relationship: preferences.relationship || {}
      }, familyId);
        
      console.log("AI preferences stored successfully:", familyId);
      return true;
    } catch (error) {
      console.error("Error storing AI preferences:", error);
      throw error;
    }
  }

  // Initialize enhanced profiles for existing families (migration)
  async initializeEnhancedProfilesForFamily(familyId) {
    try {
      // Get the family data
      const familyData = await this.loadFamilyData(familyId);
      if (!familyData) {
        throw new Error(`Family ${familyId} not found`);
      }

      // Check if enhanced profiles already exist
      if (familyData.enhancedProfiles) {
        console.log(`Family ${familyId} already has enhanced profiles`);
        return familyData.enhancedProfiles;
      }

      // Initialize profiles for all family members
      console.log(`Initializing enhanced profiles for existing family: ${familyId}`);
      const profileIds = await FamilyProfileService.initializeProfiles(familyId, familyData.familyMembers, this);

      // Update the family document with profile IDs
      await updateDoc(doc(this.db, "families", familyId), {
        enhancedProfiles: profileIds,
        updatedAt: serverTimestamp()
      });

      console.log(`Enhanced profiles initialized for family ${familyId}:`, profileIds);
      return profileIds;
    } catch (error) {
      console.error(`Error initializing enhanced profiles for family ${familyId}:`, error);
      throw error;
    }
  }

  // Record analytics events
  async recordAnalyticsEvent(familyId, eventData) {
    try {
      if (!familyId) throw new Error("No family ID available");
      
      // Add timestamp if not provided
      const event = {
        ...eventData,
        timestamp: eventData.timestamp || new Date().toISOString(),
        recordedAt: serverTimestamp()
      };
      
      // Create a unique ID for this event
      const eventId = `${event.event}_${Date.now()}`;
      
      // Store in analytics collection
      await setDoc(doc(this.db, "analytics", `${familyId}_${eventId}`), event);
      
      return true;
    } catch (error) {
      console.error("Error recording analytics event:", error);
      // Don't throw the error to avoid disrupting the user experience
      return false;
    }
  }

  // Record user onboarding progress
  async recordOnboardingProgress(userId, familyId, step, data) {
    try {
      if (!userId) throw new Error("No user ID available");
      
      const progressData = {
        userId,
        familyId: familyId || null,
        step,
        data: data || {},
        timestamp: new Date().toISOString(),
        recordedAt: serverTimestamp()
      };
      
      // Store in onboarding progress collection
      await setDoc(
        doc(this.db, "onboardingProgress", `${userId}_step${step}`),
        progressData,
        { merge: true }
      );
      
      // Also record as an analytics event
      if (familyId) {
        await this.recordAnalyticsEvent(familyId, {
          event: 'onboarding_step_completed',
          userId,
          step,
          data
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error recording onboarding progress:", error);
      // Don't throw the error to avoid disrupting the user experience
      return false;
    }
  }
  
  // Track onboarding completion
  async trackOnboardingCompletion(userId, familyId) {
    try {
      if (!userId || !familyId) throw new Error("User ID and Family ID are required");
      
      // Record completion in user document
      await setDoc(doc(this.db, "users", userId), {
        onboardingCompleted: true,
        onboardingCompletedAt: serverTimestamp(),
        latestFamilyId: familyId
      }, { merge: true });
      
      // Record as analytics event
      await this.recordAnalyticsEvent(familyId, {
        event: 'onboarding_completed',
        userId,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error("Error tracking onboarding completion:", error);
      // Don't throw the error to avoid disrupting the user experience
      return false;
    }
  }

  // AI Task Intelligence Engine
  async generateAITaskRecommendations(familyId) {
    try {
      // For a real implementation, this would analyze survey data for "hidden" workload imbalances
      // and generate personalized task recommendations
      
      // For now, we'll mock the AI recommendations
      const hiddenTasks = [
        {
          id: 'ai-1',
          assignedTo: 'Papa',
          assignedToName: 'Stefan',
          title: 'Emotional Check-ins',
          description: 'Our AI detected that Mama is handling 85% of emotional support for the children. Taking time for regular emotional check-ins with each child would help balance this invisible work.',
          isAIGenerated: true,
          hiddenWorkloadType: 'Invisible Parental Tasks',
          insight: 'Through pattern analysis of your family\'s survey responses, we noticed that children consistently report Mama handling emotional support discussions.',
          completed: false,
          completedDate: null,
          comments: []
        },
        {
          id: 'ai-2',
          assignedTo: 'Mama',
          assignedToName: 'Kimberly',
          title: 'Home Maintenance Planning',
          description: 'Papa has been handling most home maintenance decisions. Creating a shared maintenance calendar would help balance this invisible household work.',
          isAIGenerated: true,
          hiddenWorkloadType: 'Invisible Household Tasks',
          insight: 'Survey analysis shows Papa is handling 78% of home maintenance coordination, which creates mental load imbalance.',
          completed: false,
          completedDate: null,
          comments: []
        }
      ];
      
      // In a real implementation, we would save these to the database
      // For now, we'll just return them
      return hiddenTasks;
    } catch (error) {
      console.error("Error generating AI task recommendations:", error);
      throw error;
    }
  }
  
  // Save couple check-in feedback from AI
  async saveCoupleCheckInFeedback(familyId, weekNumber, feedback) {
    try {
      const docRef = doc(this.db, "coupleCheckInFeedback", `${familyId}-week${weekNumber}`);
      await setDoc(docRef, {
        familyId,
        weekNumber,
        feedback,
        generatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error("Error saving couple check-in feedback:", error);
      throw error;
    }
  }

  // Get survey history for a family
  async getSurveyHistory(familyId) {
    try {
      const surveysQuery = query(
        collection(this.db, 'surveys'),
        where('familyId', '==', familyId)
      );
      
      const snapshot = await getDocs(surveysQuery);
      const surveys = [];
      
      snapshot.forEach(doc => {
        surveys.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by completion date, most recent first
      surveys.sort((a, b) => {
        const dateA = a.completedDate ? new Date(a.completedDate) : new Date(0);
        const dateB = b.completedDate ? new Date(b.completedDate) : new Date(0);
        return dateB - dateA;
      });
      
      return surveys;
    } catch (error) {
      console.error("Error getting survey history:", error);
      return [];
    }
  }
}

export default new DatabaseService();