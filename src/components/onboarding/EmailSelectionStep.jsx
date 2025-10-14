import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, X, Mail, Sparkles } from 'lucide-react';
import EmailConfigurationService from '../../services/EmailConfigurationService';

const EmailSelectionStep = ({ familyName, onComplete, onBack, onSelectionChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [customEmail, setCustomEmail] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState('');

  // Helper functions
  const isValidEmail = (email) => {
    // Allow letters, numbers, dots, dashes, underscores
    // Must start with letter or number
    // Length between 3 and 30 characters
    const cleanedEmail = email.toLowerCase();
    // Fixed regex: allows 3-30 total characters (not 3-30 after first char)
    if (cleanedEmail.length < 3 || cleanedEmail.length > 30) return false;
    return /^[a-z0-9][a-z0-9._-]*$/.test(cleanedEmail);
  };

  const canContinue = () => {
    if (selectedEmail === 'custom') {
      return customEmail && isValidEmail(customEmail) && availability?.available;
    }
    return selectedEmail && selectedEmail !== 'custom';
  };

  // Generate suggestions when component mounts
  useEffect(() => {
    console.log('[EmailSelectionStep] Component mounted with familyName:', familyName);
    generateSuggestions();
  }, [familyName]);

  // Notify parent of selection changes
  useEffect(() => {
    if (!onSelectionChange) return;

    // Only notify if we have a valid selection
    if (canContinue()) {
      const emailData = {
        email: selectedEmail === 'custom' ? customEmail : selectedEmail,
        fullEmail: EmailConfigurationService.formatEmail(selectedEmail === 'custom' ? customEmail : selectedEmail)
      };
      onSelectionChange(emailData);
    } else {
      onSelectionChange(null);
    }
  }, [selectedEmail, customEmail, availability?.available]); // Only trigger on availability.available change, not the whole object

  const generateSuggestions = async () => {
    try {
      // Use EmailConfigurationService to generate suggestions (now async!)
      const suggestedPrefixes = await EmailConfigurationService.getSuggestedEmails(familyName);
      console.log('[EmailSelectionStep] Generated prefixes:', suggestedPrefixes);

      // Format suggestions for display
      const formattedSuggestions = suggestedPrefixes.map(prefix => ({
        local: prefix,
        full: EmailConfigurationService.formatEmail(prefix)
      }));
      console.log('[EmailSelectionStep] Formatted suggestions:', formattedSuggestions);

      setSuggestions(formattedSuggestions);

      // Pre-select first suggestion if available
      if (formattedSuggestions.length > 0) {
        setSelectedEmail(formattedSuggestions[0].local);
        console.log('[EmailSelectionStep] Pre-selected:', formattedSuggestions[0].full);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
      // Fallback to basic suggestions with random number
      const randomSuffix = Math.floor(Math.random() * 9999);
      const basicSuggestion = {
        local: `${familyName.toLowerCase().replace(/[^a-z0-9]/g, '')}${randomSuffix}`,
        full: EmailConfigurationService.formatEmail(`${familyName.toLowerCase().replace(/[^a-z0-9]/g, '')}${randomSuffix}`)
      };
      setSuggestions([basicSuggestion]);
      setSelectedEmail(basicSuggestion.local);
    }
  };

  const checkEmailAvailability = async (email) => {
    if (!email || email.length < 3) {
      setAvailability(null);
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      // First validate the format
      const validation = EmailConfigurationService.validateEmailPrefix(email);
      
      if (!validation.isValid) {
        setAvailability({ available: false, message: validation.error });
        setError(validation.error);
        setIsChecking(false);
        return;
      }
      
      // Then check availability
      const isAvailable = await EmailConfigurationService.isEmailPrefixAvailable(email);
      
      setAvailability({
        available: isAvailable,
        message: isAvailable ? 'Great choice! This email is available.' : 'This email is not available'
      });
      
      if (!isAvailable) {
        setError('This email is not available. Please try another.');
      }
    } catch (error) {
      setError('Failed to check availability');
      setAvailability({ available: false, message: 'Failed to check availability' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleCustomEmailChange = (value) => {
    // Only allow valid characters (letters, numbers, dots, dashes, underscores)
    const cleaned = value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    setCustomEmail(cleaned);
    setSelectedEmail('custom');
    
    // Debounce the availability check
    clearTimeout(window.emailCheckTimeout);
    window.emailCheckTimeout = setTimeout(() => {
      checkEmailAvailability(cleaned);
    }, 500);
  };

  const handleContinue = () => {
    const emailToUse = selectedEmail === 'custom' ? customEmail : selectedEmail;
    onComplete({
      email: emailToUse,
      fullEmail: EmailConfigurationService.formatEmail(emailToUse)
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Choose Your Family Email
          </h2>
          <p className="text-gray-600">
            This is where you'll forward schedules, invitations, and important emails. 
            Allie will automatically add them to your family calendar.
          </p>
        </div>

        {/* Suggested Emails */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Suggested emails for your family
          </label>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.local}
                onClick={() => setSelectedEmail(suggestion.local)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedEmail === suggestion.local
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">{suggestion.full}</span>
                  </div>
                  {selectedEmail === suggestion.local && (
                    <Check className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                {index === 0 && (
                  <span className="text-xs text-gray-500 ml-8">Recommended</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Email */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Or create your own
          </label>
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={customEmail}
                  onChange={(e) => handleCustomEmailChange(e.target.value)}
                  onFocus={() => setSelectedEmail('custom')}
                  placeholder="yourfamily"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedEmail === 'custom'
                      ? 'border-blue-500'
                      : 'border-gray-200'
                  } ${error ? 'border-red-300' : ''}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  @families.checkallie.com
                </span>
              </div>
            </div>
            
            {/* Availability Status */}
            {selectedEmail === 'custom' && customEmail && (
              <div className="mt-2">
                {isChecking ? (
                  <p className="text-sm text-gray-500">Checking availability...</p>
                ) : availability ? (
                  availability.available ? (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Great choice! This email is available.
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {availability.message || 'This email is taken'}
                    </p>
                  )
                ) : null}
                {error && (
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                )}
              </div>
            )}
          </div>

          {/* Email format rules */}
          <div className="mt-2 text-xs text-gray-500">
            <p>• Use letters, numbers, dash (-), or underscore (_)</p>
            <p>• Must be 3-30 characters long</p>
          </div>
        </div>

        {/* Preview */}
        {(selectedEmail && selectedEmail !== 'custom') || (customEmail && availability?.available) ? (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Your family email will be:</span>
            </div>
            <p className="text-lg font-mono text-blue-800">
              {EmailConfigurationService.formatEmail(selectedEmail === 'custom' ? customEmail : selectedEmail)}
            </p>
          </div>
        ) : null}

      </div>
    </div>
  );
};

export default EmailSelectionStep;