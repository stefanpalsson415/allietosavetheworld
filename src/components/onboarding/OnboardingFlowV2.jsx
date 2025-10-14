import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, MapPin, Heart, 
  Target, ArrowRight, ArrowLeft, Check,
  CreditCard, Mail, Phone, User, UserPlus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';
import MountainProgress from './MountainProgress';
import MapboxLocationInput from '../common/MapboxLocationInput';
import FamilyProfileService from '../../services/FamilyProfileService';
import DatabaseService from '../../services/DatabaseService';
import EmailConfigurationService from '../../services/EmailConfigurationService';

// Simple toast function for notifications
const toast = {
  success: (message) => {
    console.log('Success:', message);
    // Could show a custom notification here
  },
  error: (message) => {
    console.error('Error:', message);
    // Could show a custom notification here
  },
  info: (message) => {
    console.info('Info:', message);
    // Could show a custom notification here
  }
};

const OnboardingFlowV2 = () => {
  const navigate = useNavigate();
  const { currentUser, signUp, loginWithMagicLink } = useAuth();
  const { family, updateFamily, setCurrentFamily } = useFamily();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    // Parents info
    parent1Name: '',
    parent1Gender: '',
    parent2Name: '',
    parent2Gender: '',
    
    // Kids info
    kids: [],
    
    // Location
    address: '',
    coordinates: null,
    
    // Values
    topValues: [],
    
    // Contact info (at the end)
    email: '',
    phoneNumber: '',
    magicLinkSent: false
  });

  const totalSteps = 6; // Welcome, Parents, Kids, Location, Values, Contact

  const handleAddKid = () => {
    setFormData({
      ...formData,
      kids: [...formData.kids, { name: '', birthDate: '', interests: [] }]
    });
  };

  const handleRemoveKid = (index) => {
    setFormData({
      ...formData,
      kids: formData.kids.filter((_, i) => i !== index)
    });
  };

  const handleKidChange = (index, field, value) => {
    const updatedKids = [...formData.kids];
    updatedKids[index][field] = value;
    setFormData({ ...formData, kids: updatedKids });
  };

  const handleValueToggle = (value) => {
    const currentValues = formData.topValues;
    if (currentValues.includes(value)) {
      setFormData({
        ...formData,
        topValues: currentValues.filter(v => v !== value)
      });
    } else if (currentValues.length < 5) {
      setFormData({
        ...formData,
        topValues: [...currentValues, value]
      });
    }
  };

  const sendMagicLink = async () => {
    setIsLoading(true);
    try {
      // Mock magic link sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFormData({ ...formData, magicLinkSent: true });
      console.log('Success: Check your email! We sent you a magic link.');
    } catch (error) {
      console.error('Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Create user account (in real implementation, this would happen after magic link click)
      const userCredential = await signUp(formData.email, 'temporary-password-to-be-removed');
      
      // Create family profile
      const familyData = {
        name: `${formData.parent1Name} & ${formData.parent2Name}'s Family`,
        parents: [
          { name: formData.parent1Name, gender: formData.parent1Gender, role: 'parent' },
          { name: formData.parent2Name, gender: formData.parent2Gender, role: 'parent' }
        ],
        children: formData.kids.map(kid => ({
          ...kid,
          role: 'child'
        })),
        address: formData.address,
        coordinates: formData.coordinates,
        topValues: formData.topValues,
        phoneNumber: formData.phoneNumber,
        createdAt: new Date().toISOString()
      };

      const familyId = await DatabaseService.createFamily(familyData);
      await DatabaseService.updateUserProfile(userCredential.user.uid, {
        families: [familyId],
        currentFamily: familyId,
        phoneNumber: formData.phoneNumber
      });

      // Initialize family profile service
      await FamilyProfileService.initializeProfile(familyId, familyData);
      
      // Configure family email
      const familyName = familyData.name.split(' ')[0]; // Get first part of family name
      const generatedEmail = EmailConfigurationService.generateFamilyEmail(familyName, familyId);
      const emailPrefix = EmailConfigurationService.extractEmailPrefix(generatedEmail);
      await EmailConfigurationService.saveFamilyEmail(familyId, emailPrefix);

      setCurrentFamily(familyId);
      navigate('/dashboard');
      console.log('Welcome to Parentload! 🎉');
    } catch (error) {
      console.error('Onboarding error:', error);
      console.error('Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome to Your Family's Command Center
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Let's set up your family profile. This will help us personalize your experience 
              and make Parentload work perfectly for your unique family.
            </p>
            <button
              onClick={() => setCurrentStep(2)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors flex items-center gap-2 mx-auto"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Tell us about the parents</h2>
              <p className="text-gray-600 mt-2">What should we call you?</p>
            </div>

            <div className="space-y-6 max-w-md mx-auto">
              {/* Parent 1 */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Parent 1</h3>
                <input
                  type="text"
                  placeholder="Name (e.g., Mama, Papa, or any name)"
                  value={formData.parent1Name}
                  onChange={(e) => setFormData({ ...formData, parent1Name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex gap-4">
                  {['Female', 'Male', 'Non-binary'].map(gender => (
                    <label key={gender} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="parent1Gender"
                        value={gender.toLowerCase()}
                        checked={formData.parent1Gender === gender.toLowerCase()}
                        onChange={(e) => setFormData({ ...formData, parent1Gender: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Parent 2 */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Parent 2</h3>
                <input
                  type="text"
                  placeholder="Name (e.g., Mama, Papa, or any name)"
                  value={formData.parent2Name}
                  onChange={(e) => setFormData({ ...formData, parent2Name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex gap-4">
                  {['Female', 'Male', 'Non-binary'].map(gender => (
                    <label key={gender} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="parent2Gender"
                        value={gender.toLowerCase()}
                        checked={formData.parent2Gender === gender.toLowerCase()}
                        onChange={(e) => setFormData({ ...formData, parent2Gender: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Tell us about your kids</h2>
              <p className="text-gray-600 mt-2">Add each child to your family</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              {formData.kids.map((kid, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <input
                    type="text"
                    placeholder="Child's name"
                    value={kid.name}
                    onChange={(e) => handleKidChange(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="date"
                    value={kid.birthDate}
                    onChange={(e) => handleKidChange(index, 'birthDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => handleRemoveKid(index)}
                    className="text-red-600 text-sm hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                onClick={handleAddKid}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg
                         text-gray-600 hover:border-gray-400 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Add a child
              </button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Where is home?</h2>
              <p className="text-gray-600 mt-2">This helps us find local activities and resources</p>
            </div>

            <div className="max-w-md mx-auto">
              <MapboxLocationInput
                value={formData.address}
                onChange={(address, coords) => {
                  setFormData({ 
                    ...formData, 
                    address,
                    coordinates: coords
                  });
                }}
                placeholder="Enter your home address"
              />
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">What matters most?</h2>
              <p className="text-gray-600 mt-2">Choose up to 5 values that guide your family</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {[
                'Adventure', 'Creativity', 'Education', 'Faith', 'Family Time',
                'Health', 'Kindness', 'Nature', 'Responsibility', 'Fun',
                'Tradition', 'Independence', 'Community', 'Growth', 'Balance'
              ].map(value => (
                <button
                  key={value}
                  onClick={() => handleValueToggle(value)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.topValues.includes(value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={!formData.topValues.includes(value) && formData.topValues.length >= 5}
                >
                  {value}
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Let's get you connected</h2>
              <p className="text-gray-600 mt-2">We'll send you a magic link to get started</p>
            </div>

            <div className="space-y-6 max-w-md mx-auto">
              {!formData.magicLinkSent ? (
                <>
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                               focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Magic Link Button */}
                  <button
                    onClick={sendMagicLink}
                    disabled={!formData.email || isLoading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                             disabled:opacity-50 disabled:cursor-not-allowed flex items-center 
                             justify-center gap-2"
                  >
                    {isLoading ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Send me a magic link
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  {/* Social Sign-in Buttons (Mocked) */}
                  <div className="space-y-3">
                    <button
                      onClick={() => console.info('Google sign-in coming soon!')}
                      className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 
                               flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>

                    <button
                      onClick={() => console.info('Apple sign-in coming soon!')}
                      className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-900 
                               flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                      </svg>
                      Continue with Apple
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Magic Link Sent State */}
                  <div className="text-center space-y-4 py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium">Check your email!</h3>
                    <p className="text-gray-600">
                      We sent a magic link to {formData.email}. 
                      Click the link in your email to continue.
                    </p>
                  </div>

                  {/* Phone Number Collection */}
                  <div className="space-y-4">
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-center mb-4">
                        One more thing...
                      </h3>
                      <p className="text-gray-600 text-center mb-6">
                        Add your phone number to text documents and updates directly to Allie
                      </p>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                        <div className="flex gap-2">
                          <div className="px-3 py-3 bg-gray-100 rounded-lg text-gray-600">
                            +1
                          </div>
                          <input
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                                     focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          You'll be able to text documents, photos, and questions to your personal Allie number
                        </p>
                      </div>
                    </div>

                    {/* Complete Setup Button */}
                    <button
                      onClick={completeOnboarding}
                      disabled={isLoading}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Setting up...' : 'Complete Setup'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return formData.parent1Name && formData.parent2Name && 
               formData.parent1Gender && formData.parent2Gender;
      case 3:
        return true; // Kids are optional
      case 4:
        return formData.address;
      case 5:
        return formData.topValues.length >= 3;
      case 6:
        return formData.magicLinkSent && formData.phoneNumber;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Progress Bar */}
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <MountainProgress currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-12">
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${
              currentStep === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {currentStep < totalSteps && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${
                canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlowV2;