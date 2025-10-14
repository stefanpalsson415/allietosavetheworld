import React, { useState } from 'react';
import { Phone, Check, AlertCircle, Loader, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { db } from '../../services/firebase';
import { doc, updateDoc, collection, addDoc, setDoc, getDoc } from 'firebase/firestore';

// Country codes data
const COUNTRY_CODES = [
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
  { code: '+355', country: 'Albania', flag: '🇦🇱' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+1', country: 'American Samoa', flag: '🇦🇸' },
  { code: '+376', country: 'Andorra', flag: '🇦🇩' },
  { code: '+244', country: 'Angola', flag: '🇦🇴' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+374', country: 'Armenia', flag: '🇦🇲' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+994', country: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+375', country: 'Belarus', flag: '🇧🇾' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+501', country: 'Belize', flag: '🇧🇿' },
  { code: '+229', country: 'Benin', flag: '🇧🇯' },
  { code: '+975', country: 'Bhutan', flag: '🇧🇹' },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+387', country: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: '+267', country: 'Botswana', flag: '🇧🇼' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+673', country: 'Brunei', flag: '🇧🇳' },
  { code: '+359', country: 'Bulgaria', flag: '🇧🇬' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+855', country: 'Cambodia', flag: '🇰🇭' },
  { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
  { code: '+385', country: 'Croatia', flag: '🇭🇷' },
  { code: '+53', country: 'Cuba', flag: '🇨🇺' },
  { code: '+357', country: 'Cyprus', flag: '🇨🇾' },
  { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
  { code: '+372', country: 'Estonia', flag: '🇪🇪' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
  { code: '+504', country: 'Honduras', flag: '🇭🇳' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+36', country: 'Hungary', flag: '🇭🇺' },
  { code: '+354', country: 'Iceland', flag: '🇮🇸' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+98', country: 'Iran', flag: '🇮🇷' },
  { code: '+964', country: 'Iraq', flag: '🇮🇶' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+7', country: 'Kazakhstan', flag: '🇰🇿' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+996', country: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: '+856', country: 'Laos', flag: '🇱🇦' },
  { code: '+371', country: 'Latvia', flag: '🇱🇻' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+218', country: 'Libya', flag: '🇱🇾' },
  { code: '+370', country: 'Lithuania', flag: '🇱🇹' },
  { code: '+352', country: 'Luxembourg', flag: '🇱🇺' },
  { code: '+853', country: 'Macau', flag: '🇲🇴' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+356', country: 'Malta', flag: '🇲🇹' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+373', country: 'Moldova', flag: '🇲🇩' },
  { code: '+377', country: 'Monaco', flag: '🇲🇨' },
  { code: '+976', country: 'Mongolia', flag: '🇲🇳' },
  { code: '+382', country: 'Montenegro', flag: '🇲🇪' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
  { code: '+264', country: 'Namibia', flag: '🇳🇦' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+507', country: 'Panama', flag: '🇵🇦' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+40', country: 'Romania', flag: '🇷🇴' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+221', country: 'Senegal', flag: '🇸🇳' },
  { code: '+381', country: 'Serbia', flag: '🇷🇸' },
  { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+421', country: 'Slovakia', flag: '🇸🇰' },
  { code: '+386', country: 'Slovenia', flag: '🇸🇮' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+963', country: 'Syria', flag: '🇸🇾' },
  { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
  { code: '+992', country: 'Tajikistan', flag: '🇹🇯' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+993', country: 'Turkmenistan', flag: '🇹🇲' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+998', country: 'Uzbekistan', flag: '🇺🇿' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+967', country: 'Yemen', flag: '🇾🇪' },
  { code: '+260', country: 'Zambia', flag: '🇿🇲' },
  { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
];

const PhoneVerificationForm = ({ onVerified, onCancel }) => {
  const { currentUser } = useAuth();
  const { familyId, selectedUser } = useFamily();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]); // Default to US
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'code', 'verified'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCountryDropdown && !e.target.closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
        setCountrySearch(''); // Clear search when closing
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCountryDropdown]);

  const formatPhoneNumber = (value, countryCode) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Don't format if empty
    if (!cleaned) return '';
    
    // Format based on country code
    if (countryCode === '+1') {
      // US/Canada format: (XXX) XXX-XXXX
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else {
      // Other countries: flexible formatting with spaces every 3-4 digits
      if (cleaned.length <= 4) return cleaned;
      if (cleaned.length <= 7) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      if (cleaned.length <= 11) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7, 11)} ${cleaned.slice(11)}`;
    }
  };

  const getCleanPhoneNumber = (formatted, countryCode) => {
    // Convert formatted phone to international format
    const cleaned = formatted.replace(/\D/g, '');
    return `${countryCode}${cleaned}`;
  };

  // Validate phone number based on country
  const validatePhoneNumber = (phone, countryCode) => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Basic validation rules for common countries
    if (countryCode === '+1') {
      // US/Canada: exactly 10 digits
      return cleaned.length === 10;
    } else if (countryCode === '+44') {
      // UK: 10 or 11 digits
      return cleaned.length >= 10 && cleaned.length <= 11;
    } else if (countryCode === '+91') {
      // India: exactly 10 digits
      return cleaned.length === 10;
    } else {
      // General rule: at least 7 digits, max 15
      return cleaned.length >= 7 && cleaned.length <= 15;
    }
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber, selectedCountry.code)) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanPhone = getCleanPhoneNumber(phoneNumber, selectedCountry.code);
      
      // Generate a simple 4-digit code for demo
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Store verification code temporarily (in production, use secure backend)
      sessionStorage.setItem(`verification_${cleanPhone}`, code);
      sessionStorage.setItem(`verification_${cleanPhone}_timestamp`, Date.now().toString());
      sessionStorage.setItem(`verification_${cleanPhone}_formatted`, `${selectedCountry.code} ${phoneNumber}`);
      
      // For demo: Show the code in console (in production, send via SMS)
      console.log(`🔐 Verification code for ${cleanPhone}: ${code}`);
      
      // Store the demo code for display
      sessionStorage.setItem(`demo_code_${cleanPhone}`, code);
      
      // Try to send actual SMS using the correct Twilio endpoint
      try {
        console.log('📤 Attempting to send SMS via Twilio...');
        console.log('   Phone:', cleanPhone);
        console.log('   User:', currentUser?.uid || 'anonymous');
        
        // Use Firebase Functions in production
        const sendEndpoint = process.env.NODE_ENV === 'production'
          ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/twilioSendVerification'
          : '/api/twilio/send-verification';

        const response = await fetch(sendEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phoneNumber: cleanPhone, 
            userId: currentUser?.uid || 'anonymous'
          })
        });
        
        console.log('   Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ SMS sent successfully via Twilio!');
          console.log('   Response:', data);
          
          // In development, Twilio returns the code for testing
          if (data.debug) {
            console.log(`🔐 Real verification code from Twilio: ${data.debug}`);
            // Override the demo code with the real one from Twilio
            sessionStorage.setItem(`verification_${cleanPhone}`, data.debug);
            sessionStorage.setItem(`demo_code_${cleanPhone}`, data.debug);
          }
        } else {
          const errorText = await response.text();
          console.log('❌ Twilio request failed:', response.status);
          console.log('   Error:', errorText);
          console.log('📱 Falling back to demo mode');
          console.log(`Demo code: ${code}`);
        }
      } catch (smsError) {
        console.error('❌ Error calling Twilio:', smsError);
        console.log('📱 Falling back to demo mode');
        console.log(`Demo code: ${code}`);
      }
      
      setStep('code');
      
    } catch (error) {
      console.error('Error sending verification code:', error);
      setError('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanPhone = getCleanPhoneNumber(phoneNumber, selectedCountry.code);
      
      // Try Twilio verification first
      let verificationSuccessful = false;
      
      try {
        const verifyEndpoint = process.env.NODE_ENV === 'production'
          ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/twilioVerifyCode'
          : '/api/twilio/verify-code';

        const response = await fetch(verifyEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: cleanPhone,
            userId: currentUser?.uid || 'anonymous',
            code: verificationCode
          })
        });
        
        if (response.ok) {
          verificationSuccessful = true;
          console.log('✅ Phone verified via Twilio');
        } else {
          const error = await response.json();
          console.log('Twilio verification failed:', error.error);
        }
      } catch (twilioError) {
        console.log('Twilio not available, falling back to demo verification');
      }
      
      // Fall back to demo verification if Twilio fails
      if (!verificationSuccessful) {
        const storedCode = sessionStorage.getItem(`verification_${cleanPhone}`);
        const timestamp = sessionStorage.getItem(`verification_${cleanPhone}_timestamp`);
        
        // Check if code is expired (5 minutes)
        if (!timestamp || Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
          setError('Verification code has expired. Please request a new one.');
          setStep('phone');
          return;
        }
        
        if (verificationCode !== storedCode) {
          setError('Invalid verification code');
          return;
        }
      }
      
      // Code is valid - update user profile
      if (currentUser) {
        // Use setDoc with merge to create the document if it doesn't exist
        await setDoc(doc(db, 'users', currentUser.uid), {
          phoneNumber: cleanPhone,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          email: currentUser.email,
          uid: currentUser.uid,
          updatedAt: new Date()
        }, { merge: true });
      }
      
      // Update family member info if family exists
      if (familyId && selectedUser) {
        // Update the family member's phone data
        const familyRef = doc(db, 'families', familyId);
        const familyDoc = await getDoc(familyRef);
        
        if (familyDoc.exists()) {
          const familyData = familyDoc.data();
          const updatedMembers = familyData.familyMembers.map(member => {
            if (member.id === selectedUser.id || member.id === currentUser?.uid) {
              return {
                ...member,
                phoneNumber: cleanPhone,
                phoneVerified: true
              };
            }
            return member;
          });
          
          await updateDoc(familyRef, {
            familyMembers: updatedMembers,
            phoneNumber: cleanPhone,
            phoneVerified: true
          });
        }
        
        // Add to family communications log
        await addDoc(collection(db, 'families', familyId, 'communicationMethods'), {
          type: 'sms',
          phoneNumber: cleanPhone,
          verifiedBy: currentUser?.uid,
          verifiedAt: new Date(),
          active: true
        });
      }
      
      // Clean up verification data
      sessionStorage.removeItem(`verification_${cleanPhone}`);
      sessionStorage.removeItem(`verification_${cleanPhone}_timestamp`);
      
      setStep('verified');
      
      // Call success callback after a brief delay
      setTimeout(() => {
        onVerified(cleanPhone);
      }, 2000);
      
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value, selectedCountry.code);
    setPhoneNumber(formatted);
    setError('');
  };

  if (step === 'verified') {
    return (
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Phone Verified Successfully!
          </h3>
          <p className="text-gray-600 mb-4">
            You can now receive SMS messages from Allie at {selectedCountry.code} {phoneNumber}
          </p>
          <p className="text-sm text-blue-600">
            Try texting Allie something like "Remind me to pick up groceries" or send a photo!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-md mx-auto relative">
      {/* Close button */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
        aria-label="Close"
        type="button"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {step === 'phone' ? 'Verify Your Phone Number' : 'Enter Verification Code'}
        </h3>
        <p className="text-gray-600">
          {step === 'phone' 
            ? 'Add your phone number to receive SMS messages from Allie'
            : `We sent a 4-digit code to ${selectedCountry.code} ${phoneNumber}`
          }
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {step === 'phone' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              <div className="relative country-dropdown-container">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCountryDropdown(!showCountryDropdown);
                  }}
                  className="flex items-center gap-2 px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="font-medium text-gray-900">{selectedCountry.code}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showCountryDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-72 max-h-64 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={countrySearch}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {COUNTRY_CODES.filter(country => 
                        country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
                        country.code.includes(countrySearch)
                      ).map((country) => (
                        <button
                          key={`${country.code}-${country.country}`}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryDropdown(false);
                            setCountrySearch('');
                            setPhoneNumber(''); // Clear phone number when country changes
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-xl">{country.flag}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{country.country}</div>
                            <div className="text-xs text-gray-500">{country.code}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Phone Number Input */}
              <div className="flex-1 relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder={selectedCountry.code === '+1' ? '(555) 123-4567' : '123 456 7890'}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white pr-10 ${
                    phoneNumber && validatePhoneNumber(phoneNumber, selectedCountry.code)
                      ? 'border-green-500'
                      : phoneNumber
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  maxLength={selectedCountry.code === '+1' ? 14 : 20}
                  autoComplete="tel"
                  disabled={false}
                />
                {phoneNumber && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validatePhoneNumber(phoneNumber, selectedCountry.code) ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
            {phoneNumber && !validatePhoneNumber(phoneNumber, selectedCountry.code) && (
              <p className="text-xs text-red-600 mt-1">
                {selectedCountry.code === '+1' 
                  ? 'Please enter a valid 10-digit US/Canada phone number'
                  : `Please enter a valid phone number for ${selectedCountry.country}`
                }
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={sendVerificationCode}
              disabled={loading || !phoneNumber || !validatePhoneNumber(phoneNumber, selectedCountry.code)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                'Send Code'
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'code' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              placeholder="Enter code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
              maxLength={6}
              autoFocus
            />
            <div className="mt-2">
              <p className="text-xs text-gray-500 text-center">
                Check your SMS messages for the code
              </p>
              {/* Show demo code if available */}
              {sessionStorage.getItem(`demo_code_${getCleanPhoneNumber(phoneNumber, selectedCountry.code)}`) && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 text-center">
                    Demo Mode - Your code is: {sessionStorage.getItem(`demo_code_${getCleanPhoneNumber(phoneNumber, selectedCountry.code)}`)}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setStep('phone')}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={verifyCode}
              disabled={loading || verificationCode.length < 4}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                'Verify'
              )}
            </button>
          </div>
          
          <button
            onClick={sendVerificationCode}
            disabled={loading}
            className="w-full text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            Didn't receive the code? Send again
          </button>
        </div>
      )}
    </div>
  );
};

export default PhoneVerificationForm;