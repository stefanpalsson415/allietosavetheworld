// src/components/user/NotionFamilySelectionScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Camera, Plus, Check, AlertCircle, Upload, 
  Mail, Lock, User, LogOut, Info, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useSurvey } from '../../contexts/SurveyContext';
import DatabaseService from '../../services/DatabaseService';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import { NotionButton } from '../common/NotionUI';
import GoogleAuthButton from '../common/GoogleAuthButton';
import config from '../../config';

// Array of soft Notion-like colors for profile placeholders
const profileColors = [
  'bg-blue-200',  // Soft blue
  'bg-green-200', // Soft green
  'bg-purple-200', // Soft purple
  'bg-amber-200',  // Soft amber
  'bg-red-200',    // Soft red
  'bg-pink-200',   // Soft pink
  'bg-indigo-200', // Soft indigo
  'bg-teal-200',   // Soft teal
];

const NotionFamilySelectionScreen = () => {
  const { 
    currentUser, 
    availableFamilies, 
    loadFamilyData, 
    familyData, 
    login, 
    loginWithOTP,
    logout, 
    loadAllFamilies,
    getMemberSurveyResponses,
    updateFamilyPicture,
    ensureFamiliesLoaded,
    signInWithGoogle
  } = useAuth();
  
  const { 
    familyMembers, 
    selectedUser, 
    selectFamilyMember, 
    setFamilyMembers,
    updateMemberProfile,
    completedWeeks,
    currentWeek, 
    familyId,
    familyName,
    familyPicture
  } = useFamily();

  const { currentSurveyResponses, setCurrentSurveyResponses } = useSurvey();

  const navigate = useNavigate();
  
  // State management
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [uploadForMember, setUploadForMember] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [hasOnboardingProgress, setHasOnboardingProgress] = useState(false);
  const [foundIncompleteFamily, setFoundIncompleteFamily] = useState(null);
  // Email code login states
  const [useEmailCode, setUseEmailCode] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [availableFamiliesForSelection, setAvailableFamiliesForSelection] = useState([]);
  const [showFamilySelection, setShowFamilySelection] = useState(false);
  // Use ChatDrawer context instead of local state
  const { openDrawerWithPrompt } = useChatDrawer();

  // Check if user is already logged in and redirect to dashboard
  const location = useLocation();
  useEffect(() => {
    // If user is already logged in, always go directly to dashboard
    // Users can switch profiles from the dashboard sidebar
    // IMPORTANT: Also wait for family data to load (familyId or availableFamilies)
    // to prevent navigation before FamilyContext is populated
    if (currentUser && !isLoggingIn && (familyId || availableFamilies.length > 0)) {
      console.log("User already logged in with family data, redirecting to dashboard");
      // Just navigate to dashboard, let DashboardWrapper handle the rest
      navigate('/dashboard');
    }
  }, [currentUser, navigate, isLoggingIn, familyId, availableFamilies]);

  // Effect to update login form visibility based on auth state
  useEffect(() => {
    if (currentUser) {
      setShowLoginForm(false);
    } else {
      setShowLoginForm(true);
    }
  }, [currentUser]);
  
  // Check for saved onboarding progress
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem('onboardingProgress');
      if (savedProgress) {
        const { step, familyData, timestamp } = JSON.parse(savedProgress);
        // Check if saved within the last 7 days and has meaningful progress
        const now = new Date().getTime();
        const weekInMs = 7 * 24 * 60 * 60 * 1000;
        
        if (now - timestamp < weekInMs && step > 3 && familyData.familyName) {
          setHasOnboardingProgress(true);
          console.log('🎉 Found saved onboarding progress:', {
            step,
            familyName: familyData.familyName,
            email: familyData.email,
            savedAt: new Date(timestamp)
          });
        }
      }
    } catch (e) {
      console.error("Error checking onboarding progress:", e);
    }
  }, []);

  // Effect to update empty state visibility based on whether we have family members
  useEffect(() => {
    console.log("Current user:", currentUser);
    console.log("Family members:", familyMembers);
    console.log("Available families:", availableFamilies);
    
    if (currentUser && familyMembers.length === 0 && availableFamilies.length === 0) {
      // Only show empty state if there are truly no families
      setShowEmptyState(true);
    } else {
      setShowEmptyState(false);
    }
    
    // Don't do any onboarding redirects - let DashboardWrapper handle it
    // This prevents redirect loops
  }, [currentUser, familyMembers, availableFamilies, navigate, isLoggingIn, location]);  
  
  // Enable Allie chat when content is loaded
  useEffect(() => {
    let timer;
    
    if (familyMembers.length > 0) {
      // Check if any family members are missing profile pictures
      const missingProfiles = familyMembers.filter(m => !m.profilePicture);
      
      if (missingProfiles.length > 0) {
        // Open chat drawer after a short delay for better UX
        timer = setTimeout(() => {
          // The AllieChat component will handle the welcome message automatically
          // based on the current page context
          openDrawerWithPrompt('', { 
            context: 'family_selection',
            showWelcomeMessage: true 
          });
        }, 1500);
      } else {
        // Still open for general welcome even if all have profile pictures
        timer = setTimeout(() => {
          openDrawerWithPrompt('', { 
            context: 'family_selection',
            showWelcomeMessage: true 
          });
        }, 1500);
      }
      
      return () => clearTimeout(timer);
    }
  }, [familyMembers]);

  // Get default profile image based on role
  const getDefaultProfileImage = (member) => {
    // Don't return the default image - let our colorful profile placeholders handle it
    if (!member.profilePicture) {
      return null;
    }
    return member.profilePicture;
  };
  
  // Get a stable color for a member based on their id
  const getMemberColor = (member) => {
    if (!member || !member.id) return profileColors[0];
    
    // Use a simple hash of the member's id to pick a color consistently
    const hashCode = member.id.split('').reduce(
      (acc, char) => acc + char.charCodeAt(0), 0
    );
    
    return profileColors[hashCode % profileColors.length];
  };

  // Check if image URL is valid
  const isValidImageUrl = (url) => {
    // Check if url is defined and not empty
    if (!url || url === '') return false;
    
    // Explicit check for problematic cases
    const invalidPatterns = ['undefined', 'null', 'Tegner', 'Profile', 'broken', 'placeholder'];
    if (invalidPatterns.some(pattern => url.includes(pattern))) return false;
    
    // If it's a data URL, it's likely valid
    if (url.startsWith('data:image/')) return true;
    
    // If it has a common image extension, it's likely valid
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return validExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  // Handle selecting a user
  const handleSelectUser = async (member) => {
    console.log(`Selecting family member: ${member.name}, ID: ${member.id}`);
    
    try {
      // IMPORTANT: Store the selected user ID FIRST, before anything else
      localStorage.setItem('selectedUserId', member.id);
      
      // Select the family member in context
      selectFamilyMember(member);
      
      // Navigate to the appropriate screen based on survey completion
      // Check if member has partial progress
      const responseCount = member.surveys?.initial?.responseCount || 0;
      
      if (member.completed && responseCount >= 72) {
        // Only go to dashboard if truly completed with all 72 responses
        navigate('/dashboard');
      } else if (responseCount > 0 && responseCount < 72) {
        // Has partial progress - continue survey
        console.log(`${member.name} has partial progress: ${responseCount}/72 responses`);
        navigate('/survey');
      } else if (!member.completed) {
        try {
          // Check if this member has a paused survey - IMPROVED to use user-specific key
          let hasInProgressSurvey = false;
          try {
            const userProgressKey = `surveyInProgress_${member.id}`;
            const savedProgress = localStorage.getItem(userProgressKey);
            if (savedProgress) {
              const progress = JSON.parse(savedProgress);
              hasInProgressSurvey = progress.userId === member.id;
              console.log(`Found saved progress for ${member.name}:`, progress);
            }
          } catch (e) {
            console.error("Error checking survey progress:", e);
          }
          
          if (hasInProgressSurvey) {
            // Try to load their saved responses before navigating
            const responses = await getMemberSurveyResponses(member.id, 'initial');
            if (responses && Object.keys(responses).length > 0) {
              // Update the survey context with their saved responses
              setCurrentSurveyResponses(responses);
              console.log("Loaded saved survey progress:", Object.keys(responses).length, "responses");
            }
          }
          
          // Wait for context to be updated before navigating
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Navigate to the appropriate survey type based on role
          if (member.role === 'child') {
            console.log(`Navigating to kid survey for child: ${member.name}`);
            navigate('/kid-survey');
          } else {
            console.log(`Navigating to adult survey for: ${member.name}`);
            navigate('/survey');
          }
        } catch (error) {
          console.error("Error loading saved survey progress:", error);
          
          // Still navigate to the appropriate survey based on role
          if (member.role === 'child') {
            navigate('/kid-survey');
          } else {
            navigate('/survey');
          }
        }
      }
    } catch (error) {
      console.error("Error in handleSelectUser:", error);
      // If there's an error, try a basic navigation
      navigate(member.completed ? '/dashboard' : '/survey');
    }
  };

  // Get the next action for a family member
  const getNextAction = (member) => {
    if (!member.completed) {
      // Check if this specific member has a surveyInProgress flag in localStorage
      let hasInProgressSurvey = false;
      let responseCount = 0;
      
      // Check for response count in member data
      if (member.surveys?.initial?.responseCount) {
        responseCount = member.surveys.initial.responseCount;
        hasInProgressSurvey = responseCount > 0;
      }
      
      // Also check localStorage
      try {
        const surveyProgress = localStorage.getItem('surveyInProgress');
        if (surveyProgress) {
          const progress = JSON.parse(surveyProgress);
          if (progress.userId === member.id) {
            hasInProgressSurvey = true;
          }
        }
      } catch (e) {
        console.error("Error checking survey progress:", e);
      }
      
      // Show progress if partially complete
      if (responseCount > 0 && responseCount < 72) {
        return {
          text: `Continue survey (${responseCount}/72 completed)`,
          icon: <AlertCircle size={12} className="mr-1" />,
          className: "text-[#0F62FE]"
        };
      }
      
      return {
        text: hasInProgressSurvey ? "Resume initial survey" : "Initial survey needed",
        icon: <AlertCircle size={12} className="mr-1" />,
        className: hasInProgressSurvey ? "text-[#0F62FE]" : "text-amber-600"
      };
    }
    
    // If they've completed the initial survey, check weekly survey status
    const latestWeeklyCheckIn = member.weeklyCompleted && member.weeklyCompleted.length > 0 
      ? member.weeklyCompleted[member.weeklyCompleted.length - 1]
      : null;
      
    if (!latestWeeklyCheckIn || !latestWeeklyCheckIn.completed) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (7 - dueDate.getDay())); // Next Sunday
      
      return {
        text: `Complete weekly check-in by ${dueDate.toLocaleDateString()}`,
        icon: <Info size={12} className="mr-1" />,
        className: "text-[#0F62FE]"
      };
    }
    
    return {
      text: "All tasks completed",
      icon: <Check size={12} className="mr-1" />,
      className: "text-green-600"
    };
  };
  
  // Profile picture upload functions
  const handleSelectForUpload = (member, e) => {
    e.stopPropagation();
    setUploadForMember(member);
    setShowProfileUpload(true);
    // Reset any previous upload state
    setIsUploading(false);
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && uploadForMember) {
      handleImageFile(file);
    }
  };

  const handleImageFile = async (file) => {
    setIsUploading(true);
    
    // Validate file size before attempting upload
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setIsUploading(false);
      alert("File is too large. Please select an image under 5MB.");
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setIsUploading(false);
      alert("Please select a valid image file.");
      return;
    }
    
    // Safety timeout to prevent endless loading
    const safetyTimeout = setTimeout(() => {
      console.log("Safety timeout triggered - resetting upload state");
      setIsUploading(false);
      setShowProfileUpload(false);
      alert("Upload timed out. Please try again.");
    }, 30000); // 30 seconds timeout
    
    try {
      if (!uploadForMember || !uploadForMember.id) {
        throw new Error("Missing member information for upload");
      }
      
      if (uploadForMember.id === 'family') {
        // Handle family picture upload
        if (!familyId) {
          throw new Error("Missing family ID for family picture upload");
        }
        
        // Use DatabaseService method directly with the original file
        const imageUrl = await DatabaseService.uploadFamilyPicture(familyId, file);
        
        // Update the family picture in state
        await updateFamilyPicture(imageUrl);
    
        setShowProfileUpload(false);
      } else {
        // Handle individual profile upload
        try {
          // Directly use DatabaseService with the original file
          const imageUrl = await DatabaseService.uploadProfileImage(uploadForMember.id, file);
          
          // Now update the member profile with the new image URL
          await updateMemberProfile(uploadForMember.id, { profilePicture: imageUrl });
          
          // Update local state to show the new image immediately
          const updatedMembers = familyMembers.map(member => {
            if (member.id === uploadForMember.id) {
              return {...member, profilePicture: imageUrl};
            }
            return member;
          });
          
          setFamilyMembers(updatedMembers);
          // Success - close the modal without showing error
          setShowProfileUpload(false);
        } catch (innerError) {
          console.error("Inner upload error:", innerError);
          // Don't show an alert here - the upload likely succeeded but there was an error updating UI
          // Just close the modal - the image is likely there
          setShowProfileUpload(false);
        }
      }
      
      // Clear the safety timeout since upload completed successfully
      clearTimeout(safetyTimeout);
    } catch (error) {
      // Clear the safety timeout on error
      clearTimeout(safetyTimeout);
      
      console.error("Error uploading image:", error);
      
      // Only show alert for critical errors, not for UI update errors
      if (error.code === 'storage/unauthorized' || error.code === 'storage/canceled') {
        alert(error.code === 'storage/unauthorized' ? 
              "You don't have permission to upload files." : 
              "Upload was canceled.");
      } else {
        // Close the modal without error - the image likely uploaded but there was an UI error
        setShowProfileUpload(false);
      }
    } finally {
      // Make absolutely sure loading state is reset
      setIsUploading(false);
    }
  };
  
  // Handle family selection when multiple families are found
  const handleFamilySelection = async (selectedFamily) => {
    try {
      setIsLoggingIn(true);
      console.log('Family selected:', selectedFamily.id, selectedFamily);

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberMeExpiry', new Date().getTime() + (30 * 24 * 60 * 60 * 1000));
      }

      // Use the OTP login function from AuthContext
      console.log('Calling loginWithOTP for:', email, 'familyId:', selectedFamily.id);
      await loginWithOTP(email, selectedFamily.id);

      console.log('Successfully completed passwordless login');

      // Clear form state
      setLoginError('');
      setVerificationError('');
      setCodeSent(false);
      setEmailCode('');
      setIsLoggingIn(false);
      setShowFamilySelection(false);
      setAvailableFamiliesForSelection([]);

      // Navigate to dashboard after successful login
      navigate('/dashboard');
    } catch (error) {
      console.error('Error with family selection login:', error);
      setVerificationError('Login failed. Please try again.');
      setIsLoggingIn(false);
    }
  };

  // Camera capture function
  const openCameraCapture = () => {
    const videoElement = document.createElement('video');
    const canvasElement = document.createElement('canvas');
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoElement.srcObject = stream;
        videoElement.play();
        
        // Create camera UI
        const cameraModal = document.createElement('div');
        cameraModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        
        const cameraContainer = document.createElement('div');
        cameraContainer.className = 'bg-white p-4 rounded-lg max-w-md w-full';
        
        const title = document.createElement('h3');
        title.textContent = 'Take a Profile Picture';
        title.className = 'text-lg font-medium mb-4 font-roboto';
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'relative mb-4';
        videoContainer.appendChild(videoElement);
        videoElement.className = 'w-full rounded';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex justify-between';
        
        const captureButton = document.createElement('button');
        captureButton.textContent = 'Take Photo';
        captureButton.className = 'px-4 py-2 bg-[#0F62FE] text-white rounded';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.className = 'px-4 py-2 border rounded';
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(captureButton);
        
        cameraContainer.appendChild(title);
        cameraContainer.appendChild(videoContainer);
        cameraContainer.appendChild(buttonContainer);
        cameraModal.appendChild(cameraContainer);
        
        document.body.appendChild(cameraModal);
        
        // Handle capture
        captureButton.addEventListener('click', () => {
          // Set canvas dimensions to match video
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
          
          // Draw current video frame to canvas
          canvasElement.getContext('2d').drawImage(
            videoElement, 0, 0, canvasElement.width, canvasElement.height
          );
          
          // Convert to blob
          canvasElement.toBlob(blob => {
            // Stop all tracks to close camera
            videoElement.srcObject.getTracks().forEach(track => track.stop());
            
            // Remove modal
            document.body.removeChild(cameraModal);
            
            // Process the image blob
            const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
            handleImageFile(file);
          }, 'image/jpeg');
        });
        
        // Handle cancel
        cancelButton.addEventListener('click', () => {
          // Stop all tracks to close camera
          videoElement.srcObject.getTracks().forEach(track => track.stop());
          
          // Remove modal
          document.body.removeChild(cameraModal);
        });
      })
      .catch(error => {
        console.error("Error accessing camera:", error);
        alert("Could not access camera. Please check permissions or use file upload instead.");
      });
  };
  

  // Send email verification code
  const handleSendCode = async () => {
    console.log("📧 EMAIL CODE LOGIN - Attempting to send verification code to:", email);
    console.log("📧 EMAIL CODE LOGIN - useEmailCode state:", useEmailCode);
    
    if (!email) {
      setLoginError('Please enter your email address');
      return;
    }

    setSendingCode(true);
    setLoginError('');
    setVerificationError('');

    try {
      // Send OTP request to backend - let backend handle all validation
      const response = await fetch(`${config.backend.url}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          userName: email.split('@')[0] // Use email prefix as name
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setCodeSent(true);
        setLoginError('');
        // Store the OTP temporarily for verification (dev mode only)
        if (data.otp) {
          localStorage.setItem('tempOtp', data.otp);
        }
      } else {
        // Backend will return appropriate error messages
        setLoginError(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending code:', error);
      setLoginError('Unable to send verification code. Please check your connection and try again.');
    } finally {
      setSendingCode(false);
    }
  };

  // Handle email code verification
  const handleEmailCodeLogin = async (e) => {
    e.preventDefault();
    
    if (!emailCode || emailCode.length !== 6) {
      setVerificationError('Please enter the 6-digit code from your email');
      return;
    }

    setIsLoggingIn(true);
    setVerificationError('');
    setLoginError('');

    try {
      // Verify the OTP code with Firebase Function directly
      const functionsUrl = process.env.NODE_ENV === 'production'
        ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/auth/verify-otp'
        : 'http://localhost:5001/parentload-ba995/europe-west1/auth/verify-otp';

      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: emailCode
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // OTP is valid - now handle passwordless login
        console.log('OTP verified successfully, attempting passwordless login...');

        try {
          // Use families data returned from the OTP verification (secure server-side lookup)
          let foundFamily = null;
          let foundFamilyId = null;

          if (data.families && data.families.length > 0) {
            // Families were returned from the server (secure method)
            console.log('Using server-provided family data:', data.families.length, 'families found');

            if (data.families.length === 1) {
              // Single family - proceed directly
              const firstFamily = data.families[0];
              foundFamily = firstFamily;
              foundFamilyId = firstFamily.id;
              console.log('Single family found, proceeding with:', foundFamilyId);
            } else {
              // Multiple families - show selection UI
              console.log('Multiple families found, showing selection UI');
              setAvailableFamiliesForSelection(data.families);
              setShowFamilySelection(true);
              setIsLoggingIn(false);
              return; // Exit here to show family selection
            }
          } else {
            // No families found for this email
            console.log('No families found for email:', email);
            setVerificationError('No family account found for this email. Please check your email or create a new family.');
            setIsLoggingIn(false);
            return;
          }
          
          if (foundFamily && foundFamilyId) {
            console.log('Successfully found family:', foundFamilyId, foundFamily);
            
            // Direct passwordless login after OTP verification
            try {
              console.log('OTP verified, proceeding with passwordless login for:', email);
              
              // Since OTP is verified, we can directly log in the user
              // Use the AuthContext login method with the found family data
              try {
                // Handle remember me
                if (rememberMe) {
                  localStorage.setItem('rememberMe', 'true');
                  localStorage.setItem('rememberMeExpiry', new Date().getTime() + (30 * 24 * 60 * 60 * 1000));
                }
                
                // Use the OTP login function from AuthContext with custom token if available
                console.log('Calling loginWithOTP for:', email, 'familyId:', foundFamilyId, 'customToken:', !!data.customToken);
                await loginWithOTP(email, foundFamilyId, data.customToken);

                console.log('Successfully completed passwordless login');

                // Clear form state and loading BEFORE navigation
                setLoginError('');
                setVerificationError('');
                setCodeSent(false);
                setEmailCode('');

                // CRITICAL FIX: Clear loading state immediately to prevent stuck loading screen
                setIsLoggingIn(false);

                // Let useEffect handle navigation after state updates (lines 92-97)
                // This prevents race condition between state update and navigation
                
              } catch (loginError) {
                console.error('Error with passwordless login:', loginError);
                setVerificationError('Login failed. Please try again.');
                setIsLoggingIn(false);
              }
              
            } catch (authError) {
              console.error('Error with passwordless authentication:', authError);
              setVerificationError(authError.message || 'Authentication failed. Please try again.');
              setIsLoggingIn(false);
            }
          } else {
            // No family found
            console.log('No family found for email:', email);
            setVerificationError('No account found with this email. Please sign up first.');
            setIsLoggingIn(false);
          }
        } catch (error) {
          console.error('Error during passwordless login:', error);
          setVerificationError('Login failed. Please try again or use password login.');
          setIsLoggingIn(false);
        }
      } else {
        setVerificationError(data.error || 'Invalid verification code');
        setIsLoggingIn(false);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError('Verification service unavailable. Please try password login.');
      setIsLoggingIn(false);
    }
  };

  // Login function (for password-based login)
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      console.log("🔐 REGULAR PASSWORD LOGIN - Starting login process for email:", email);
      console.log("🔐 REGULAR PASSWORD LOGIN - Password provided:", !!password);
      console.log("🔐 REGULAR PASSWORD LOGIN - useEmailCode state:", useEmailCode);
      
      // Step 1: Just authenticate
      const user = await login(email, password);
      console.log("NotionFamilySelection: Login successful:", user);
      
      // Handle remember me
      if (rememberMe) {
        // Set a persistent session (30 days)
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberMeExpiry', new Date().getTime() + (30 * 24 * 60 * 60 * 1000));
      }
    
      // Step 2: Navigate directly to dashboard
      // The DashboardWrapper will handle loading families and selecting a user
      console.log("NotionFamilySelection: Navigating to dashboard");
      navigate('/dashboard');
    } catch (error) {
      console.error("NotionFamilySelection: Login error:", error);
      console.error("NotionFamilySelection: Error code:", error.code);
      console.error("NotionFamilySelection: Error message:", error.message);
      
      // Use the enhanced error message from DatabaseService
      setLoginError(error.message || 'Login failed. Please try again.');
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLoginForm(true);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!email) {
      setLoginError('Please enter your email address first');
      return;
    }

    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('../../services/firebase');
      
      await sendPasswordResetEmail(auth, email);
      setLoginError('');
      setShowPasswordReset(false);
      
      // Show success message
      const successMessage = 'Password reset email sent! Check your email for instructions to set your password.';
      setLoginError(successMessage);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setLoginError('');
      }, 5000);
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Check if it's an auth/user-not-found error
      if (error.code === 'auth/user-not-found') {
        // User was created via onboarding without Firebase Auth
        // Provide alternative solution
        setLoginError('Your account was created through onboarding. Please create a new family account to get started, or contact support for assistance.');
      } else {
        setLoginError(`Failed to send password reset email: ${error.message || 'Please try again.'}`);
      }
    }
  };

  // Check for incomplete family through backend
  const checkForIncompleteFamily = async (emailAddress) => {
    // Temporarily disabled until server is restarted
    return;
    
    if (!emailAddress || !emailAddress.includes('@')) return;
    
    try {
      // Call backend endpoint to check family status
      const response = await fetch(`${config.backend.url}/check-family-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailAddress })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.familyExists && data.isIncomplete) {
          console.log('🔍 Found incomplete family for', emailAddress, data.familyData);
          setFoundIncompleteFamily({
            id: data.familyId,
            ...data.familyData
          });
        } else {
          setFoundIncompleteFamily(null);
        }
      } else {
        // Silently fail - this is just a helper feature
        setFoundIncompleteFamily(null);
      }
    } catch (error) {
      // Network error - silently fail
      console.log('Could not check family status:', error.message);
      setFoundIncompleteFamily(null);
    }
  };

  // Resume onboarding function
  const handleResumeOnboarding = () => {
    try {
      const savedProgress = localStorage.getItem('onboardingProgress');
      if (savedProgress) {
        const { step, familyData } = JSON.parse(savedProgress);
        console.log(`🚀 Resuming onboarding at step ${step} for ${familyData.familyName} family`);
        navigate('/onboarding');
      } else {
        console.log('No saved progress found, starting fresh onboarding');
        navigate('/onboarding');
      }
    } catch (e) {
      console.error("Error resuming onboarding:", e);
      navigate('/onboarding');
    }
  };

  // Resume incomplete family setup
  const handleResumeIncompleteFamily = () => {
    if (foundIncompleteFamily) {
      // Create mock localStorage data to resume
      const mockProgress = {
        step: foundIncompleteFamily.phoneVerified ? 10 : 8, // Adjust based on what's missing
        familyData: {
          familyName: foundIncompleteFamily.familyName,
          email: foundIncompleteFamily.email,
          parents: foundIncompleteFamily.parents || [],
          children: foundIncompleteFamily.children || [],
          phoneNumber: foundIncompleteFamily.phoneNumber || '',
          phoneVerified: foundIncompleteFamily.phoneVerified || false
        },
        timestamp: new Date().getTime()
      };

      localStorage.setItem('onboardingProgress', JSON.stringify(mockProgress));
      console.log('🚀 Created resume data for incomplete family:', foundIncompleteFamily.familyName);
      navigate('/onboarding');
    }
  };

  // Handle Google sign-in success
  const handleGoogleSuccess = async ({ user, familyId, needsOnboarding }) => {
    console.log('✅ Google sign-in successful:', user.email, 'needsOnboarding:', needsOnboarding);

    // Handle remember me for Google sign-in
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberMeExpiry', new Date().getTime() + (30 * 24 * 60 * 60 * 1000));
    }

    if (needsOnboarding) {
      // New user - redirect to onboarding
      console.log('🚀 Redirecting to onboarding for new Google user');
      navigate('/onboarding');
    } else {
      // Existing user - redirect to dashboard
      console.log('🏠 Redirecting to dashboard');
      navigate('/dashboard');
    }
  };

  // Handle Google sign-in error
  const handleGoogleError = (error) => {
    console.error('❌ Google sign-in error:', error);

    let errorMessage = 'Failed to sign in with Google. Please try again.';

    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled. Please try again when ready.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Pop-up blocked by browser. Please allow pop-ups for this site.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your connection and try again.';
    }

    setLoginError(errorMessage);
  };

  // Render the login form
  const renderLoginForm = () => {
    return (
      <div className="min-h-screen relative flex flex-col">
        {/* Background Image - Abstract Art */}
        <div
          className="absolute inset-0 z-0 bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500"
          style={{
            backgroundImage: `url('/login-background.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Optional overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2 font-roboto drop-shadow-lg">Allie</h1>
              <p className="text-white/90 font-roboto drop-shadow">
                Log in to access your family's workload balancer
              </p>
            </div>
            
            {/* Login Form Modal */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border border-white/20 p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-center font-roboto">Log In</h2>
              
              {loginError && (
                <div className={`p-3 rounded-md border mb-4 text-sm font-roboto ${
                  loginError.includes('sent') || loginError.includes('verified')
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {loginError}
                </div>
              )}

              {/* Google Sign-In Button */}
              <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                className="mb-4"
              />

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E7EB]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/95 text-[#6B6E70] font-roboto">or</span>
                </div>
              </div>

              {/* Login Method Tabs */}
              <div className="flex mb-4 border-b border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => {
                    setUseEmailCode(true);
                    setLoginError('');
                    setVerificationError('');
                  }}
                  className={`flex-1 py-2 px-4 text-sm font-medium font-roboto transition-colors ${
                    useEmailCode
                      ? 'text-[#0F62FE] border-b-2 border-[#0F62FE]'
                      : 'text-[#6B6E70] hover:text-[#2F3437]'
                  }`}
                >
                  Email Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseEmailCode(false);
                    setLoginError('');
                    setVerificationError('');
                  }}
                  className={`flex-1 py-2 px-4 text-sm font-medium font-roboto transition-colors ${
                    !useEmailCode
                      ? 'text-[#0F62FE] border-b-2 border-[#0F62FE]'
                      : 'text-[#6B6E70] hover:text-[#2F3437]'
                  }`}
                >
                  Password
                </button>
              </div>
              
              <form onSubmit={useEmailCode ? handleEmailCodeLogin : handleLogin} onFocus={() => console.log("🎯 FORM FOCUS - Current mode:", useEmailCode ? "EMAIL CODE" : "PASSWORD")}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2F3437] mb-1 font-roboto">Email</label>
                    <div className="flex border border-[#E5E7EB] rounded-md overflow-hidden">
                      <div className="bg-[#F5F5F5] p-2 flex items-center justify-center">
                        <Mail size={18} className="text-[#6B6E70]" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setCodeSent(false);
                          // Check for incomplete family when email changes
                          if (e.target.value.includes('@')) {
                            checkForIncompleteFamily(e.target.value);
                          }
                        }}
                        className="flex-1 p-2 focus:outline-none focus:ring-1 focus:ring-[#0F62FE] font-roboto bg-white"
                        placeholder="Enter your email"
                        required
                        disabled={useEmailCode && codeSent}
                      />
                    </div>
                  </div>
                  
                  {useEmailCode ? (
                    <>
                      {!codeSent ? (
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={sendingCode || !email}
                          className="w-full py-2 bg-[#0F62FE] text-white rounded-md hover:bg-[#0050D9] flex items-center justify-center font-roboto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingCode ? (
                            <>
                              <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Sending code...
                            </>
                          ) : (
                            'Send Verification Code'
                          )}
                        </button>
                      ) : (
                        <>
                          <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm font-roboto">
                            We've sent a verification code to {email}
                            <p className="text-xs mt-1 text-green-600">Enter the code to complete your login - no password needed!</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-[#2F3437] mb-1 font-roboto">Verification Code</label>
                            <input
                              type="text"
                              value={emailCode}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setEmailCode(value);
                              }}
                              className="w-full p-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F62FE] font-roboto bg-white text-center text-xl tracking-widest"
                              placeholder="000000"
                              maxLength="6"
                              required
                            />
                            {verificationError && (
                              <p className="mt-1 text-sm text-red-600">{verificationError}</p>
                            )}
                          </div>
                          
                          <button
                            type="submit"
                            disabled={isLoggingIn || emailCode.length !== 6}
                            className="w-full py-2 bg-[#0F62FE] text-white rounded-md hover:bg-[#0050D9] flex items-center justify-center font-roboto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoggingIn ? (
                              <>
                                <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Verifying...
                              </>
                            ) : (
                              'Verify & Log In'
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setCodeSent(false);
                              setEmailCode('');
                              setVerificationError('');
                            }}
                            className="w-full text-sm text-[#0F62FE] hover:underline font-roboto"
                          >
                            Didn't receive code? Send again
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[#2F3437] mb-1 font-roboto">Password</label>
                        <div className="flex border border-[#E5E7EB] rounded-md overflow-hidden">
                          <div className="bg-[#F5F5F5] p-2 flex items-center justify-center">
                            <Lock size={18} className="text-[#6B6E70]" />
                          </div>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="flex-1 p-2 focus:outline-none focus:ring-1 focus:ring-[#0F62FE] font-roboto bg-white"
                            placeholder="Enter your password"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-2 bg-[#0F62FE] text-white rounded-md hover:bg-[#0050D9] flex items-center justify-center font-roboto"
                      >
                        {isLoggingIn ? (
                          <>
                            <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Logging in...
                          </>
                        ) : (
                          'Log In'
                        )}
                      </button>
                      
                      {/* Forgot Password Link */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          className="text-sm text-[#0F62FE] hover:underline font-roboto"
                        >
                          Forgot Password? {showPasswordReset && '(Click to send reset email)'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-[#0F62FE] focus:ring-[#0F62FE] border-gray-300 rounded"
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-[#6B6E70] font-roboto">
                      Keep me logged in for 30 days
                    </label>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Resume Onboarding Button - only show if there's saved progress */}
            {hasOnboardingProgress && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-blue-600" />
                  <h3 className="font-medium text-blue-900 font-roboto">Continue Setup</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3 font-roboto">
                  We found your saved family setup progress. Continue where you left off!
                </p>
                <button
                  onClick={handleResumeOnboarding}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-roboto font-medium"
                >
                  Resume Family Setup
                </button>
              </div>
            )}

            {/* Resume Incomplete Family - show if we found partial family data */}
            {foundIncompleteFamily && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-orange-600" />
                  <h3 className="font-medium text-orange-900 font-roboto">Incomplete Setup Found</h3>
                </div>
                <p className="text-sm text-orange-700 mb-3 font-roboto">
                  We found the "{foundIncompleteFamily.familyName}" family setup for this email. Complete your setup!
                </p>
                <button
                  onClick={handleResumeIncompleteFamily}
                  className="w-full py-2 px-4 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-roboto font-medium"
                >
                  Complete {foundIncompleteFamily.familyName} Family Setup
                </button>
              </div>
            )}

            {/* Create New Family Button */}
            <button
              onClick={() => navigate('/onboarding')}
              className="w-full py-3 px-4 rounded-md font-medium text-white bg-[#0F62FE] hover:bg-[#0050D9] flex items-center justify-center font-roboto"
            >
              <Plus size={16} className="mr-2" />
              {hasOnboardingProgress ? 'Start Over (New Family)' : 'Create New Family'}
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="relative z-10 p-4 text-center text-sm text-white/70 font-roboto">
          <p>Allie v1.0 - Balance family responsibilities together</p>
        </div>
      </div>
    );
  };
  
  // Empty state UI for when there are no families
  const renderEmptyState = () => {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-black mb-2 font-roboto">Allie</h1>
              <p className="text-[#6B6E70] font-roboto">
                Welcome to Allie, your family workload balancer
              </p>
            </div>
            
            <div className="bg-white rounded-md border border-[#E5E7EB] p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-center font-roboto">No Families Found</h2>
              <p className="text-center text-[#6B6E70] mb-6 font-roboto">
                It looks like you don't have any families set up yet. Would you like to create one?
              </p>
              
              <button
                onClick={() => navigate('/onboarding')}
                className="w-full py-3 px-4 rounded-md font-medium text-white bg-[#0F62FE] hover:bg-[#0050D9] flex items-center justify-center font-roboto"
              >
                <Plus size={16} className="mr-2" />
                Create New Family
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full mt-4 py-3 px-4 rounded-md font-medium text-[#2F3437] border border-[#E5E7EB] hover:bg-[#F5F5F5] flex items-center justify-center font-roboto"
              >
                <LogOut size={16} className="mr-2" />
                Log Out
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 text-center text-sm text-[#6B6E70] font-roboto">
          <p>Allie v1.0 - Balance family responsibilities together</p>
        </div>
      </div>
    );
  };
  
  // Show loading state if we're logged in but still loading family data
  if (currentUser && isLoggingIn) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-black mb-6 font-roboto">Allie</h1>
          <div className="bg-white rounded-md border border-[#E5E7EB] p-6 mb-8">
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-12 h-12 border-2 border-[#0F62FE] border-t-transparent rounded-full animate-spin mb-4"></div>
              <h2 className="text-xl font-bold mb-2 font-roboto">Loading Your Family</h2>
              <p className="text-[#6B6E70] font-roboto">
                Just a moment while we prepare your family profiles...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If showing login form, render it
  if (showLoginForm) {
    return renderLoginForm();
  }

  // Show family selection UI when multiple families are available
  if (showFamilySelection && availableFamiliesForSelection.length > 0) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-black mb-6 font-roboto text-center">Choose Your Family</h1>

          <div className="bg-white rounded-md border border-[#E5E7EB] p-6 mb-4">
            <p className="text-[#6B6E70] mb-4 text-center">
              You belong to multiple families. Please select which one to log into:
            </p>

            <div className="space-y-3">
              {availableFamiliesForSelection.map((family, index) => (
                <button
                  key={family.id || index}
                  onClick={() => handleFamilySelection(family)}
                  disabled={isLoggingIn}
                  className="w-full p-4 bg-white border-2 border-[#E5E7EB] rounded-lg hover:border-[#0F62FE] hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-black">
                        {family.familyName || family.name || `Family ${index + 1}`}
                      </h3>
                      {family.primaryEmail && (
                        <p className="text-sm text-[#6B6E70] mt-1">
                          {family.primaryEmail}
                        </p>
                      )}
                      {family.familyMembers && (
                        <p className="text-sm text-[#6B6E70] mt-1">
                          {family.familyMembers.length} member{family.familyMembers.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-[#6B6E70] text-xl">→</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowFamilySelection(false);
                setAvailableFamiliesForSelection([]);
                setCodeSent(false);
                setEmailCode('');
              }}
              className="w-full mt-4 p-2 text-[#0F62FE] hover:text-blue-700 text-sm"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if no family members, show empty state
  if (showEmptyState) {
    return renderEmptyState();
  }

  // Check if some family members have completed the survey but others haven't
  const someCompleted = familyMembers.some(m => m.completed);
  const someIncomplete = familyMembers.some(m => !m.completed);

  // Normal profile selection view
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header with Logout */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-black">Allie</h1>
            <button 
              onClick={handleLogout}
              className="text-sm text-[#0F62FE] hover:underline flex items-center"
            >
              <LogOut size={16} className="mr-1" />
              Log Out
            </button>
          </div>
          
          <p className="text-[#6B6E70] text-center mb-6 font-roboto">
            Who are you in the family? Select your profile to begin.
          </p>

          {/* Family member selection */}
          <div className="bg-white rounded-md border border-[#E5E7EB] p-6 mb-8">
            <h2 className="text-xl font-bold mb-6 text-center font-roboto">Choose Your Profile</h2>
              
            <div className="grid grid-cols-1 gap-4">
              {familyMembers.length > 0 ? (
                familyMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="border border-[#E5E7EB] rounded-md p-4 cursor-pointer hover:border-[#C1C7CD] transition-colors"
                    onClick={() => handleSelectUser(member)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4 relative">
                        {!member.profilePicture ? (
                          <div className={`w-16 h-16 rounded-full overflow-hidden border border-[#E5E7EB] relative flex items-center justify-center ${getMemberColor(member)}`}>
                            <span className="text-2xl font-bold text-[#2F3437]">{member.name.charAt(0).toUpperCase()}</span>
                            <button
                              className="absolute -bottom-1 -right-1 bg-[#0F62FE] text-white p-1.5 rounded-full border-2 border-white transition-all hover:bg-[#0050D9]"
                              onClick={(e) => handleSelectForUpload(member, e)}
                            >
                              <Camera size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full overflow-hidden border border-[#E5E7EB]">
                              <img 
                                src={member.profilePicture} 
                                alt={`${member.name}'s profile`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              className="absolute -bottom-1 -right-1 bg-[#0F62FE] text-white p-1.5 rounded-full border-2 border-white transition-all hover:bg-[#0050D9]"
                              onClick={(e) => handleSelectForUpload(member, e)}
                            >
                              <Camera size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg font-roboto text-[#2F3437]">{member.name}</h3>
                        <p className="text-sm text-[#6B6E70] capitalize font-roboto">{member.role}</p>
                        {!member.profilePicture && (
                          <div className="mt-1 text-[#0F62FE] text-xs p-1 rounded font-roboto">
                            <span>Add a photo to personalize your experience</span>
                          </div>
                        )}
                        <div className="mt-1">
                          <span className={`text-xs flex items-center ${getNextAction(member).className} font-roboto`}>
                            {getNextAction(member).icon}
                            {getNextAction(member).text}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 text-[#6B6E70] font-roboto">
                  <p>No family members found. Please check your account or create a new family.</p>
                </div>
              )}
            </div>
          </div>

          {/* Create New Family button */}
          <div className="text-center mt-4">
            <NotionButton
              variant="outline"
              fullWidth
              size="lg"
              onClick={() => navigate('/onboarding')}
              icon={<Plus size={16} />}
            >
              Create New Family
            </NotionButton>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-sm text-[#6B6E70] font-roboto">
        <p>Allie v1.0 - Balance family responsibilities together</p>
      </div>

      {/* Profile picture upload modal */}
      {showProfileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md border border-[#E5E7EB] p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 font-roboto">Update Profile Picture</h3>
            <p className="text-sm text-[#6B6E70] mb-4 font-roboto">
              Select a new photo for {uploadForMember?.name}
            </p>
              
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border border-[#E5E7EB] relative">
                {uploadForMember?.profilePicture ? (
                  <img 
                    src={uploadForMember.profilePicture} 
                    alt="Current profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-[#2F3437] ${getMemberColor(uploadForMember)}`}>
                    <span className="text-4xl font-bold">{uploadForMember?.name?.charAt(0).toUpperCase() || '?'}</span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
            
            {isUploading ? (
              <div className="text-center mb-4">
                <p className="text-[#0F62FE] font-roboto animate-pulse">Uploading your image...</p>
                <p className="text-sm text-[#6B6E70] font-roboto">This will just take a moment</p>
              </div>
            ) : (
              <div className="flex space-x-3 justify-center mb-4">
                <label 
                  htmlFor="image-upload" 
                  className="flex items-center px-4 py-2 bg-[#0F62FE] text-white rounded-md cursor-pointer hover:bg-[#0050D9]"
                >
                  <Upload size={18} className="mr-2" />
                  <span className="text-sm font-roboto">Choose File</span>
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                
                <button
                  onClick={openCameraCapture}
                  className="flex items-center px-4 py-2 bg-white text-[#0F62FE] border border-[#E5E7EB] rounded-md cursor-pointer hover:bg-[#F5F5F5]"
                >
                  <Camera size={18} className="mr-2" />
                  <span className="text-sm font-roboto">Take Photo</span>
                </button>
              </div>
            )}
              
            <div className="flex justify-end">
              <button
                className="px-4 py-2 text-[#6B6E70] hover:text-[#2F3437] font-roboto"
                onClick={() => setShowProfileUpload(false)}
                disabled={isUploading}
              >
                {isUploading ? "Please wait..." : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Allie Chat */}
      {/* Allie chat is now handled by ChatDrawer */}
    </div>
  );
};

export default NotionFamilySelectionScreen;