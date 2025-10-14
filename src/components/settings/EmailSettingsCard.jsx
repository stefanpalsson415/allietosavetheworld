// src/components/settings/EmailSettingsCard.jsx
import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Info, Copy, RefreshCw, Edit2 } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import EmailIngestService from '../../services/EmailIngestService';

const EmailSettingsCard = ({ familyId, familyName }) => {
  const [familyEmail, setFamilyEmail] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [emailCopied, setEmailCopied] = useState(false);
  const [error, setError] = useState('');
  const [emailSettings, setEmailSettings] = useState({
    domain: 'families.checkallie.com', // Default domain
    customName: '',
    isConfirmed: false,
    createdAt: null
  });

  // Generate email suggestions
  const generateSuggestions = (name) => {
    const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const shortId = familyId.substring(0, 6);
    
    return [
      `${baseName}@families.checkallie.com`,
      `${baseName}family@families.checkallie.com`,
      `the${baseName}s@families.checkallie.com`,
      `${baseName}crew@families.checkallie.com`,
      `${baseName}home@families.checkallie.com`
    ];
  };

  // Load existing email settings
  useEffect(() => {
    loadEmailSettings();
  }, [familyId]);

  const loadEmailSettings = async () => {
    try {
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      if (familyDoc.exists()) {
        const data = familyDoc.data();
        
        // First check if email was set during onboarding
        if (data.familyEmail) {
          setFamilyEmail(data.familyEmail);
          // Mark as confirmed since it was chosen during onboarding
          const emailPrefix = data.familyEmailPrefix || data.familyEmail.split('@')[0];
          setEmailSettings({
            domain: 'families.checkallie.com',
            customName: emailPrefix,
            isConfirmed: true,
            createdAt: data.createdAt || new Date()
          });
          setCustomEmail(data.familyEmail);
        }
        // Then check for emailSettings (settings page configuration)
        else if (data.emailSettings) {
          setEmailSettings(data.emailSettings);
          if (data.emailSettings.customName) {
            setFamilyEmail(`${data.emailSettings.customName}@${data.emailSettings.domain}`);
          } else {
            // Generate default email
            const defaultEmail = await EmailIngestService.getPersonalizedEmailAddress(familyId);
            setFamilyEmail(defaultEmail);
          }
        } else {
          // No settings yet, generate suggestions
          setSuggestions(generateSuggestions(familyName));
        }
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      setError('Failed to load email settings');
    }
  };

  // Check if email is available
  const checkEmailAvailability = async (email) => {
    setIsChecking(true);
    setEmailAvailable(null);
    setError('');

    try {
      // Extract username from email
      const [username] = email.split('@');
      if (!username || username.length < 3) {
        setError('Email name must be at least 3 characters');
        setEmailAvailable(false);
        setIsChecking(false);
        return;
      }

      // Check if email is already taken
      const emailsRef = doc(db, 'email_registry', username);
      const emailDoc = await getDoc(emailsRef);
      
      if (emailDoc.exists() && emailDoc.data().familyId !== familyId) {
        setEmailAvailable(false);
        setError('This email is already taken');
        // Generate new suggestions based on the taken name
        const newSuggestions = [
          `${username}${new Date().getFullYear()}@families.checkallie.com`,
          `my${username}@families.checkallie.com`,
          `team${username}@families.checkallie.com`,
          `${username}1@families.checkallie.com`
        ];
        setSuggestions(newSuggestions);
      } else {
        setEmailAvailable(true);
        setError('');
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
      setError('Failed to check availability');
      setEmailAvailable(false);
    }

    setIsChecking(false);
  };

  // Save email settings
  const saveEmailSettings = async () => {
    if (!customEmail || !emailAvailable) return;

    setIsSaving(true);
    setError('');

    try {
      const [username, domain] = customEmail.split('@');

      // Register the email
      await setDoc(doc(db, 'email_registry', username), {
        familyId,
        familyName,
        createdAt: new Date().toISOString(),
        domain
      });

      // Update family settings
      const newSettings = {
        domain: domain || 'families.checkallie.com',
        customName: username,
        isConfirmed: true,
        createdAt: new Date().toISOString(),
        fullEmail: customEmail
      };

      await updateDoc(doc(db, 'families', familyId), {
        emailSettings: newSettings,
        familyEmail: customEmail
      });

      setEmailSettings(newSettings);
      setFamilyEmail(customEmail);
      setIsEditing(false);
      setCustomEmail('');
    } catch (error) {
      console.error('Error saving email settings:', error);
      setError('Failed to save email settings');
    }

    setIsSaving(false);
  };

  // Handle email change
  const handleEmailChange = (value) => {
    setCustomEmail(value);
    setEmailAvailable(null);
    setError('');

    // Auto-check availability after user stops typing
    if (value.includes('@')) {
      const debounceTimer = setTimeout(() => {
        checkEmailAvailability(value);
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  };

  // Copy email to clipboard
  const copyEmail = () => {
    navigator.clipboard.writeText(familyEmail);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Family Email Address
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Forward emails to your family address and Allie will automatically add events to your calendar
          </p>
        </div>
        {!isEditing && emailSettings.isConfirmed && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Edit2 className="w-4 h-4" />
            Change
          </button>
        )}
      </div>

      {!isEditing && emailSettings.isConfirmed ? (
        // Display confirmed email
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-mono text-lg font-medium">{familyEmail}</p>
              <p className="text-xs text-gray-500 mt-1">
                {emailSettings.createdAt ?
                  `Confirmed on ${new Date(emailSettings.createdAt).toLocaleDateString()}` :
                  'Email active'
                }
              </p>
            </div>
            <button
              onClick={copyEmail}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {emailCopied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              How to use your family email
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Forward school newsletters and schedules</li>
              <li>• Send photos of flyers or event invitations</li>
              <li>• CC this address on important family emails</li>
              <li>• Allie will automatically extract dates and create calendar events</li>
            </ul>
          </div>
        </div>
      ) : (
        // Email selection/editing mode
        <div className="space-y-4">
          {!emailSettings.isConfirmed && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                Choose your family's unique email address. This cannot be changed later without contacting support.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your preferred email address
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={customEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="yourfamily@families.checkallie.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    emailAvailable === true
                      ? 'border-green-500 focus:ring-green-500'
                      : emailAvailable === false
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {isChecking && (
                  <RefreshCw className="absolute right-3 top-3 w-4 h-4 text-gray-400 animate-spin" />
                )}
                {emailAvailable === true && (
                  <Check className="absolute right-3 top-3 w-4 h-4 text-green-600" />
                )}
                {emailAvailable === false && (
                  <X className="absolute right-3 top-3 w-4 h-4 text-red-600" />
                )}
              </div>
              <button
                onClick={() => checkEmailAvailability(customEmail)}
                disabled={!customEmail || isChecking}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          {suggestions.length > 0 && !emailSettings.isConfirmed && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Suggestions based on your family name:</p>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCustomEmail(suggestion);
                      checkEmailAvailability(suggestion);
                    }}
                    className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setCustomEmail('');
                  setEmailAvailable(null);
                  setError('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={saveEmailSettings}
              disabled={!customEmail || !emailAvailable || isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Email
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSettingsCard;