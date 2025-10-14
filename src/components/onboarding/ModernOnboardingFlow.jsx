import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, X, ChevronRight, ChevronLeft, Sparkles, User, Baby, Calendar,
  Hash, AtSign, Loader2, Check, Info, UserPlus, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import EmailSelectionStep from './EmailSelectionStep';

const ModernOnboardingFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [familyData, setFamilyData] = useState({
    familyName: '',
    parents: [
      { name: '', nickname: '', emoji: '👩', id: 'parent-1' },
      { name: '', nickname: '', emoji: '👨', id: 'parent-2' }
    ],
    children: [],
    email: '',
    emailVerified: false,
    phoneNumber: '',
    preferences: {
      reminderFrequency: 'weekly',
      communicationStyle: 'balanced'
    }
  });

  const totalSteps = 6;

  // Emoji options for family members
  const parentEmojis = ['👩', '👨', '🧑', '👤', '💁‍♀️', '💁‍♂️', '🙋‍♀️', '🙋‍♂️'];
  const childEmojis = ['👶', '👧', '👦', '🧒', '👶🏻', '👧🏻', '👦🏻', '🧒🏻'];

  // Smooth step transition
  const goToStep = (newStep) => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setIsAnimating(false);
    }, 200);
  };

  const updateFamily = (key, value) => {
    setFamilyData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateParent = (index, field, value) => {
    const updatedParents = [...familyData.parents];
    updatedParents[index] = { ...updatedParents[index], [field]: value };
    updateFamily('parents', updatedParents);
  };

  const addChild = () => {
    const newChild = {
      id: `child-${Date.now()}`,
      name: '',
      age: '',
      emoji: childEmojis[familyData.children.length % childEmojis.length]
    };
    updateFamily('children', [...familyData.children, newChild]);
  };

  const removeChild = (id) => {
    updateFamily('children', familyData.children.filter(c => c.id !== id));
  };

  const updateChild = (id, field, value) => {
    const updatedChildren = familyData.children.map(child =>
      child.id === id ? { ...child, [field]: value } : child
    );
    updateFamily('children', updatedChildren);
  };

  // Progress indicator component
  const ProgressIndicator = () => (
    <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
        style={{ width: `${(step / totalSteps) * 100}%` }}
      />
    </div>
  );

  // Step indicator pills
  const StepIndicator = () => (
    <div className="flex justify-center mb-12">
      <div className="flex items-center space-x-2">
        {[...Array(totalSteps)].map((_, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => i + 1 < step && goToStep(i + 1)}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${i + 1 === step 
                  ? 'w-8 bg-gray-900' 
                  : i + 1 < step 
                    ? 'bg-gray-400 hover:bg-gray-600 cursor-pointer' 
                    : 'bg-gray-200'
                }
              `}
            />
            {i < totalSteps - 1 && (
              <div className={`w-8 h-px ${i + 1 < step ? 'bg-gray-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep = () => {
    switch(step) {
      case 1: // Welcome
        return (
          <div className="text-center max-w-lg mx-auto">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
              <h1 className="text-4xl font-semibold mb-4">Welcome to Allie</h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                Let's set up your family workspace in just a few minutes. 
                We'll keep things simple and you can always change these later.
              </p>
            </div>
            
            <button
              onClick={() => goToStep(2)}
              className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-lg font-medium"
            >
              Get Started
              <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        );

      case 2: // Family Name
        return (
          <div className="max-w-lg mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold mb-3">What's your family name?</h2>
              <p className="text-gray-600">This helps personalize your experience</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., The Smiths, Johnson Family"
                  value={familyData.familyName}
                  onChange={(e) => updateFamily('familyName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-lg"
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  You can always change this later in settings
                </p>
              </div>

              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  This will appear as "{familyData.familyName || 'Your Family'}" throughout the app
                </p>
              </div>
            </div>
          </div>
        );

      case 3: // Parents Setup
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold mb-3">Tell us about the parents</h2>
              <p className="text-gray-600">Add the adults who'll be managing the family</p>
            </div>

            <div className="space-y-4">
              {familyData.parents.map((parent, index) => (
                <div key={parent.id} className="group relative p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                  <div className="flex items-start space-x-4">
                    {/* Emoji Selector */}
                    <div className="relative">
                      <button
                        className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-2xl hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          const currentIndex = parentEmojis.indexOf(parent.emoji);
                          const nextIndex = (currentIndex + 1) % parentEmojis.length;
                          updateParent(index, 'emoji', parentEmojis[nextIndex]);
                        }}
                      >
                        {parent.emoji}
                      </button>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    {/* Input Fields */}
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Sarah Johnson"
                            value={parent.name}
                            onChange={(e) => updateParent(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            What the kids call them
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Mom, Papa, Dad"
                            value={parent.nickname}
                            onChange={(e) => updateParent(index, 'nickname', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Tip:</span> Click the emoji to change it. 
                You can add more family members later in settings.
              </p>
            </div>
          </div>
        );

      case 4: // Children Setup
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold mb-3">Your Children</h2>
              <p className="text-gray-600">Add your kids to personalize their experience</p>
            </div>

            <div className="space-y-4">
              {familyData.children.map((child) => (
                <div key={child.id} className="group relative p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                  <div className="flex items-start space-x-4">
                    {/* Emoji Selector */}
                    <button
                      className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-2xl hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        const currentIndex = childEmojis.indexOf(child.emoji);
                        const nextIndex = (currentIndex + 1) % childEmojis.length;
                        updateChild(child.id, 'emoji', childEmojis[nextIndex]);
                      }}
                    >
                      {child.emoji}
                    </button>

                    {/* Input Fields */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Emma"
                            value={child.name}
                            onChange={(e) => updateChild(child.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Age
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="e.g., 8"
                              min="0"
                              max="18"
                              value={child.age}
                              onChange={(e) => updateChild(child.id, 'age', e.target.value)}
                              className="w-full px-3 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                              years
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeChild(child.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Child Button */}
              <button
                onClick={addChild}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-colors flex items-center justify-center space-x-2 group"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Plus className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-gray-600 font-medium">Add a child</span>
              </button>
            </div>

            {familyData.children.length === 0 && (
              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">No kids?</span> No problem! You can skip this step and add them later.
                </p>
              </div>
            )}
          </div>
        );

      case 5: // Email Setup
        return (
          <div className="max-w-lg mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold mb-3">Create your account</h2>
              <p className="text-gray-600">We'll send you a magic link - no passwords needed!</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={familyData.email}
                    onChange={(e) => updateFamily('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  What you'll get:
                </h4>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>A family email address for forwarding schedules</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Allie AI assistant to help manage your family</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Smart calendar that understands your family</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 6: // Complete
        return (
          <div className="text-center max-w-lg mx-auto">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-semibold mb-4">All set!</h2>
              <p className="text-gray-600 text-lg">
                {familyData.familyName} is ready to get started with Allie
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/payment', { 
                  state: { fromOnboarding: true, familyData } 
                })}
                className="w-full px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-lg font-medium"
              >
                Continue to Allie
              </button>
              
              <button
                onClick={() => navigate('/mini-survey', { 
                  state: { fromOnboarding: true, familyData } 
                })}
                className="w-full px-8 py-4 bg-white text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-lg font-medium"
              >
                Take Balance Assessment First
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <ProgressIndicator />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-2xl font-semibold">allie</h1>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Content */}
        <div className={`transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12">
          <button
            onClick={() => step > 1 && goToStep(step - 1)}
            className={`flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors ${
              step === 1 ? 'invisible' : ''
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          {step < totalSteps && (
            <button
              onClick={() => goToStep(step + 1)}
              disabled={
                (step === 2 && !familyData.familyName) ||
                (step === 3 && !familyData.parents.some(p => p.name)) ||
                (step === 5 && !familyData.email)
              }
              className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernOnboardingFlow;