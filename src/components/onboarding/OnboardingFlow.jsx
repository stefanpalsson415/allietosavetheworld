import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, CheckCircle, Brain,
  Heart, BarChart, Sliders, Scale, Clock, Users, PlusCircle, Edit, Trash2, User,
  ChevronDown, X, Baby, Check, MessageCircle, Target, Zap, Mail
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import familyPhoto from '../../assets/family-photo.jpg';
import MountainProgress from './MountainProgress';
import EmailSelectionStep from './EmailSelectionStep';
import CountryCodePicker from '../common/CountryCodePicker';
// Note: Google Auth now handled by AuthContext.signInWithGoogle (no direct Firebase imports needed)
// import OnboardingSurvey from './OnboardingSurvey'; // Survey moved to landing page/app
import config from '../../config';


const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, currentUser } = useAuth();

  const [step, setStep] = useState(1);
  const [authMethod, setAuthMethod] = useState(null); // 'google' or 'password'
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false); // Loading state for phone verification
  const [isNavigating, setIsNavigating] = useState(false); // Loading state during step transitions
  const [parent2Setup, setParent2Setup] = useState(null); // true/false - user's choice to set up parent 2
  const [familyData, setFamilyData] = useState({
    familyName: '',
    parents: [
      { name: '', role: 'One parent', calledBy: '', gender: '' },
      { name: '', role: 'The other parent', calledBy: '', gender: '' }
    ],
    email: '',
    password: '',
    passwordConfirm: '',
    googleAuth: null, // Will store Google auth data
    phoneNumber: '',
    magicLinkSent: false,
    phoneVerified: false,
    phoneSmsCodeSent: false,
    verificationCode: '',
    skipPhone: false,
    children: [{ name: '', age: '' }],
    communication: {
      style: '',
      challengeAreas: []
    },
    preferences: {
      reminderFrequency: 'weekly',
      meetingDay: 'Sunday'
    },
    priorities: {
      highestPriority: '',
      secondaryPriority: '',
      tertiaryPriority: ''
    },
    aiPreferences: {
      style: '',
      length: '',
      topics: []
    },
    surveyResponses: {}
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  // const [showSurveyFullScreen, setShowSurveyFullScreen] = useState(false); // Survey removed from onboarding
  const [headerTitle, setHeaderTitle] = useState("Let's get started with Allie");
  const [showChallengeDropdown, setShowChallengeDropdown] = useState(false);
  const [showPriorityDropdowns, setShowPriorityDropdowns] = useState({
    highest: false,
    secondary: false,
    tertiary: false
  });
  const [showTopicsDropdown, setShowTopicsDropdown] = useState(false);
  const [countryCode, setCountryCode] = useState('+1');
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [resumeEmail, setResumeEmail] = useState('');
  const [resumePhone, setResumePhone] = useState('');
  const [resumeMessage, setResumeMessage] = useState('');
  const [resumeMessageType, setResumeMessageType] = useState(''); // 'success', 'error', 'info'
  const resumeFormRef = useRef(null);

  const totalSteps = 13; // Auth refactor + combined Communication & AI Preferences steps
  
  // Helper function to format phone numbers for display
  const formatPhoneForDisplay = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove any non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Handle Swedish numbers (+46)
    if (phoneNumber.startsWith('+46')) {
      const localNumber = digits.substring(2); // Remove 46
      if (localNumber.length === 10) {
        // Format as +46 73 153 63 04
        return `+46 ${localNumber.substring(0, 2)} ${localNumber.substring(2, 5)} ${localNumber.substring(5, 7)} ${localNumber.substring(7)}`;
      }
    }
    
    // Handle US numbers (+1)
    if (phoneNumber.startsWith('+1')) {
      const localNumber = digits.substring(1); // Remove 1
      if (localNumber.length === 10) {
        // Format as +1 (555) 123-4567
        return `+1 (${localNumber.substring(0, 3)}) ${localNumber.substring(3, 6)}-${localNumber.substring(6)}`;
      }
    }
    
    // Default: just add spaces every 3-4 digits
    return phoneNumber;
  };

  // Helper function to get phone placeholder based on country code
  const getPhonePlaceholder = (code) => {
    const placeholders = {
      '+1': '(555) 123-4567',           // US/Canada
      '+44': '20 7946 0958',            // UK
      '+33': '1 23 45 67 89',           // France
      '+49': '30 12345678',             // Germany
      '+34': '600 123 456',             // Spain
      '+39': '312 345 6789',            // Italy
      '+46': '70 123 45 67',            // Sweden
      '+47': '401 23 456',              // Norway
      '+45': '20 12 34 56',             // Denmark
      '+358': '40 123 4567',            // Finland
      '+31': '6 12345678',              // Netherlands
      '+32': '470 12 34 56',            // Belgium
      '+41': '78 123 45 67',            // Switzerland
      '+43': '664 123 4567',            // Austria
      '+351': '912 345 678',            // Portugal
      '+353': '85 123 4567',            // Ireland
      '+354': '611 1234',               // Iceland
      '+48': '500 123 456',             // Poland
      '+420': '601 123 456',            // Czech Republic
      '+421': '901 123 456',            // Slovakia
      '+36': '20 123 4567',             // Hungary
      '+40': '722 123 456',             // Romania
      '+30': '690 123 4567',            // Greece
      '+90': '532 123 4567',            // Turkey
      '+372': '5123 4567',              // Estonia
      '+371': '2123 4567',              // Latvia
      '+370': '612 34567',              // Lithuania
      '+61': '412 345 678',             // Australia
      '+64': '21 123 456',              // New Zealand
      '+81': '90 1234 5678',            // Japan
      '+82': '10 1234 5678',            // South Korea
      '+86': '138 0013 8000',           // China
      '+91': '98765 43210',             // India
      '+55': '11 91234 5678',           // Brazil
      '+52': '55 1234 5678',            // Mexico
      '+54': '11 1234 5678',            // Argentina
      '+27': '71 123 4567',             // South Africa
      '+234': '802 123 4567',           // Nigeria
      '+20': '100 123 4567',            // Egypt
      '+966': '50 123 4567',            // Saudi Arabia
      '+971': '50 123 4567',            // UAE
      '+972': '50 123 4567',            // Israel
      '+7': '912 345 6789',             // Russia
      '+380': '50 123 4567',            // Ukraine
      '+48': '500 123 456',             // Poland
      '+65': '8123 4567',               // Singapore
      '+60': '12 345 6789',             // Malaysia
      '+62': '812 3456 7890',           // Indonesia
      '+63': '905 123 4567',            // Philippines
      '+66': '81 234 5678',             // Thailand
      '+84': '91 234 5678',             // Vietnam
    };
    
    return placeholders[code] || '123 456 789';
  };
  
  // Save progress between steps
  useEffect(() => {
    // Don't save if we're on step 1 with empty family name (initial state)
    if (step === 1 && !familyData.familyName) {
      return;
    }
    
    try {
      localStorage.setItem('onboardingProgress', JSON.stringify({
        step,
        familyData,
        timestamp: new Date().getTime()
      }));
    } catch (e) {
      console.error("Error saving onboarding progress:", e);
    }
  }, [step, familyData]);
  
  // Try to restore progress on initial load
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem('onboardingProgress');
      if (savedProgress) {
        const { step: savedStep, familyData: savedData, timestamp } = JSON.parse(savedProgress);
        
        // Only restore if saved within the last 24 hours
        const now = new Date().getTime();
        if (now - timestamp < 24 * 60 * 60 * 1000) {
          // Ensure parents have calledBy field (migration for old saved data)
          if (savedData.parents) {
            savedData.parents = savedData.parents.map(parent => ({
              ...parent,
              calledBy: parent.calledBy || ''
            }));
          }
          setStep(savedStep);
          setFamilyData(savedData);
          if (savedData.familyName) {
            setHeaderTitle(`The ${savedData.familyName} Family`);
          }
          // Scroll to top when loading saved progress
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } catch (e) {
      console.error("Error restoring onboarding progress:", e);
    }
  }, []);

  // NOTE: Redirect restoration logic no longer needed with popup flow
  // Keeping for reference in case we need to switch back to redirect flow
  /*
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const savedEmail = localStorage.getItem('onboarding_google_email');
    const savedStep = localStorage.getItem('onboarding_step');
    const savedFamilyData = localStorage.getItem('onboarding_family_data');

    if (!savedEmail) {
      return;
    }

    console.log('✅ Detected return from Google redirect - restoring onboarding state');

    try {
      if (savedFamilyData) {
        const restoredData = JSON.parse(savedFamilyData);
        setFamilyData({
          ...restoredData,
          googleAuth: {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            photoURL: currentUser.photoURL,
            authenticated: true,
            needsFirebaseUser: false
          }
        });
      }

      if (savedStep) {
        setStep(parseInt(savedStep));
      }

      setAuthMethod('google');

      localStorage.removeItem('onboarding_google_email');
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('onboarding_family_data');

      console.log('✅ Onboarding state restored');
    } catch (error) {
      console.error('❌ Error restoring onboarding state:', error);
      setValidationErrors({
        googleAuth: 'Failed to restore onboarding progress. Please try signing in again.'
      });

      localStorage.removeItem('onboarding_google_email');
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('onboarding_family_data');
    }
  }, [currentUser]);
  */

  // Update header title when family name changes
  useEffect(() => {
    if (familyData.familyName.trim()) {
      setHeaderTitle(`The ${familyData.familyName} Family`);
    } else {
      setHeaderTitle("Let's get started with Allie");
    }
  }, [familyData.familyName]);
  
  
  // Handle data updates
  const updateFamily = (key, value) => {
    setFamilyData(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear validation error when field is updated
    if (validationErrors[key]) {
      const newErrors = {...validationErrors};
      delete newErrors[key];
      setValidationErrors(newErrors);
    }
  };
  
  const updateParent = (index, field, value) => {
    const updatedParents = [...familyData.parents];
    updatedParents[index] = { ...updatedParents[index], [field]: value };
    updateFamily('parents', updatedParents);
    
    // Clear validation error when field is updated
    const errorKey = `parent_${index}_${field}`;
    if (validationErrors[errorKey]) {
      const newErrors = {...validationErrors};
      delete newErrors[errorKey];
      setValidationErrors(newErrors);
    }
  };
  
  const updateChild = (index, field, value) => {
    const updatedChildren = [...familyData.children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    updateFamily('children', updatedChildren);
    
    // Clear validation error when field is updated
    const errorKey = `child_${index}_${field}`;
    if (validationErrors[errorKey]) {
      const newErrors = {...validationErrors};
      delete newErrors[errorKey];
      setValidationErrors(newErrors);
    }
  };
  
  const addChild = () => {
    updateFamily('children', [...familyData.children, { name: '', age: '' }]);
  };
  
  const removeChild = (index) => {
    if (familyData.children.length > 1) {
      const updatedChildren = [...familyData.children];
      updatedChildren.splice(index, 1);
      updateFamily('children', updatedChildren);
    }
  };
  
  const updateCommunication = (field, value) => {
    const updatedCommunication = { ...familyData.communication, [field]: value };
    updateFamily('communication', updatedCommunication);
    
    // Clear validation error when field is updated
    const errorKey = `communication_${field}`;
    if (validationErrors[errorKey]) {
      const newErrors = {...validationErrors};
      delete newErrors[errorKey];
      setValidationErrors(newErrors);
    }
  };
  
  const toggleChallengeArea = (area) => {
    const currentAreas = familyData.communication.challengeAreas || [];
    if (currentAreas.includes(area)) {
      updateCommunication('challengeAreas', currentAreas.filter(a => a !== area));
    } else {
      updateCommunication('challengeAreas', [...currentAreas, area]);
    }
  };
  
  const updatePreference = (field, value) => {
    const updatedPreferences = { ...familyData.preferences, [field]: value };
    updateFamily('preferences', updatedPreferences);
  };

  const updateAIPreference = (field, value) => {
    const updatedPreferences = { ...familyData.aiPreferences, [field]: value };
    updateFamily('aiPreferences', updatedPreferences);
  };

  const toggleAITopic = (topic) => {
    const currentTopics = familyData.aiPreferences.topics || [];
    if (currentTopics.includes(topic)) {
      updateAIPreference('topics', currentTopics.filter(t => t !== topic));
    } else {
      updateAIPreference('topics', [...currentTopics, topic]);
    }
  };
  
  // Validation for each step
  const validateStep = (currentStep) => {
    const errors = {};
    
    switch(currentStep) {
      case 2: // Family name
        if (!familyData.familyName.trim()) {
          errors.familyName = 'Please enter your family name';
        }
        break;
      
      case 3: // Parent information
        familyData.parents.forEach((parent, index) => {
          if (!parent.name.trim()) {
            errors[`parent_${index}_name`] = 'Name is required';
          }
          if (!parent.calledBy) {
            errors[`parent_${index}_calledBy`] = 'Please select what the kids call them';
          }
        });
        break;
      
      case 4: // Children information
        familyData.children.forEach((child, index) => {
          if (!child.name.trim()) {
            errors[`child_${index}_name`] = 'Name is required';
          }
        });
        break;
        
      case 5: // Communication & AI Preferences (COMBINED)
        // Family communication style
        if (!familyData.communication.style) {
          errors.communication_style = 'Please select a communication style';
        }
        // AI preferences
        if (!familyData.aiPreferences.style) {
          errors.aiPreferences_style = 'Please select Allie\'s communication style';
        }
        if (!familyData.aiPreferences.length) {
          errors.aiPreferences_length = 'Please select a response length preference';
        }
        break;

      case 7: // Family priorities (was 8)
        if (!familyData.priorities.highestPriority) {
          errors.priorities_highest = 'Please select your highest priority concern';
        }
        if (familyData.priorities.highestPriority &&
            (familyData.priorities.highestPriority === familyData.priorities.secondaryPriority ||
             familyData.priorities.highestPriority === familyData.priorities.tertiaryPriority)) {
          errors.priorities_duplicate = 'Please select different categories for each priority level';
        }
        if (familyData.priorities.secondaryPriority &&
            familyData.priorities.secondaryPriority === familyData.priorities.tertiaryPriority) {
          errors.priorities_duplicate = 'Please select different categories for each priority level';
        }
        break;

      case 8: // Auth Method Selection (was 9)
        if (!authMethod) {
          errors.authMethod = 'Please choose a sign-in method';
        }
        break;

      case 9: // Conditional Auth (Email/Password OR Google) - was 10
        // Check that at least one parent has an email
        const hasParentEmails = familyData.parents.some(p => p.email && p.email.trim());
        if (!hasParentEmails) {
          errors.parent_0_email = 'Please enter at least one parent email';
        }

        // Check for duplicate emails between parents
        const parent0Email = familyData.parents[0]?.email?.trim().toLowerCase();
        const parent1Email = familyData.parents[1]?.email?.trim().toLowerCase();
        if (parent0Email && parent1Email && parent0Email === parent1Email) {
          errors.parent_1_email = 'Email already used for other parent';
        }

        // Validate each parent's email if provided
        familyData.parents.forEach((parent, index) => {
          if (parent.email && !/\S+@\S+\.\S+/.test(parent.email)) {
            errors[`parent_${index}_email`] = 'Invalid email format';
          }
        });

        // Check that one email is selected for verification
        if (!familyData.email && hasParentEmails) {
          errors.email = 'Please select which email to verify';
        }

        // Password validation (only required if email is verified AND not using Google Auth)
        const emailIndex = familyData.selectedEmailIndex || familyData.primaryParentIndex || 0;
        const isEmailVerified = familyData[`email_${emailIndex}_verified`] || familyData.emailVerified;

        if (isEmailVerified && authMethod !== 'google') {
          // Using password authentication - validate password fields
          if (!familyData.password || familyData.password.trim() === '') {
            errors.password = 'Please create a password';
          } else if (familyData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
          }

          if (!familyData.passwordConfirm || familyData.passwordConfirm.trim() === '') {
            errors.passwordConfirm = 'Please confirm your password';
          } else if (familyData.password !== familyData.passwordConfirm) {
            errors.passwordConfirm = 'Passwords do not match';
          }
        } else if (isEmailVerified && authMethod === 'google') {
          // Using Google Auth - ensure we have Google auth data
          if (!familyData.googleAuth || !familyData.googleAuth.authenticated) {
            errors.googleAuth = 'Google authentication is not complete';
          }
        }

        // Don't validate OTP here - it's handled in nextStep
        break;

      case 10: // Optional Parent 2 Setup (NEW) - was 11
        // No validation needed - it's a choice (Yes/Skip)
        break;

      case 11: // Phone (optional) - was 12
        // Only require phone if no phone has been verified yet
        if (!familyData.skipPhone && !familyData.phoneVerified && !familyData.phoneNumber.trim()) {
          errors.phoneNumber = 'Phone number is required (or check skip)';
        }
        break;

      case 12: // Email selection - was 13
        // Don't validate here - it's handled by the component and nextStep
        break;

      case 13: // Confirmation - was 14
        // No validation needed - final step
        break;
        
      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Resume with email or phone function
  const handleResumeWithEmailOrPhone = async () => {
    if (!resumeEmail && !resumePhone) {
      setResumeMessage('Please enter either an email address or phone number to search for your setup.');
      setResumeMessageType('error');
      return;
    }
    
    setResumeMessage('Searching for your setup...');
    setResumeMessageType('info');
    
    // First check localStorage for saved progress
    const savedProgress = localStorage.getItem('onboardingProgress');
    if (savedProgress) {
      try {
        const { step: savedStep, familyData: savedData } = JSON.parse(savedProgress);
        if (savedData && (savedData.email === resumeEmail || savedData.phoneNumber === resumePhone)) {
          console.log('✅ Found saved progress in localStorage!');
          console.log('Resuming at step:', savedStep, 'with data:', savedData);
          
          // Update header title
          if (savedData.familyName) {
            setHeaderTitle(`The ${savedData.familyName} Family`);
          }
          
          // Set the correct step (from saved data, not current step variable)
          setStep(savedStep);
          setFamilyData(savedData);
          setResumeMessage(`Found your "${savedData.familyName}" family setup! Resuming at step ${savedStep}...`);
          setResumeMessageType('success');
          
          // Hide form and scroll to top after short delay
          setTimeout(() => {
            setShowResumeForm(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 1500);
          return;
        }
      } catch (e) {
        console.error('Error parsing saved progress:', e);
      }
    }
    
    // Check if Firebase is properly initialized (removed mock mode bypass)
    // Always try to use real Firebase first
    
    if (false) { // Disabled mock mode - always use real Firebase
      console.log('🧪 Running in mock mode - simulating found family for:', resumeEmail);
      
      // Mock data for spalsson@gmail.com
      if (resumeEmail === 'spalsson@gmail.com') {
        const mockResumeData = {
          step: 8, // Email verified but phone not verified
          familyData: {
            familyName: 'Spalsson',
            email: resumeEmail,
            parents: [
              { name: 'Stefan', role: 'Parent 1', calledBy: 'Dad', gender: 'male' },
              { name: '', role: 'Parent 2', calledBy: '', gender: '' }
            ],
            children: [{ name: '', age: '' }],
            phoneNumber: resumePhone || '',
            phoneVerified: false,
            emailVerified: true,
            magicLinkSent: true,
            communication: { style: '', challengeAreas: [] },
            preferences: { reminderFrequency: 'weekly', meetingDay: 'Sunday' },
            priorities: { highestPriority: '', secondaryPriority: '', tertiaryPriority: '' },
            aiPreferences: { style: '', length: '', topics: [] }
          },
          timestamp: new Date().getTime()
        };
        
        localStorage.setItem('onboardingProgress', JSON.stringify(mockResumeData));
        setStep(mockResumeData.step);
        setFamilyData(mockResumeData.familyData);
        
        alert(`🧪 Mock: Found your "Spalsson" family setup! Resuming at step ${mockResumeData.step}...`);
        setShowResumeForm(false);
        return;
      } else {
        alert('🧪 Mock mode: No setup found for that email. (Try spalsson@gmail.com)');
        return;
      }
    }
    
    // Real Firebase search
    try {
      console.log('🔍 Attempting Firebase search for:', resumeEmail, resumePhone);
      const { collection, query, where, getDocs, or } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase');

      // Build query conditions
      console.log('🔍 Building search query...');
      let snapshot;
      
      if (resumeEmail && resumePhone) {
        // Search by both email and phone
        const familiesQuery = query(
          collection(db, 'families'),
          or(
            where('email', '==', resumeEmail),
            where('phoneNumber', '==', resumePhone)
          )
        );
        snapshot = await getDocs(familiesQuery);
      } else if (resumeEmail) {
        // Search by email - check both family email and parent emails
        console.log('🔍 Searching by email:', resumeEmail);

        // Since Firestore doesn't support complex queries on array objects,
        // we need to fetch all families and filter manually
        console.log('Fetching all families to search for email...');

        const allFamiliesQuery = query(collection(db, 'families'));
        const allSnapshot = await getDocs(allFamiliesQuery);

        console.log(`Found ${allSnapshot.size} total families to search through`);

        const matchingDocs = [];
        allSnapshot.forEach(doc => {
          const data = doc.data();

          // Debug logging to see what we're checking
          if (data.parents && Array.isArray(data.parents)) {
            console.log(`Checking family ${doc.id} (${data.familyName}):`, {
              parents: data.parents.map(p => ({ email: p.email, verified: p.emailVerified })),
              primaryEmail: data.primaryEmail,
              familyEmail: data.familyEmail
            });
          }

          // Check if any parent has this email
          if (data.parents && Array.isArray(data.parents)) {
            const hasEmail = data.parents.some(parent => parent.email === resumeEmail);
            if (hasEmail) {
              console.log(`✅ Found match in parents array for family ${doc.id}`);
              matchingDocs.push(doc);
            }
          }

          // Also check the primaryEmail field
          if (data.primaryEmail === resumeEmail) {
            console.log(`✅ Found match in primaryEmail for family ${doc.id}`);
            if (!matchingDocs.includes(doc)) {
              matchingDocs.push(doc);
            }
          }

          // Also check familyMembers array (for completed families)
          if (data.familyMembers && Array.isArray(data.familyMembers)) {
            const hasMemberEmail = data.familyMembers.some(member => member.email === resumeEmail);
            if (hasMemberEmail) {
              console.log(`✅ Found match in familyMembers for family ${doc.id}`);
              if (!matchingDocs.includes(doc)) {
                matchingDocs.push(doc);
              }
            }
          }

          // Also check the family email field (for family forwarding emails like palsson@families.checkallie.com)
          if (data.email === resumeEmail || data.familyEmail === resumeEmail) {
            console.log(`✅ Found match in family email for family ${doc.id}`);
            if (!matchingDocs.includes(doc)) {
              matchingDocs.push(doc);
            }
          }
        });

        console.log(`Found ${matchingDocs.length} matching families for email ${resumeEmail}`);

        snapshot = {
          empty: matchingDocs.length === 0,
          docs: matchingDocs,
          size: matchingDocs.length
        };
      } else if (resumePhone) {
        // Search by phone only
        console.log('🔍 Searching by phone:', resumePhone);
        const familiesQuery = query(
          collection(db, 'families'),
          where('phoneNumber', '==', resumePhone)
        );
        snapshot = await getDocs(familiesQuery);
      }
      
      console.log('📊 Search query returned:', snapshot?.size || 0, 'documents');
      
      if (!snapshot.empty) {
        const familyDoc = snapshot.docs[0];
        const familyData = familyDoc.data();
        
        // Check if family setup is incomplete
        const isIncomplete = !familyData.setupComplete || 
                           !familyData.surveyCompleted ||
                           !familyData.phoneVerified;
        
        if (isIncomplete) {
          // Create resume data and continue
          const resumeStep = familyData.phoneVerified ? 10 : 
                           familyData.emailVerified ? 8 : 
                           familyData.children ? 6 : 3;
          
          const resumeData = {
            step: resumeStep,
            familyData: {
              familyName: familyData.familyName || '',
              email: familyData.email || resumeEmail,
              parents: familyData.parents || [{ name: '', role: 'Parent 1', calledBy: '', gender: '' }, { name: '', role: 'Parent 2', calledBy: '', gender: '' }],
              children: familyData.children || [{ name: '', age: '' }],
              phoneNumber: familyData.phoneNumber || resumePhone,
              phoneVerified: familyData.phoneVerified || false,
              emailVerified: familyData.emailVerified || false,
              communication: familyData.communication || { style: '', challengeAreas: [] },
              preferences: familyData.preferences || { reminderFrequency: 'weekly', meetingDay: 'Sunday' },
              priorities: familyData.priorities || { highestPriority: '', secondaryPriority: '', tertiaryPriority: '' },
              aiPreferences: familyData.aiPreferences || { style: '', length: '', topics: [] }
            },
            timestamp: new Date().getTime()
          };
          
          localStorage.setItem('onboardingProgress', JSON.stringify(resumeData));
          
          // Update current state
          setStep(resumeStep);
          setFamilyData(resumeData.familyData);
          // Scroll to top when resuming
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          setResumeMessage(`Found your "${familyData.familyName}" family setup! Resuming where you left off...`);
          setResumeMessageType('success');
          setTimeout(() => setShowResumeForm(false), 2000);
        } else {
          setResumeMessage(`Found your "${familyData.familyName}" family, but setup appears to be complete. You can log in from the main page.`);
          setResumeMessageType('info');
        }
      } else {
        setResumeMessage('No incomplete family setup found with that email or phone number. You can continue with a new setup.');
        setResumeMessageType('error');
      }
    } catch (error) {
      console.error('❌ Error searching for family:', error);
      console.error('Full error details:', error.message, error.stack);
      setResumeMessage(`Error searching for your setup: ${error.message}. Please try again or continue with a new setup.`);
      setResumeMessageType('error');
    }
  };

  // Handle Google Sign-In - USING REDIRECT (MORE RELIABLE)
  const handleGoogleSignIn = async () => {
    setGoogleAuthLoading(true);
    setValidationErrors({});

    try {
      console.log('🔐 Starting Google Authentication via AuthContext...');

      // Step 1: Get the email from the form (user already entered it)
      const emailIndex = familyData.selectedEmailIndex || familyData.primaryParentIndex || 0;
      const formEmail = familyData[`email_${emailIndex}`] || familyData.parents?.[0]?.email;

      if (!formEmail) {
        throw new Error('No email address found. Please enter your email first.');
      }

      console.log('📧 Form email:', formEmail);

      // Step 2: Use AuthContext.signInWithGoogle with POPUP flow (no page reload, immediate feedback)
      const result = await signInWithGoogle({
        usePopup: true, // Use popup flow - avoids blank page issue and provides immediate confirmation
        email: formEmail, // Validate email matches
        onProgress: (message) => {
          console.log('📊 Progress:', message);
        }
      });

      // With popup flow, we always get a result (no redirect needed)
      if (!result.success) {
        throw new Error(result.error || 'Google authentication failed');
      }

      // If we got here, authentication was successful (popup flow or returning from redirect)
      console.log('✅ Google Auth successful!', result);

      // Update familyData with Google auth info
      updateFamily('googleAuth', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        accessToken: result.accessToken,
        authenticated: true,
        needsFirebaseUser: false // Already has Firebase user from signInWithGoogle
      });

      setAuthMethod('google');
      setGoogleAuthLoading(false);

      // Clear any password fields since using Google Auth
      updateFamily('password', '');
      updateFamily('passwordConfirm', '');

    } catch (error) {
      console.error('❌ Google Auth error:', error);

      // User-friendly error messages (AuthContext already provides good messages)
      let errorMessage = error.message || 'Failed to sign in with Google. Please try again.';

      setValidationErrors({
        googleAuth: errorMessage
      });
      setGoogleAuthLoading(false);
    }
  };

  // Move to next step
  const nextStep = async () => {
    // Set navigating state to prevent white screen during async operations
    setIsNavigating(true);

    try {
      // Validate the current step
      if (!validateStep(step)) {
        setIsNavigating(false);
        return;
      }

      // Hide the resume form when moving forward
      if (showResumeForm) {
        setShowResumeForm(false);
        setResumeMessage('');
      }
    
    // Special handling for step 9 (Conditional Auth - Google OR Password)
    const emailIndex = familyData.selectedEmailIndex || familyData.primaryParentIndex || 0;
    const isCurrentEmailVerified = familyData[`email_${emailIndex}_verified`];

    if (step === 9) {
      // Google Auth path
      if (authMethod === 'google') {
        // Check if Google auth is complete
        if (!familyData.googleAuth?.authenticated) {
          setValidationErrors({ googleAuth: 'Please complete Google authentication before continuing' });
          setIsNavigating(false);
          return;
        }
      }

      // Password Auth path
      else if (authMethod === 'password') {
        // If OTP not sent yet, send it
        if (!familyData.otpSent && !isCurrentEmailVerified) {
          // Get the correct email to send to
          const emailToVerify = familyData.email || familyData.parents[emailIndex]?.email;

          if (!emailToVerify) {
            console.error('No email found for verification');
            setValidationErrors({ email_warning: 'Please select an email to verify' });
            setIsNavigating(false);
            return;
          }

          // Show OTP input immediately without waiting for the API response
          updateFamily('otpSent', true);

          // Send OTP in background (non-blocking)
          const functionsUrl = process.env.NODE_ENV === 'production'
            ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/auth/send-otp'
            : 'http://localhost:5001/parentload-ba995/europe-west1/auth/send-otp';

          console.log(`Sending OTP to: ${emailToVerify} (index: ${emailIndex})`);

          // Fire and forget - don't wait for response
          fetch(functionsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: emailToVerify,
              userName: familyData.familyName
            })
          }).then(response => response.json())
            .then(data => {
              console.log('OTP send response:', data);
              if (!data.success) {
                console.error('Failed to send OTP:', data.error);
                setValidationErrors({ email_warning: data.error || 'Email delivery might be delayed' });
              }
            })
            .catch(error => {
              console.error('Error sending OTP:', error);
              setValidationErrors({ email_warning: 'Email delivery might be delayed' });
            });

          // Don't advance to next step - stay on same step to show OTP input
          setIsNavigating(false);
          return;
        }

        // Check if email is verified
        const hasVerifiedEmail = familyData.emailVerified || familyData.email_0_verified || familyData.email_1_verified;
        if (!hasVerifiedEmail) {
          setValidationErrors({ emailOTP: 'Please verify your email before continuing' });
          setIsNavigating(false);
          return;
        }

        // Check if password is created (validation will check this, but adding explicit message)
        if (!familyData.password || familyData.password.length < 8) {
          setValidationErrors({ password: 'Please create a password (at least 8 characters)' });
          setIsNavigating(false);
          return;
        }

        if (familyData.password !== familyData.passwordConfirm) {
          setValidationErrors({ passwordConfirm: 'Passwords do not match' });
          setIsNavigating(false);
          return;
        }
      }
    }
    
    // Special handling for phone step
    if (step === 11) {
      // If phone number is entered but not verified and not skipping
      if (familyData.phoneNumber && !familyData.phoneVerified && !familyData.skipPhone) {
        // If SMS not sent yet, send it
        if (!familyData.phoneSmsCodeSent) {
          try {
            // Format phone number with country code
            const fullPhoneNumber = countryCode + familyData.phoneNumber.replace(/\D/g, '');
            
            const endpoint = process.env.NODE_ENV === 'production'
              ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/twilioSendVerification'
              : '/api/twilio/send-verification';

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phoneNumber: fullPhoneNumber,
                userId: familyData.email || 'temp-user' // Use email as temp userId since we don't have auth yet
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              updateFamily('phoneSmsCodeSent', true);
              updateFamily('fullPhoneNumber', fullPhoneNumber);
              // Show verification code input UI
              console.log('Verification code sent to ' + fullPhoneNumber);
              if (data.debug) {
                console.log('Debug mode - verification code:', data.debug);
              }
              // Don't advance - stay on this step to show verification input
              setIsNavigating(false);
              return;
            } else {
              setValidationErrors({ phoneNumber: data.error || 'Failed to send SMS verification' });
              setIsNavigating(false);
              return;
            }
          } catch (error) {
            console.error('Error sending SMS verification:', error);
            const errorMsg = error.message.includes('fetch') ?
              'SMS service unavailable. Check that backend server is running on port 3002.' :
              'Failed to send SMS. Check your phone number and try again.';
            setValidationErrors({ phoneNumber: errorMsg });
            setIsNavigating(false);
            return;
          }
        } else {
          // SMS was sent but not verified - don't advance
          setValidationErrors({ phoneVerificationCode: 'Please verify your phone number before continuing' });
          setIsNavigating(false);
          return;
        }
      }
      // If no phone number, or phone is verified, or user is skipping, allow advancement
    }
    
    console.log(`[OnboardingFlow] Advancing from step ${step} to step ${step + 1}`);
    console.log('[OnboardingFlow] Current familyData:', {
      familyName: familyData.familyName,
      emailVerified: familyData.emailVerified,
      phoneVerified: familyData.phoneVerified,
      familyEmail: familyData.familyEmail,
      familyEmailPrefix: familyData.familyEmailPrefix
    });
    
    // Special handling for email selection step
    if (step === 12) {
      // Use the pending email selection data
      if (familyData.pendingEmailSelection) {
        updateFamily('familyEmail', familyData.pendingEmailSelection.fullEmail);
        updateFamily('familyEmailPrefix', familyData.pendingEmailSelection.email);
        updateFamily('pendingEmailSelection', null); // Clear the pending data
      } else {
        setValidationErrors({ email: 'Please select a family email' });
        setIsNavigating(false);
        return;
      }
    }
    
    // Special handling for Optional Parent 2 Setup (step 10)
    if (step === 10) {
      console.log('[OnboardingFlow] Step 10 check - parent2Setup value:', parent2Setup);

      if (parent2Setup === 'yes') {
        // User wants to set up Parent 2 now
        // Pre-select Parent 2's email and go back to step 9 for verification
        const parent2Index = 1;
        const parent2Email = familyData.parents[parent2Index]?.email;

        if (parent2Email) {
          console.log('[OnboardingFlow] Setting up Parent 2 - redirecting to email verification');

          // Pre-select Parent 2's email for verification
          updateFamily('email', parent2Email);
          updateFamily('selectedEmailIndex', parent2Index);
          updateFamily('primaryParentIndex', parent2Index);

          // Reset OTP state for Parent 2
          updateFamily('otpSent', false);
          updateFamily('emailOTP', '');

          // Go back to step 9 to verify Parent 2's email
          setStep(9);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setIsNavigating(false);
          return;
        } else {
          // Parent 2 doesn't have an email - show error
          setValidationErrors({ parent2Setup: 'Parent 2 email is missing. Please go back and add it.' });
          setIsNavigating(false);
          return;
        }
      } else if (parent2Setup === 'skip') {
        // User wants to skip Parent 2 setup - proceed to phone setup
        console.log('[OnboardingFlow] Skipping Parent 2 setup - proceeding to phone step');
      } else {
        // No choice made - require user to choose
        console.log('[OnboardingFlow] No parent2Setup choice made - showing error');
        setValidationErrors({ parent2Setup: 'Please choose whether to set up the other parent now or skip for later' });
        setIsNavigating(false);
        return;
      }
    }

      // Special logging for step 11 -> 12 transition
      if (step === 11) {
        console.log('[OnboardingFlow] IMPORTANT: Moving from phone step (11) to email selection step (12)');
        console.log('[OnboardingFlow] Email selection step should now be visible');
      }

      // Advance to next step
      setStep(step + 1);
      // Scroll to top when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset navigating state after a brief delay to ensure smooth transition
      setTimeout(() => setIsNavigating(false), 300);

    } catch (error) {
      console.error('[OnboardingFlow] Error during step transition:', error);
      setValidationErrors({
        general: 'An error occurred. Please try again or refresh the page.'
      });
      setIsNavigating(false);
    }
  };

  // Go back to previous step
  const prevStep = () => {
    setStep(step - 1);
    // Scroll to top when moving to previous step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Function to select a subscription plan
  const selectPlan = (plan) => {
    updateFamily('plan', plan);

    // **CRITICAL FIX**: Map top-level googleAuth to the correct parent object
    const preparedFamilyData = { ...familyData };
    if (preparedFamilyData.googleAuth && preparedFamilyData.googleAuth.authenticated) {
      // Find which parent used Google Auth (based on email match)
      const googleEmail = preparedFamilyData.googleAuth.email;
      const emailIndex = preparedFamilyData.selectedEmailIndex || preparedFamilyData.primaryParentIndex || 0;

      console.log(`[selectPlan] Mapping Google Auth to parent ${emailIndex} (${googleEmail})`);

      // Ensure parents array exists
      if (!preparedFamilyData.parents) {
        preparedFamilyData.parents = [];
      }

      // Update the correct parent with googleAuth data
      if (preparedFamilyData.parents[emailIndex]) {
        preparedFamilyData.parents[emailIndex].googleAuth = preparedFamilyData.googleAuth;
        console.log(`[selectPlan] ✅ Successfully mapped googleAuth to parent ${emailIndex}`);
      } else {
        console.error(`[selectPlan] ❌ Parent at index ${emailIndex} not found!`);
      }
    }

    // Store data and navigate to payment
    localStorage.setItem('pendingFamilyData', JSON.stringify(preparedFamilyData));

    // Don't clear onboarding progress - user might want to go back
    // localStorage.removeItem('onboardingProgress');

    navigate('/payment', {
      state: {
        fromOnboarding: true,
        familyData: preparedFamilyData
      }
    });
  };

  // Complete onboarding and continue
  const completeOnboarding = () => {
    // IMPORTANT: This data must be saved to the user profile after payment/signup:
    // - email: Primary account email for login
    // - fullPhoneNumber: Verified phone number for SMS features
    // - phoneVerified: Whether phone was verified
    // - familyEmail: Email address for forwarding (e.g., palsson@families.checkallie.com)
    // - familyEmailPrefix: Just the prefix part (e.g., "palsson")

    // **CRITICAL FIX**: Map top-level googleAuth to the correct parent object
    const preparedFamilyData = { ...familyData };
    if (preparedFamilyData.googleAuth && preparedFamilyData.googleAuth.authenticated) {
      // Find which parent used Google Auth (based on email match)
      const googleEmail = preparedFamilyData.googleAuth.email;
      const emailIndex = preparedFamilyData.selectedEmailIndex || preparedFamilyData.primaryParentIndex || 0;

      console.log(`[completeOnboarding] Mapping Google Auth to parent ${emailIndex} (${googleEmail})`);

      // Ensure parents array exists
      if (!preparedFamilyData.parents) {
        preparedFamilyData.parents = [];
      }

      // Update the correct parent with googleAuth data
      if (preparedFamilyData.parents[emailIndex]) {
        preparedFamilyData.parents[emailIndex].googleAuth = preparedFamilyData.googleAuth;
        console.log(`[completeOnboarding] ✅ Successfully mapped googleAuth to parent ${emailIndex}`);
      } else {
        console.error(`[completeOnboarding] ❌ Parent at index ${emailIndex} not found!`);
      }
    }

    // Store the final data
    localStorage.setItem('pendingFamilyData', JSON.stringify(preparedFamilyData));

    // Don't clear onboarding progress - user might want to go back
    // localStorage.removeItem('onboardingProgress');

    // Navigate to the payment page
    navigate('/payment', {
      state: {
        fromOnboarding: true,
        familyData: preparedFamilyData
      }
    });
  };

  // Clear all onboarding progress
  const clearOnboardingProgress = () => {
    if (window.confirm('Are you sure you want to clear all onboarding progress? This cannot be undone.')) {
      // Clear all localStorage keys related to onboarding
      localStorage.removeItem('onboardingProgress');
      localStorage.removeItem('onboarding_google_email');
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('onboarding_family_data');
      localStorage.removeItem('pendingFamilyData');

      // Reset state to initial values
      setStep(1);
      setAuthMethod(null);
      setGoogleAuthLoading(false);
      setPhoneVerificationLoading(false);
      setParent2Setup(null);
      setFamilyData({
        familyName: '',
        parents: [
          { name: '', role: 'One parent', calledBy: '', gender: '' },
          { name: '', role: 'The other parent', calledBy: '', gender: '' }
        ],
        email: '',
        password: '',
        passwordConfirm: '',
        googleAuth: null,
        phoneNumber: '',
        magicLinkSent: false,
        phoneVerified: false,
        phoneSmsCodeSent: false,
        verificationCode: '',
        skipPhone: false,
        children: [{ name: '', age: '' }],
        communication: {
          style: '',
          challengeAreas: []
        },
        preferences: {
          reminderFrequency: 'weekly',
          meetingDay: 'Sunday'
        },
        priorities: {
          highestPriority: '',
          secondaryPriority: '',
          tertiaryPriority: ''
        },
        aiPreferences: {
          style: '',
          length: '',
          topics: []
        },
        surveyResponses: {}
      });
      setValidationErrors({});
      setSuccessMessage('');
      setHeaderTitle("Let's get started with Allie");
      setShowChallengeDropdown(false);
      setShowPriorityDropdowns({
        highest: false,
        secondary: false,
        tertiary: false
      });
      setShowTopicsDropdown(false);
      setCountryCode('+1');
      setShowResumeForm(false);
      setResumeEmail('');
      setResumePhone('');
      setResumeMessage('');
      setResumeMessageType('');

      console.log('✅ Onboarding progress cleared');
    }
  };

  // Render step content
  const renderStep = () => {
    // Removed excessive logging that was causing console spam

    switch(step) {
      case 1: // Welcome
        return (
          <div className="text-center">
            <h2 className="text-3xl font-light mb-6 font-roboto">Welcome to Allie</h2>
            <p className="text-lg mb-8 font-roboto">We're excited to help your family find better balance.</p>
            <div className="w-64 h-64 mx-auto mb-8 rounded-full bg-gray-100 flex items-center justify-center">
              <img 
                src={familyPhoto} 
                alt="Family Balance" 
                className="w-48 h-48 object-cover rounded-full"
              />
            </div>
            <p className="text-gray-600 mb-4 font-roboto">
              In the next few minutes, we'll help you set up your family profile and get started on your balance journey.
            </p>
            
            {/* Resume Setup Button - inline with welcome message */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowResumeForm(true);
                  setResumeMessage('');
                  // Scroll to resume form after it renders
                  setTimeout(() => {
                    if (resumeFormRef.current) {
                      resumeFormRef.current.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                      });
                    }
                  }, 100);
                }}
                className="px-4 py-2 text-orange-600 border border-orange-300 rounded-md hover:bg-orange-50 font-roboto text-sm"
              >
                Resume Setup
              </button>
            </div>
          </div>
        );
        
      case 2: // Family Name
        return (
          <div>
            <h2 className="text-3xl font-light mb-6 font-roboto">What's your family name?</h2>
            <p className="text-gray-600 mb-6 font-roboto">
              This will help personalize your experience in the app.
            </p>
            <input
              type="text"
              className={`w-full px-0 py-2 bg-transparent border-0 border-b font-roboto text-gray-900 placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all mb-4 ${validationErrors.familyName ? 'border-b-red-500' : 'border-b-gray-200'}`}
              placeholder="e.g., Anderson"
              value={familyData.familyName}
              onChange={e => updateFamily('familyName', e.target.value)}
            />
            {validationErrors.familyName && (
              <p className="text-red-500 text-sm mb-4 font-roboto">{validationErrors.familyName}</p>
            )}
            <p className="text-sm text-gray-500 font-roboto">
              This will appear throughout the app and can be changed later.
            </p>
          </div>
        );
        
      case 3: // Parent Setup
        return (
          <div>
            <h2 className="text-3xl font-light mb-6 font-roboto">Tell us about the parents</h2>
            <p className="text-gray-600 mb-6 font-roboto">
              Let's get to know the overworked parents in your family.
            </p>
            <div className="space-y-4">
              {familyData.parents.map((parent, index) => (
                <div key={index} className="p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 font-roboto">{index === 0 ? 'One parent' : 'The other parent'}</h3>
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <User size={20} className="text-gray-600" />
                    </div>
                  </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">
                        What is their name?
                      </label>
                      <input
                        type="text"
                        className={`w-full px-0 py-2 bg-transparent border-0 border-b font-roboto text-gray-900 placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all ${
                          validationErrors[`parent_${index}_name`] ? 'border-b-red-500' : 'border-b-gray-200'
                        }`}
                        placeholder="First name"
                        value={parent.name || ''}
                        onChange={e => updateParent(index, 'name', e.target.value)}
                      />
                      {validationErrors[`parent_${index}_name`] && (
                        <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors[`parent_${index}_name`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">What do the kids call them?</label>
                      <input
                        type="text"
                        className={`w-full px-0 py-2 bg-transparent border-0 border-b font-roboto text-gray-900 placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all ${validationErrors[`parent_${index}_calledBy`] ? 'border-b-red-500' : 'border-b-gray-200'}`}
                        placeholder="e.g., Mama, Dad, Papa, Mom"
                        value={parent.calledBy || ''}
                        onChange={e => {
                          const newValue = e.target.value;
                          
                          // Auto-detect gender inline
                          const value = newValue.toLowerCase();
                          const femaleTerms = ['mama', 'mom', 'mommy', 'mother', 'ma', 'mum', 'mummy'];
                          const maleTerms = ['papa', 'dad', 'daddy', 'father', 'pa', 'pop', 'pops'];
                          
                          let detectedGender = 'non-binary';
                          if (femaleTerms.some(term => value.includes(term))) {
                            detectedGender = 'female';
                          } else if (maleTerms.some(term => value.includes(term))) {
                            detectedGender = 'male';
                          }
                          
                          // Update both fields at once
                          const updatedParents = [...familyData.parents];
                          updatedParents[index] = { 
                            ...updatedParents[index], 
                            calledBy: newValue,
                            gender: detectedGender
                          };
                          updateFamily('parents', updatedParents);
                        }}
                      />
                      {validationErrors[`parent_${index}_calledBy`] && (
                        <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors[`parent_${index}_calledBy`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 4: // Children Setup
        return (
          <div>
            <h2 className="text-3xl font-light mb-6 font-roboto">Your Children</h2>
            <p className="text-gray-600 mb-6 font-roboto">
              Tell us about your children so we can include their perspectives in your family balance journey.
            </p>
            
            <div className="space-y-4">
              {familyData.children.map((child, index) => (
                <div key={index} className="p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900 font-roboto">
                      {index === 0 ? 'First Child' : 
                       index === 1 ? 'Next Baby' : 
                       index === 2 ? 'Three Kids?!' : 
                       index === 3 ? 'You are amazing' : 
                       index === 4 ? 'You get Allie for Free!' :
                       `Child ${index + 1}`}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Baby size={20} className="text-blue-600" />
                      </div>
                      {familyData.children.length > 1 && (
                        <button 
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          onClick={() => removeChild(index)}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">Name</label>
                      <input
                        type="text"
                        className={`w-full px-0 py-2 bg-transparent border-0 border-b font-roboto text-gray-900 placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all ${validationErrors[`child_${index}_name`] ? 'border-b-red-500' : 'border-b-gray-200'}`}
                        placeholder="Enter name"
                        value={child.name}
                        onChange={e => updateChild(index, 'name', e.target.value)}
                      />
                      {validationErrors[`child_${index}_name`] && (
                        <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors[`child_${index}_name`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">Age</label>
                      <input
                        type="number"
                        min="1"
                        max="18"
                        className="w-full px-0 py-2 bg-transparent border-0 border-b border-b-gray-200 font-roboto text-gray-900 placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all"
                        placeholder="Enter age"
                        value={child.age}
                        onChange={e => updateChild(index, 'age', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addChild}
                className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-gray-400 hover:text-gray-700 transition-all font-roboto flex items-center justify-center group"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200 transition-colors">
                  <PlusCircle size={18} className="text-gray-500" />
                </div>
                Add Another Child
              </button>
            </div>
          </div>
        );
        
      case 5: // Communication & AI Preferences (COMBINED)
        return (
          <div>
            <h2 className="text-3xl font-light mb-6 font-roboto">Communication & AI Preferences</h2>
            <p className="text-gray-600 mb-6 font-roboto">
              Help us understand how your family communicates and how you'd like Allie to interact with you.
            </p>

            <div className="space-y-8">
              {/* Section 1: Family Communication Style */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 font-roboto">Family Communication Style</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">
                    How would you describe your family's communication style?
                  </label>
                  <div className="relative">
                    {familyData.communication.style ? (
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-roboto">
                          <span>
                            {familyData.communication.style === 'open' && 'Very open - we talk about everything'}
                            {familyData.communication.style === 'selective' && 'Selective - we discuss some topics easily'}
                            {familyData.communication.style === 'reserved' && 'Reserved - we tend to keep things to ourselves'}
                            {familyData.communication.style === 'avoidant' && 'Avoidant - we rarely discuss sensitive topics'}
                          </span>
                          <button
                            onClick={() => updateCommunication('style', '')}
                            className="ml-2 hover:bg-gray-200 rounded p-0.5 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <select
                        className={`w-full px-0 py-2 bg-transparent border-0 border-b font-roboto text-gray-900 appearance-none cursor-pointer focus:outline-none focus:border-b-2 focus:border-black transition-all ${validationErrors.communication_style ? 'border-b-red-500' : 'border-b-gray-200'}`}
                        value={familyData.communication.style}
                        onChange={e => updateCommunication('style', e.target.value)}
                      >
                        <option value="">Select an option</option>
                        <option value="open">Very open - we talk about everything</option>
                        <option value="selective">Selective - we discuss some topics easily</option>
                        <option value="reserved">Reserved - we tend to keep things to ourselves</option>
                        <option value="avoidant">Avoidant - we rarely discuss sensitive topics</option>
                      </select>
                    )}
                    {!familyData.communication.style && (
                      <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    )}
                  </div>
                  {validationErrors.communication_style && (
                    <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.communication_style}</p>
                  )}
                </div>
              </div>

              {/* Section 2: AI Assistant Preferences */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 font-roboto">Customize Your AI Assistant</h3>
                <p className="text-sm text-gray-600 font-roboto">
                  Tell us how you'd like Allie to communicate with you.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">Preferred communication style:</label>
                  <select
                    className={`w-full px-0 py-2 bg-transparent border-0 border-b font-roboto text-gray-900 appearance-none cursor-pointer focus:outline-none focus:border-b-2 focus:border-black transition-all ${validationErrors.aiPreferences_style ? 'border-b-red-500' : 'border-b-gray-200'}`}
                    value={familyData.aiPreferences?.style || ''}
                    onChange={(e) => updateAIPreference('style', e.target.value)}
                  >
                    <option value="">Select a style</option>
                    <option value="friendly">Friendly and Conversational</option>
                    <option value="direct">Direct and To-the-Point</option>
                    <option value="supportive">Supportive and Encouraging</option>
                    <option value="analytical">Analytical and Detailed</option>
                  </select>
                  {validationErrors.aiPreferences_style && (
                    <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.aiPreferences_style}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">Response length preference:</label>
                  <select
                    className={`w-full px-0 py-2 bg-transparent border-0 border-b font-roboto text-gray-900 appearance-none cursor-pointer focus:outline-none focus:border-b-2 focus:border-black transition-all ${validationErrors.aiPreferences_length ? 'border-b-red-500' : 'border-b-gray-200'}`}
                    value={familyData.aiPreferences?.length || ''}
                    onChange={(e) => updateAIPreference('length', e.target.value)}
                  >
                    <option value="">Select a length</option>
                    <option value="concise">Concise - Just the essentials</option>
                    <option value="balanced">Balanced - Some explanation</option>
                    <option value="detailed">Detailed - Full explanations</option>
                  </select>
                  {validationErrors.aiPreferences_length && (
                    <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.aiPreferences_length}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 font-roboto">Topics of particular interest:</label>

                  {/* Selected tags display */}
                  {familyData.aiPreferences?.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {familyData.aiPreferences.topics.map(topic => (
                        <div key={topic} className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-roboto">
                          <span>{topic}</span>
                          <button
                            onClick={() => toggleAITopic(topic)}
                            className="ml-2 hover:bg-gray-200 rounded p-0.5 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dropdown for adding more */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTopicsDropdown(!showTopicsDropdown)}
                      className="w-full px-0 py-2 bg-transparent border-0 border-b border-b-gray-200 text-left font-roboto text-gray-900 focus:outline-none focus:border-b-2 focus:border-black transition-all flex justify-between items-center"
                    >
                      <span className={familyData.aiPreferences?.topics?.length ? 'text-gray-900' : 'text-gray-400'}>
                        {familyData.aiPreferences?.topics?.length
                          ? `${familyData.aiPreferences.topics.length} selected`
                          : 'Select topics of interest'
                        }
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>

                    {showTopicsDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {['Balance insights', 'Parenting tips', 'Relationship advice', 'Time management', 'Self-care reminders'].map(topic => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => {
                              toggleAITopic(topic);
                              setShowTopicsDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 font-roboto text-sm flex items-center justify-between ${
                              familyData.aiPreferences?.topics?.includes(topic) ? 'bg-gray-50' : ''
                            }`}
                          >
                            <span className="text-gray-700">{topic}</span>
                            {familyData.aiPreferences?.topics?.includes(topic) && (
                              <Check size={16} className="text-gray-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start">
                  <Brain size={20} className="text-purple-600 mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-purple-800 font-roboto">How Allie Uses This Information</h4>
                    <p className="text-sm text-purple-700 mt-1 font-roboto">
                      Allie personalizes recommendations based on your communication style and preferences. This helps create meaningful conversations and guidance that work for your specific family dynamic.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6: // Task Categories (was 7)
        return (
          <div>
            <h2 className="text-3xl font-light mb-6 font-roboto">The Four Categories of Family Tasks</h2>
            <p className="text-gray-600 mb-6 font-roboto">
              Allie divides family responsibilities into four categories to help identify imbalances.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <h3 className="font-medium text-blue-800 mb-1 font-roboto">Visible Household Tasks</h3>
                <p className="text-sm text-blue-700 font-roboto">
                  Physical tasks you can see: cooking, cleaning, laundry, yard work, home repairs
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-purple-50">
                <h3 className="font-medium text-purple-800 mb-1 font-roboto">Invisible Household Tasks</h3>
                <p className="text-sm text-purple-700 font-roboto">
                  Mental work of running a home: planning meals, managing schedules, remembering events, coordinating appointments
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="font-medium text-green-800 mb-1 font-roboto">Visible Parenting Tasks</h3>
                <p className="text-sm text-green-700 font-roboto">
                  Physical childcare: driving kids, helping with homework, bedtime routines, attending events
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-amber-50">
                <h3 className="font-medium text-amber-800 mb-1 font-roboto">Invisible Parenting Tasks</h3>
                <p className="text-sm text-amber-700 font-roboto">
                  Emotional labor: providing emotional support, anticipating needs, coordinating with schools, monitoring development
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded border">
              <p className="text-sm text-gray-600 font-roboto">
                Research shows that "invisible" work is often under-recognized, creating stress and imbalance. 
                Allie helps identify and redistribute all types of work for better family harmony.
              </p>
            </div>
          </div>
        );
        
      case 7: // Family Priorities (was 8)
        return (
          <div>
            <h2 className="text-3xl font-light mb-6 font-roboto">Your Family's Priorities</h2>
            <p className="text-gray-600 mb-6 font-roboto">
              To personalize your experience, tell us which areas are most important for your family to balance.
            </p>
                
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">Highest priority concern:</label>
                {familyData.priorities?.highestPriority ? (
                  <div className="mb-2">
                    <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-roboto">
                      <span>{familyData.priorities.highestPriority}</span>
                      <button
                        onClick={() => {
                          const updatedPriorities = { ...familyData.priorities, highestPriority: '' };
                          updateFamily('priorities', updatedPriorities);
                        }}
                        className="ml-2 hover:bg-gray-200 rounded p-0.5 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPriorityDropdowns({ ...showPriorityDropdowns, highest: !showPriorityDropdowns.highest })}
                      className={`w-full px-0 py-2 bg-transparent border-0 border-b text-left font-roboto text-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all flex justify-between items-center ${
                        validationErrors.priorities_highest ? 'border-b-red-500' : 'border-b-gray-200'
                      }`}
                    >
                      <span>Select a category</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {showPriorityDropdowns.highest && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {['Visible Household Tasks', 'Invisible Household Tasks', 'Visible Parental Tasks', 'Invisible Parental Tasks'].map(priority => (
                          <button
                            key={priority}
                            type="button"
                            onClick={() => {
                              const updatedPriorities = { ...familyData.priorities, highestPriority: priority };
                              updateFamily('priorities', updatedPriorities);
                              setShowPriorityDropdowns({ ...showPriorityDropdowns, highest: false });
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 font-roboto text-sm"
                          >
                            <span className="text-gray-700">{priority}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {validationErrors.priorities_highest && (
                  <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.priorities_highest}</p>
                )}
              </div>
                  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">Secondary priority concern:</label>
                {familyData.priorities?.secondaryPriority ? (
                  <div className="mb-2">
                    <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-roboto">
                      <span>{familyData.priorities.secondaryPriority}</span>
                      <button
                        onClick={() => {
                          const updatedPriorities = { ...familyData.priorities, secondaryPriority: '' };
                          updateFamily('priorities', updatedPriorities);
                        }}
                        className="ml-2 hover:bg-gray-200 rounded p-0.5 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPriorityDropdowns({ ...showPriorityDropdowns, secondary: !showPriorityDropdowns.secondary })}
                      className={`w-full px-0 py-2 bg-transparent border-0 border-b text-left font-roboto text-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all flex justify-between items-center ${
                        validationErrors.priorities_duplicate ? 'border-b-red-500' : 'border-b-gray-200'
                      }`}
                    >
                      <span>Select a category</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {showPriorityDropdowns.secondary && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {['Visible Household Tasks', 'Invisible Household Tasks', 'Visible Parental Tasks', 'Invisible Parental Tasks'].map(priority => {
                          const isDisabled = priority === familyData.priorities?.highestPriority;
                          return (
                            <button
                              key={priority}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                if (!isDisabled) {
                                  const updatedPriorities = { ...familyData.priorities, secondaryPriority: priority };
                                  updateFamily('priorities', updatedPriorities);
                                  setShowPriorityDropdowns({ ...showPriorityDropdowns, secondary: false });
                                }
                              }}
                              className={`w-full px-4 py-3 text-left font-roboto text-sm ${
                                isDisabled 
                                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span>{priority}</span>
                              {isDisabled && <span className="text-xs ml-2">(Already selected)</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {validationErrors.priorities_duplicate && (
                  <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.priorities_duplicate}</p>
                )}
              </div>
                  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">Tertiary priority concern:</label>
                {familyData.priorities?.tertiaryPriority ? (
                  <div className="mb-2">
                    <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-roboto">
                      <span>{familyData.priorities.tertiaryPriority}</span>
                      <button
                        onClick={() => {
                          const updatedPriorities = { ...familyData.priorities, tertiaryPriority: '' };
                          updateFamily('priorities', updatedPriorities);
                        }}
                        className="ml-2 hover:bg-gray-200 rounded p-0.5 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPriorityDropdowns({ ...showPriorityDropdowns, tertiary: !showPriorityDropdowns.tertiary })}
                      className={`w-full px-0 py-2 bg-transparent border-0 border-b text-left font-roboto text-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all flex justify-between items-center ${
                        validationErrors.priorities_duplicate ? 'border-b-red-500' : 'border-b-gray-200'
                      }`}
                    >
                      <span>Select a category</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {showPriorityDropdowns.tertiary && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {['Visible Household Tasks', 'Invisible Household Tasks', 'Visible Parental Tasks', 'Invisible Parental Tasks'].map(priority => {
                          const isDisabled = priority === familyData.priorities?.highestPriority || 
                                           priority === familyData.priorities?.secondaryPriority;
                          return (
                            <button
                              key={priority}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                if (!isDisabled) {
                                  const updatedPriorities = { ...familyData.priorities, tertiaryPriority: priority };
                                  updateFamily('priorities', updatedPriorities);
                                  setShowPriorityDropdowns({ ...showPriorityDropdowns, tertiary: false });
                                }
                              }}
                              className={`w-full px-4 py-3 text-left font-roboto text-sm ${
                                isDisabled 
                                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span>{priority}</span>
                              {isDisabled && <span className="text-xs ml-2">(Already selected)</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {validationErrors.priorities_duplicate && (
                  <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.priorities_duplicate}</p>
                )}
              </div>
                  
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start">
                  <Sliders size={20} className="text-purple-600 mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-purple-800 font-roboto">How Allie Uses This Information</h4>
                    <p className="text-sm text-purple-700 mt-1 font-roboto">
                      Your priorities directly influence our AI weighting system. High-priority tasks receive a multiplier of 1.5x in our calculations, secondary priorities get a 1.3x multiplier, and tertiary priorities get a 1.1x multiplier. This ensures our recommendations focus on the areas that matter most to your family.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 8: // Auth Method Selection (was 9)
        return (
          <div>
            <h2 className="text-3xl font-light mb-6 font-roboto">Choose Your Sign-In Method</h2>
            <p className="text-gray-600 mb-6 font-roboto">
              How would you like to sign in to Allie?
            </p>

            <div className="space-y-4">
              {/* Google Sign-In Option - RECOMMENDED */}
              <button
                onClick={() => {
                  setAuthMethod('google');
                  setValidationErrors({});
                }}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                  authMethod === 'google'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 font-roboto">Sign in with Google</h3>
                      <p className="text-sm text-gray-600 font-roboto">One-click setup</p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded font-roboto">
                    RECOMMENDED
                  </span>
                </div>
                <ul className="space-y-1.5 text-sm text-gray-600 font-roboto ml-15">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                    <span>Instant calendar integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                    <span>No password to remember</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                    <span>Secure OAuth 2.0 authentication</span>
                  </li>
                </ul>
              </button>

              {/* Email/Password Option */}
              <button
                onClick={() => {
                  setAuthMethod('password');
                  setValidationErrors({});
                }}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                  authMethod === 'password'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Mail size={24} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 font-roboto">Sign in with Email & Password</h3>
                    <p className="text-sm text-gray-600 font-roboto">Traditional authentication</p>
                  </div>
                </div>
                <ul className="space-y-1.5 text-sm text-gray-600 font-roboto ml-15">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-gray-400 flex-shrink-0" />
                    <span>Works without Google account</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-gray-400 flex-shrink-0" />
                    <span>You create and manage your password</span>
                  </li>
                </ul>
              </button>

              {validationErrors.authMethod && (
                <p className="text-red-500 text-sm font-roboto">{validationErrors.authMethod}</p>
              )}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-roboto">
                💡 <strong>Tip:</strong> Google Sign-In is recommended for the best experience. You'll get automatic calendar sync and won't need to remember another password.
              </p>
            </div>
          </div>
        );

      case 9: // Conditional Auth (Email/Password OR Google) - was 10
        return (
          <div>
            <h2 className="text-3xl font-light mb-6 font-roboto">Connect your family</h2>
            <p className="text-gray-600 mb-6 font-roboto">
              Let's set up email addresses for both parents. We'll verify one to get started.
            </p>
            
            <div className="space-y-6">
              {/* Show both parents with email fields */}
              {familyData.parents.map((parent, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">{parent.name || (index === 0 ? 'One parent' : 'The other parent')}</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">Email Address</label>
                    <input
                      type="email"
                      className={`w-full px-0 py-2 bg-transparent border-0 border-b font-roboto text-gray-900 placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all ${
                        validationErrors[`parent_${index}_email`] ? 'border-b-red-500' : 'border-b-gray-200'
                      }`}
                      placeholder="their@email.com"
                      value={parent.email || ''}
                      onChange={e => {
                        const newEmail = e.target.value;
                        updateParent(index, 'email', newEmail);

                        // Real-time duplicate email validation
                        if (newEmail) {
                          const otherParentIndex = index === 0 ? 1 : 0;
                          const otherParentEmail = familyData.parents[otherParentIndex]?.email?.trim().toLowerCase();

                          if (otherParentEmail && newEmail.trim().toLowerCase() === otherParentEmail) {
                            setValidationErrors({
                              ...validationErrors,
                              [`parent_${index}_email`]: 'Email already used for other parent'
                            });
                          } else {
                            // Clear error if emails no longer match
                            const newErrors = {...validationErrors};
                            delete newErrors[`parent_${index}_email`];
                            delete newErrors[`parent_${otherParentIndex}_email`];
                            setValidationErrors(newErrors);
                          }
                        }
                      }}
                    />
                    {validationErrors[`parent_${index}_email`] && (
                      <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors[`parent_${index}_email`]}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Select which email to verify */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">
                  Which email should we verify now?
                </label>
                <div className="space-y-2">
                  {familyData.parents.map((parent, index) => {
                    if (!parent.email) return null;
                    return (
                      <label key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="primaryEmail"
                          value={parent.email}
                          checked={familyData.email === parent.email}
                          onChange={e => {
                            updateFamily('email', e.target.value);
                            updateFamily('primaryParentIndex', index);
                            updateFamily('selectedEmailIndex', index);
                            // Reset OTP sent flag and clear the code when changing email selection
                            updateFamily('otpSent', false);
                            updateFamily('emailOTP', '');
                          }}
                          className="text-blue-600"
                        />
                        <span className="flex-1">
                          <span className="font-medium">{parent.name}</span>
                          <span className="text-gray-600 ml-2">({parent.email})</span>
                          {familyData[`email_${index}_verified`] && (
                            <span className="text-xs text-green-600 ml-2">✓ Verified</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {validationErrors.email && (
                  <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.email}</p>
                )}
              </div>

              {/* ========== GOOGLE AUTH PATH ========== */}
              {authMethod === 'google' && (
                <div className="space-y-4 mt-6">
                  {/* If Google auth not completed yet */}
                  {!familyData.googleAuth?.authenticated ? (
                    <>
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Connect with Google</h4>
                          <p className="text-sm text-gray-600">
                            Sign in with Google to enable instant calendar integration
                          </p>
                        </div>

                        <button
                          onClick={handleGoogleSignIn}
                          disabled={googleAuthLoading}
                          className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-3 shadow-sm"
                        >
                          {googleAuthLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              <span>Connecting to Google...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                              <span>Sign in with Google</span>
                            </>
                          )}
                        </button>

                        {validationErrors.googleAuth && (
                          <p className="text-red-500 text-sm mt-2 font-roboto">{validationErrors.googleAuth}</p>
                        )}

                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          <p className="font-medium text-blue-900 mb-2">✨ Benefits:</p>
                          <ul className="space-y-1 text-xs">
                            <li className="flex items-start gap-2">
                              <span className="text-green-500">✓</span>
                              <span>Instant calendar integration</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-500">✓</span>
                              <span>No password to remember</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-500">✓</span>
                              <span>Automatic event sync</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Google auth completed - PROMINENT SUCCESS MESSAGE */
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 p-6 rounded-xl space-y-4 shadow-lg">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-green-900 mb-2">
                            🎉 Successfully Connected with Google!
                          </h4>
                          <p className="text-base text-green-800 font-medium mb-1">
                            {familyData.googleAuth.email || familyData.googleAuth.displayName || 'Your Google account is connected'}
                          </p>
                          <p className="text-sm text-green-700">
                            You can now sign in instantly without passwords
                          </p>
                        </div>
                      </div>

                      {/* Calendar Integration Status */}
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="font-semibold text-green-900">Calendar Integration Active</p>
                        </div>
                        <p className="text-sm text-gray-700">
                          Your Google Calendar will automatically sync with Allie. Events, reminders, and schedules will be integrated seamlessly.
                        </p>
                      </div>

                      {/* Benefits Summary */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">No password needed</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">Instant calendar sync</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">Auto event updates</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">Secure authentication</span>
                        </div>
                      </div>

                      {/* Ready to Continue */}
                      <div className="pt-2 border-t border-green-200">
                        <p className="text-sm text-center text-green-800 font-medium">
                          ✨ You're all set! Click "Continue" to proceed with setup.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========== PASSWORD AUTH PATH ========== */}
              {authMethod === 'password' && (
                <>
                  {!familyData.otpSent ? (
                    <div className="bg-blue-50 p-4 rounded-lg mt-6">
                      <h4 className="font-medium text-blue-900 mb-2">Email verification required:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• We'll email you a 6-digit code</li>
                        <li>• Enter the code to verify your email</li>
                        <li>• Set up a secure password after verification</li>
                        <li>• Code expires in 5 minutes</li>
                      </ul>
                    </div>
                  ) : !familyData[`email_${familyData.selectedEmailIndex || familyData.primaryParentIndex || 0}_verified`] ? (
                <div className="space-y-4">
                  {successMessage && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-blue-800 font-medium">{successMessage}</p>
                    </div>
                  )}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Check your email!</h4>
                    <p className="text-sm text-green-800">
                      We sent a verification code to {familyData.email || familyData.parents[familyData.selectedEmailIndex || familyData.primaryParentIndex || 0]?.email}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1 font-roboto">Enter verification code</label>
                    <input
                      type="text"
                      className={`w-full px-0 py-2 bg-transparent border-0 border-b font-roboto text-center text-2xl tracking-widest ${validationErrors.emailOTP ? 'border-b-red-500' : 'border-b-gray-200'} focus:outline-none focus:border-b-2 focus:border-black transition-all`}
                      placeholder="000000"
                      maxLength="6"
                      value={familyData.emailOTP || ''}
                      onChange={e => updateFamily('emailOTP', e.target.value.replace(/\D/g, ''))}
                    />
                    {validationErrors.emailOTP && (
                      <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.emailOTP}</p>
                    )}
                  </div>
                  
                  <button
                    onClick={async () => {
                      if (familyData.emailOTP && familyData.emailOTP.length === 6) {
                        try {
                          // Get the correct email to verify
                          const emailIndex = familyData.selectedEmailIndex || familyData.primaryParentIndex || 0;
                          const emailToVerify = familyData.email || familyData.parents[emailIndex]?.email;

                          console.log(`Verifying OTP for: ${emailToVerify} (index: ${emailIndex})`);

                          // Use Firebase Functions URL for OTP verification
                          const functionsUrl = process.env.NODE_ENV === 'production'
                            ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/auth/verify-otp'
                            : 'http://localhost:5001/parentload-ba995/europe-west1/auth/verify-otp';

                          const response = await fetch(functionsUrl, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              email: emailToVerify,  // Use the correct email
                              otp: familyData.emailOTP
                            })
                          });
                          
                          const data = await response.json();
                          
                          if (response.ok && data.success) {
                            // Mark the specific email as verified
                            const emailIndex = familyData.selectedEmailIndex || familyData.primaryParentIndex || 0;
                            updateFamily(`email_${emailIndex}_verified`, true);
                            // Also set general emailVerified for backward compatibility
                            updateFamily('emailVerified', true);
                            setValidationErrors({});
                          } else {
                            setValidationErrors({ emailOTP: data.error || 'Invalid verification code' });
                          }
                        } catch (error) {
                          console.error('Verification error:', error);
                          setValidationErrors({ emailOTP: 'Verification failed. Please try again.' });
                        }
                      } else {
                        setValidationErrors({ emailOTP: 'Please enter a valid 6-digit code' });
                      }
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    disabled={!familyData.emailOTP || familyData.emailOTP.length !== 6}
                  >
                    Verify Code
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        // Get the correct email to send to
                        const emailIndex = familyData.selectedEmailIndex || familyData.primaryParentIndex || 0;
                        const emailToVerify = familyData.email || familyData.parents[emailIndex]?.email;

                        console.log(`Resending OTP to: ${emailToVerify} (index: ${emailIndex})`);

                        // Use Firebase Functions URL for OTP
                        const functionsUrl = process.env.NODE_ENV === 'production'
                          ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/auth/send-otp'
                          : 'http://localhost:5001/parentload-ba995/europe-west1/auth/send-otp';

                        const response = await fetch(functionsUrl, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            email: emailToVerify,  // Use the correct email
                            userName: familyData.familyName
                          })
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok && data.success) {
                          updateFamily('emailOTP', '');
                          // Show success message in-app instead of alert
                          setSuccessMessage('New verification code sent! Check your email.');
                          setTimeout(() => setSuccessMessage(''), 5000); // Clear after 5 seconds
                        } else {
                          setValidationErrors({ emailOTP: data.error || 'Failed to resend code' });
                        }
                      } catch (error) {
                        console.error('Resend error:', error);
                        setValidationErrors({ emailOTP: 'Failed to resend code. Please try again.' });
                      }
                    }}
                    className="text-sm text-blue-600 underline"
                  >
                    Didn't receive it? Send again
                  </button>
                </div>
              ) : (
                /* Email verified - show password creation */
                <div className="space-y-4 mt-6">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">✓ Email verified!</h4>
                    <p className="text-sm text-green-700">
                      Your email {familyData.email} has been successfully verified.
                    </p>
                  </div>

                  {/* Password Creation Form */}
                  <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Create your password</h4>
                      <p className="text-sm text-blue-700 mb-4">
                        Set up a secure password for easy login next time.
                      </p>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        className={`w-full px-4 py-2 border rounded-lg font-roboto ${
                          validationErrors.password ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Enter a strong password"
                        value={familyData.password || ''}
                        onChange={e => updateFamily('password', e.target.value)}
                      />
                      {validationErrors.password && (
                        <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.password}</p>
                      )}

                      {/* Password Strength Indicator */}
                      {familyData.password && familyData.password.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  familyData.password.length < 8
                                    ? 'bg-red-500 w-1/3'
                                    : familyData.password.length < 12
                                    ? 'bg-yellow-500 w-2/3'
                                    : 'bg-green-500 w-full'
                                }`}
                              ></div>
                            </div>
                            <span
                              className={`font-medium ${
                                familyData.password.length < 8
                                  ? 'text-red-600'
                                  : familyData.password.length < 12
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {familyData.password.length < 8
                                ? 'Weak'
                                : familyData.password.length < 12
                                ? 'Good'
                                : 'Strong'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {familyData.password.length < 8 && 'Use at least 8 characters'}
                            {familyData.password.length >= 8 && familyData.password.length < 12 && 'Good! For extra security, add more characters'}
                            {familyData.password.length >= 12 && 'Excellent password strength!'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Password Confirmation Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        className={`w-full px-4 py-2 border rounded-lg font-roboto ${
                          validationErrors.passwordConfirm ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Re-enter your password"
                        value={familyData.passwordConfirm || ''}
                        onChange={e => updateFamily('passwordConfirm', e.target.value)}
                      />
                      {validationErrors.passwordConfirm && (
                        <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.passwordConfirm}</p>
                      )}
                      {!validationErrors.passwordConfirm && familyData.password && familyData.passwordConfirm && familyData.password === familyData.passwordConfirm && (
                        <p className="text-green-600 text-xs mt-1 font-roboto">✓ Passwords match</p>
                      )}
                    </div>

                    {/* Password Requirements */}
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-medium">Password requirements:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li className={familyData.password && familyData.password.length >= 8 ? 'text-green-600' : ''}>
                          At least 8 characters
                        </li>
                        <li className={familyData.password && /[A-Z]/.test(familyData.password) ? 'text-green-600' : ''}>
                          One uppercase letter (recommended)
                        </li>
                        <li className={familyData.password && /[0-9]/.test(familyData.password) ? 'text-green-600' : ''}>
                          One number (recommended)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              </>
              )}
              
              <div className="pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Your family will also get:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>A dedicated family email address to forward schedules and documents</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Allie will automatically parse and add events from forwarded emails</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 10: // Optional Parent 2 Setup (NEW) - was 11
        return (
          <div>
            <h2 className="text-3xl font-light mb-6 font-roboto">Set up {familyData.parents[1]?.name || 'the other parent'}?</h2>
            <p className="text-gray-600 mb-6 font-roboto">
              Would you like to set up {familyData.parents[1]?.name || 'the other parent'}'s account now, or do this later?
            </p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setParent2Setup('yes');
                  setValidationErrors({});
                }}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                  parent2Setup === 'yes'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 font-roboto mb-1">Yes, set up now</h3>
                    <p className="text-sm text-gray-600 font-roboto">We'll collect their email and complete setup together</p>
                  </div>
                  {parent2Setup === 'yes' && (
                    <CheckCircle className="text-blue-600 flex-shrink-0" size={24} />
                  )}
                </div>
              </button>

              <button
                onClick={() => {
                  setParent2Setup('skip');
                  setValidationErrors({});
                }}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                  parent2Setup === 'skip'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 font-roboto mb-1">Skip for now</h3>
                    <p className="text-sm text-gray-600 font-roboto">You can invite them later from settings</p>
                  </div>
                  {parent2Setup === 'skip' && (
                    <CheckCircle className="text-blue-600 flex-shrink-0" size={24} />
                  )}
                </div>
              </button>
            </div>
          </div>
        );

      case 11: // Phone Setup (was 12)
        return (
          <div>
            <h2 className="text-3xl font-light mb-6 font-roboto">Enable SMS features</h2>
            <p className="text-gray-600 mb-6 font-roboto">
              Add a phone number to unlock powerful SMS features.
            </p>
            
            <div className="space-y-6">
              {/* Select which parent this phone belongs to */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">
                  {familyData.phoneVerified ? 'Add another phone number for:' : 'Whose phone number is this?'}
                </label>
                <div className="space-y-2">
                  {familyData.parents.map((parent, index) => (
                    <label key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="phoneOwner"
                        value={index}
                        checked={familyData.phoneOwnerIndex === index}
                        onChange={e => updateFamily('phoneOwnerIndex', parseInt(e.target.value))}
                        className="text-blue-600"
                      />
                      <span className="font-medium">{parent.name || (index === 0 ? 'One parent' : 'The other parent')}</span>
                      {familyData.phoneVerified && familyData.phoneVerifiedFor === parent.name && (
                        <span className="text-xs text-green-600 ml-2">(already verified)</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Only show phone input if we're adding a new phone */}
              {(!familyData.phoneVerified || familyData.phoneOwnerIndex !== familyData.phoneVerifiedIndex) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">Phone Number</label>
                  <div className="flex gap-3">
                    <CountryCodePicker 
                      value={countryCode}
                      onChange={setCountryCode}
                    />
                    <input
                      type="tel"
                      className={`flex-1 px-0 py-2 bg-transparent border-0 border-b font-roboto text-gray-900 placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all ${validationErrors.phoneNumber ? 'border-b-red-500' : 'border-b-gray-200'}`}
                      placeholder={getPhonePlaceholder(countryCode)}
                      value={familyData.phoneNumber}
                      onChange={e => updateFamily('phoneNumber', e.target.value)}
                    />
                  </div>
                  {validationErrors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.phoneNumber}</p>
                  )}
                </div>
              )}
              
              {!familyData.phoneVerified ? (
                <>
                  {/* Show verification code input if SMS was sent */}
                  {familyData.phoneSmsCodeSent ? (
                    <div className="space-y-4">
                      {successMessage && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-green-800 font-medium">{successMessage}</p>
                        </div>
                      )}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          We've sent a verification code to {formatPhoneForDisplay(familyData.fullPhoneNumber)}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-roboto">Verification Code</label>
                        <input
                          type="text"
                          className={`w-full px-0 py-2 bg-transparent border-0 border-b font-roboto text-gray-900 placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all ${validationErrors.phoneOTP ? 'border-b-red-500' : 'border-b-gray-200'}`}
                          placeholder="Enter 6-digit code"
                          value={familyData.phoneVerificationCode || ''}
                          onChange={e => updateFamily('phoneVerificationCode', e.target.value)}
                          maxLength="6"
                        />
                        {validationErrors.phoneOTP && (
                          <p className="text-red-500 text-xs mt-1 font-roboto">{validationErrors.phoneOTP}</p>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={async () => {
                          setPhoneVerificationLoading(true);
                          try {
                            const verifyEndpoint = process.env.NODE_ENV === 'production'
                              ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/twilioVerifyCode'
                              : '/api/twilio/verify-code';

                            const response = await fetch(verifyEndpoint, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                phoneNumber: familyData.fullPhoneNumber,
                                userId: familyData.email || 'temp-user',
                                code: familyData.phoneVerificationCode
                              })
                            });
                            const data = await response.json();
                            if (data.success) {
                              updateFamily('phoneVerified', true);
                              // Store which parent this phone belongs to
                              const parentName = familyData.parents[familyData.phoneOwnerIndex]?.name ||
                                (familyData.phoneOwnerIndex === 0 ? 'One parent' : 'The other parent');
                              updateFamily('phoneVerifiedFor', parentName);
                              // Show success message in UI instead of alert
                            } else {
                              setValidationErrors({ phoneOTP: data.error || 'Invalid verification code' });
                            }
                          } catch (error) {
                            setValidationErrors({ phoneOTP: 'Failed to verify code' });
                          } finally {
                            setPhoneVerificationLoading(false);
                          }
                        }}
                        disabled={phoneVerificationLoading}
                        className={`w-full py-2 ${phoneVerificationLoading ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md font-roboto flex items-center justify-center gap-2`}
                      >
                        {phoneVerificationLoading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {phoneVerificationLoading ? 'Verifying...' : 'Verify Code'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            // Clear the old code
                            updateFamily('phoneVerificationCode', '');

                            const sendEndpoint = process.env.NODE_ENV === 'production'
                              ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/twilioSendVerification'
                              : '/api/twilio/send-verification';

                            const response = await fetch(sendEndpoint, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                phoneNumber: familyData.fullPhoneNumber,
                                userId: familyData.email || 'temp-user'
                              })
                            });

                            const data = await response.json();
                            if (data.success) {
                              setSuccessMessage('New verification code sent! Check your phone.');
                              setTimeout(() => setSuccessMessage(''), 5000);
                              setValidationErrors({});
                            } else {
                              setValidationErrors({ phoneOTP: data.error || 'Failed to send new code' });
                            }
                          } catch (error) {
                            setValidationErrors({ phoneOTP: 'Failed to send new code' });
                          }
                        }}
                        className="w-full py-2 mt-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-roboto text-sm"
                      >
                        Didn't receive it? Send again
                      </button>
                    </div>
                  ) : (
                    /* Show SMS features info if code not sent yet */
                    <>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2">What you can do with SMS:</h4>
                        <ul className="text-sm text-purple-800 space-y-1">
                          <li>• Text photos of school schedules to your Allie number</li>
                          <li>• Forward event details via SMS</li>
                          <li>• Ask Allie questions by text</li>
                          <li>• Get reminders and updates via SMS</li>
                        </ul>
                      </div>
                      
                      <div className="text-center text-sm text-gray-600">
                        <p>We'll send you a 6-digit verification code to confirm your number.</p>
                      </div>
                      
                      {/* Show send verification button if phone number is entered */}
                      {familyData.phoneNumber && !familyData.skipPhone && (
                        <button
                          type="button"
                          onClick={async () => {
                            setPhoneVerificationLoading(true);
                            try {
                              // Format phone number with country code
                              const fullPhoneNumber = countryCode + familyData.phoneNumber.replace(/\D/g, '');

                              const endpoint = process.env.NODE_ENV === 'production'
              ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/twilioSendVerification'
              : '/api/twilio/send-verification';

            const response = await fetch(endpoint, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  phoneNumber: fullPhoneNumber,
                                  userId: familyData.email || 'temp-user'
                                })
                              });

                              const data = await response.json();

                              if (data.success) {
                                updateFamily('phoneSmsCodeSent', true);
                                updateFamily('fullPhoneNumber', fullPhoneNumber);
                                console.log('Verification code sent to ' + fullPhoneNumber);
                                if (data.debug) {
                                  console.log('Debug mode - verification code:', data.debug);
                                }
                              } else {
                                setValidationErrors({ phoneNumber: data.error || 'Failed to send SMS verification' });
                              }
                            } catch (error) {
                              console.error('Error sending SMS verification:', error);
                              const errorMsg = error.message.includes('fetch') ?
                                'SMS service unavailable. Check that backend server is running on port 3002.' :
                                'Failed to send SMS. Check your phone number and try again.';
                              setValidationErrors({ phoneNumber: errorMsg });
                            } finally {
                              setPhoneVerificationLoading(false);
                            }
                          }}
                          disabled={phoneVerificationLoading}
                          className={`w-full py-3 ${phoneVerificationLoading ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                        >
                          {phoneVerificationLoading && (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          )}
                          {phoneVerificationLoading ? 'Sending code...' : 'Send Verification Code'}
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">✓ Phone verified!</h4>
                    <p className="text-sm text-green-800">
                      Your phone number <strong>{formatPhoneForDisplay(familyData.fullPhoneNumber || countryCode + familyData.phoneNumber)}</strong> has been successfully verified.
                    </p>
                    <p className="text-sm text-green-700 mt-2">
                      You can now send photos and schedules to Allie via text at:
                    </p>
                    <p className="text-lg font-semibold text-green-900 mt-1">
                      +1 (719) 748-6209
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  id="skipPhone"
                  checked={familyData.skipPhone || false}
                  onChange={e => updateFamily('skipPhone', e.target.checked)}
                />
                <label htmlFor="skipPhone">
                  {familyData.phoneVerified ? 'Skip adding another phone' : 'Skip for now (you can add this later)'}
                </label>
              </div>
            </div>
          </div>
        );


      case 12: // Family Email Selection (was 13)
        return (
          <EmailSelectionStep
            familyName={familyData.familyName}
            onComplete={(emailData) => {
              updateFamily('familyEmail', emailData.fullEmail);
              updateFamily('familyEmailPrefix', emailData.email);
              nextStep();
            }}
            onBack={prevStep}
            onSelectionChange={(emailData) => {
              // Store the email data temporarily so the parent Continue button can use it
              if (emailData) {
                updateFamily('pendingEmailSelection', emailData);
              } else {
                updateFamily('pendingEmailSelection', null);
              }
            }}
          />
        );

      case 13: // Confirmation (was 14)
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h2 className="text-4xl font-light mb-4 font-roboto">
                Wow, {familyData.familyName} Family!
              </h2>
              <p className="text-xl text-gray-600 font-roboto">
                We are ready to help, here is our starting point
              </p>
            </div>

            {/* Data Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Family Structure */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <h3 className="font-bold text-lg mb-3 text-purple-900 flex items-center gap-2">
                  <Users size={20} />
                  Your Family Structure
                </h3>
                <div className="space-y-2 text-sm">
                  {familyData.parents.filter(p => p.name).map((parent, i) => (
                    <p key={i} className="text-purple-800">
                      <span className="font-medium">{parent.name}</span> 
                      {parent.calledBy && ` (${parent.calledBy})`}
                      {parent.gender && ` • ${parent.gender}`}
                    </p>
                  ))}
                  {familyData.children.filter(c => c.name).map((child, i) => (
                    <p key={i} className="text-purple-800">
                      <span className="font-medium">{child.name}</span>
                      {child.age && ` • Age ${child.age}`}
                    </p>
                  ))}
                </div>
              </div>

              {/* Communication Insights */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                <h3 className="font-bold text-lg mb-3 text-blue-900 flex items-center gap-2">
                  <MessageCircle size={20} />
                  Communication Profile
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>Style: <span className="font-medium capitalize">{familyData.communication.style}</span></p>
                  <p>Challenges: {familyData.communication.challengeAreas?.map(area => 
                    <span key={area} className="inline-block bg-blue-100 px-2 py-1 rounded-full text-xs mr-1 mt-1">
                      {area}
                    </span>
                  )}</p>
                </div>
              </div>

              {/* Priorities */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <h3 className="font-bold text-lg mb-3 text-green-900 flex items-center gap-2">
                  <Target size={20} />
                  Your Priorities
                </h3>
                <div className="space-y-2 text-sm text-green-800">
                  {familyData.priorities.highestPriority && (
                    <p>🥇 <span className="font-medium">{familyData.priorities.highestPriority}</span></p>
                  )}
                  {familyData.priorities.secondaryPriority && (
                    <p>🥈 <span className="font-medium">{familyData.priorities.secondaryPriority}</span></p>
                  )}
                  {familyData.priorities.tertiaryPriority && (
                    <p>🥉 <span className="font-medium">{familyData.priorities.tertiaryPriority}</span></p>
                  )}
                </div>
              </div>

              {/* AI Preferences */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-200">
                <h3 className="font-bold text-lg mb-3 text-orange-900 flex items-center gap-2">
                  <Brain size={20} />
                  Allie AI Preferences
                </h3>
                <div className="space-y-2 text-sm text-orange-800">
                  <p>Style: <span className="font-medium capitalize">{familyData.aiPreferences.style}</span></p>
                  <p>Length: <span className="font-medium capitalize">{familyData.aiPreferences.length}</span></p>
                  {familyData.aiPreferences.topics?.length > 0 && (
                    <p>Topics: {familyData.aiPreferences.topics.map(topic => 
                      <span key={topic} className="inline-block bg-orange-100 px-2 py-1 rounded-full text-xs mr-1 mt-1">
                        {topic}
                      </span>
                    )}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Connectivity Status */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8 rounded-xl shadow-lg">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                <Zap size={24} />
                Your Family is Connected!
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Show all verified emails */}
                {familyData.parents?.map((parent, index) => {
                  if (parent.email && familyData[`email_${index}_verified`]) {
                    return (
                      <div key={`email-${index}`} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={20} className="text-green-300 flex-shrink-0" />
                          <p className="text-sm opacity-90">Email Verified</p>
                        </div>
                        <p className="font-medium break-words">{parent.email}</p>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Show all verified phones */}
                {familyData.phoneVerified && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-300 flex-shrink-0" />
                      <p className="text-sm opacity-90">SMS Connected</p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {familyData.phoneVerifiedFor || 'Stefan'}'s phone
                      </p>
                      {familyData.fullPhoneNumber && (
                        <p className="text-sm opacity-90 mt-1">
                          {formatPhoneForDisplay(familyData.fullPhoneNumber)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {familyData.familyEmail && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-300 flex-shrink-0" />
                      <p className="text-sm opacity-90">Family Email</p>
                    </div>
                    <p className="font-medium text-sm break-words">{familyData.familyEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Trial info */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                14-day free trial • Cancel anytime • Your data is secure
              </p>
            </div>
          </div>
        );
        
      default:
        return <div className="font-roboto">Step content not found</div>;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-purple-50 flex flex-col font-roboto overflow-hidden relative">

      {/* Loading Overlay - Prevents white screen during async operations */}
      {isNavigating && (
        <div className="fixed inset-0 bg-white bg-opacity-80 z-[100] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p className="text-gray-700 font-medium">Loading...</p>
          </div>
        </div>
      )}

      {/* Beta Access Notice */}
      <div className="absolute top-4 left-4 z-50">
        <a
          href="mailto:stefan@checkallie.com"
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg shadow-md hover:bg-yellow-200 transition-colors border border-yellow-300"
        >
          <Mail size={16} />
          <span className="text-sm font-medium">
            Beta Access: Email stefan@checkallie.com
            <span className="block text-xs font-normal">We're not charging yet - free access available!</span>
          </span>
        </a>
      </div>

      {/* Clear Progress Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={clearOnboardingProgress}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg shadow-md hover:bg-red-200 transition-colors border border-red-300"
        >
          <Trash2 size={16} />
          <span className="text-sm font-medium">Clear Progress</span>
        </button>
      </div>

      {/* Header with family name */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-light text-black mb-2 font-roboto">
          {headerTitle}
        </h1>
        {step > 2 && familyData.familyName && (
          <p className="text-gray-600 font-light font-roboto">Personalizing your family balance experience</p>
        )}
      </div>
  
      <div className="flex-1 flex flex-col justify-center px-4 pb-56 pt-6 relative overflow-y-auto">
        {/* Main content - centered */}
        <div className="w-full max-w-2xl mx-auto relative z-10">
          {renderStep()}
          
          <div className="flex justify-between items-center mt-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => step > 1 && prevStep()}
                className={`px-4 py-2 flex items-center font-roboto ${step === 1 ? 'invisible' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <ArrowLeft size={16} className="mr-1" />
                Back
              </button>
            </div>
            
            {step < totalSteps ? (
              <button
                onClick={nextStep}
                className={`px-4 py-2 rounded-md flex items-center font-roboto ${
                  step === 11 && familyData.phoneSmsCodeSent && !familyData.phoneVerified && !familyData.skipPhone
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
                disabled={step === 11 && familyData.phoneSmsCodeSent && !familyData.phoneVerified && !familyData.skipPhone}
              >
                {step === totalSteps ? 'Finish' :
                 step === totalSteps - 1 ? 'Review & Finish' :
                 // Step 9: Conditional Auth (Google OR Password)
                 step === 9 && authMethod === 'google' && !familyData.googleAuth?.authenticated ? 'Authenticate with Google' :
                 step === 9 && authMethod === 'password' && !familyData.otpSent && !(familyData.email_0_verified || familyData.email_1_verified || familyData.emailVerified) ? 'Verify Email' :
                 step === 9 && authMethod === 'password' && (familyData.email_0_verified || familyData.email_1_verified || familyData.emailVerified) ? 'Continue' :
                 // Step 11: Phone verification
                 step === 11 && !familyData.phoneVerified && familyData.phoneNumber && !familyData.skipPhone && !familyData.phoneSmsCodeSent ? 'Send Verification Code' :
                 step === 11 && familyData.phoneSmsCodeSent && !familyData.phoneVerified && !familyData.skipPhone ? 'Waiting for verification...' :
                 step === 11 && (familyData.phoneVerified || familyData.skipPhone || !familyData.phoneNumber) ? 'Continue' :
                 'Continue'}
                <ArrowRight size={16} className="ml-1" />
              </button>
            ) : (
              <button
                onClick={completeOnboarding}
                className="px-4 py-2 bg-black text-white rounded-md flex items-center hover:bg-gray-800 font-roboto"
              >
                Get Started
                <ArrowRight size={16} className="ml-1" />
              </button>
            )}
          </div>
        </div>
        
        {/* Resume Form - Inline below main content - only show on step 1 */}
        {showResumeForm && step === 1 && (
          <div ref={resumeFormRef} className="w-full max-w-2xl mx-auto mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 font-roboto">Resume Your Setup</h3>
              <p className="text-gray-600 text-sm font-roboto">
                Enter the email or phone number you used during setup
              </p>
            </div>
            
            {/* In-app message display */}
            {resumeMessage && (
              <div className={`mb-4 p-3 rounded-md ${
                resumeMessageType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                resumeMessageType === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                'bg-blue-50 border border-blue-200 text-blue-800'
              }`}>
                <p className="text-sm font-roboto">{resumeMessage}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-roboto">Email Address</label>
                <input
                  type="email"
                  value={resumeEmail}
                  onChange={(e) => setResumeEmail(e.target.value)}
                  className="w-full px-0 py-2 bg-transparent border-0 border-b border-b-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all font-roboto"
                  placeholder="spalsson@gmail.com"
                  autoFocus
                />
              </div>
              
              <div className="text-center">
                <span className="text-gray-400 text-sm font-roboto">or</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-roboto">Phone Number</label>
                <input
                  type="tel"
                  value={resumePhone}
                  onChange={(e) => setResumePhone(e.target.value)}
                  className="w-full px-0 py-2 bg-transparent border-0 border-b border-b-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-black transition-all font-roboto"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowResumeForm(false);
                  setResumeEmail('');
                  setResumePhone('');
                  setResumeMessage('');
                }}
                className="flex-1 py-2 px-4 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 font-roboto"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResumeWithEmailOrPhone()}
                className="flex-1 py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800 font-roboto font-medium"
              >
                Find Setup
              </button>
            </div>
          </div>
        )}
        
        {/* Full-width Mountain Progress Bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <MountainProgress currentStep={step} totalSteps={totalSteps} />
        </div>
      </div>

      {/* Survey overlay removed - now handled on landing page or in app */}
    </div>
  );
};

export default OnboardingFlow;