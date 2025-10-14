// src/components/user/UserSettingsScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Upload, Mic, Camera, Home, User, Users, Calendar, Download, 
  ChevronDown, ChevronUp, Settings, Globe, Check, Apple, Mail, 
  Copy, Clock, AlertTriangle, Search, Bell, Shield, HelpCircle,
  MapPin, Key, LogOut, LifeBuoy, UserPlus, CreditCard, Heart,
  Save, Edit, Info, FileText, RefreshCw, Trash2, ChevronRight
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import DatabaseService from '../../services/DatabaseService';
import CalendarService from '../../services/CalendarService';
import EmailIngestService from '../../services/EmailIngestService';
import LocationsSettingsTab from '../settings/LocationsSettingsTab';
import PasswordResetComponent from '../settings/PasswordResetComponent';

const UserSettingsScreen = ({ onClose }) => {
  const { 
    selectedUser, 
    familyMembers, 
    familyName,
    familyId,
    familyPicture,
    updateMemberProfile, 
    updateFamilyName,
    updateFamilyPicture
  } = useFamily();
  
  const { currentUser, logout } = useAuth();
  
  // Define new settings categories
  const SETTINGS_CATEGORIES = [
    { id: 'family', label: 'Family Profile', icon: <Users size={20} /> },
    { id: 'personal', label: 'Personal Settings', icon: <User size={20} /> },
    { id: 'calendar', label: 'Calendar & Events', icon: <Calendar size={20} /> },
    { id: 'kids', label: 'Kids & Parental Controls', icon: <Shield size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'locations', label: 'Important Places', icon: <MapPin size={20} /> },
    { id: 'account', label: 'Account & Security', icon: <Key size={20} /> },
    { id: 'help', label: 'Help & Support', icon: <HelpCircle size={20} /> }
  ];
  
  // State variables
  const [activeCategory, setActiveCategory] = useState('family');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState(null); // 'profile' or 'family'
  const [uploadError, setUploadError] = useState(null);
  const [uploadForMember, setUploadForMember] = useState(null);
  const [saveStatus, setSaveStatus] = useState({});
  
  // Family profile states
  const [newFamilyName, setNewFamilyName] = useState(familyName || '');
  const [familyEmail, setFamilyEmail] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);
  
  // Calendar & events states
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    sendConfirmations: true,
    allowAutoCreateEvents: true
  });
  const [emailHistory, setEmailHistory] = useState([]);
  const [loadingEmail, setLoadingEmail] = useState(true);
  
  // Flag to track settings changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Handler for family name update
  const handleFamilyNameUpdate = async () => {
    if (newFamilyName.trim() === '') return;
    
    try {
      await updateFamilyName(newFamilyName);
      // Update document title with family name
      document.title = `${newFamilyName} Family Allie`;
    } catch (error) {
      console.error("Error updating family name:", error);
      alert("Failed to update family name. Please try again.");
    }
  };
  
  // Load email settings
  useEffect(() => {
    if (familyId) {
      setLoadingEmail(true);
      
      Promise.all([
        EmailIngestService.getPersonalizedEmailAddress(familyId),
        EmailIngestService.getEmailSettings(familyId),
        EmailIngestService.getEmailHistory(familyId, 5)
      ])
        .then(([email, settings, history]) => {
          setFamilyEmail(email);
          setEmailSettings(settings);
          setEmailHistory(history);
          setLoadingEmail(false);
        })
        .catch(error => {
          console.error("Error loading email settings:", error);
          setLoadingEmail(false);
        });
    }
  }, [familyId]);
  
  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      if (uploadType === 'profile') {
        // Upload profile picture
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error("File size exceeds 5MB limit");
        }
        
        const imageUrl = await readFileAsDataURL(file);
        await updateMemberProfile(selectedUser.id, { 
          profilePicture: imageUrl 
        });
      } else if (uploadType === 'family') {
        // For family picture, use Firebase Storage
        if (!familyId) {
          throw new Error("Family ID is required to upload family picture");
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          alert("File is too large. Please select a file under 10MB.");
          return;
        }
        
        // Use the dedicated method for uploading family pictures
        const downloadURL = await DatabaseService.uploadFamilyPicture(familyId, file);
        
        // Update family picture in context
        await updateFamilyPicture(downloadURL);
        
        // Update favicon
        updateFavicon(downloadURL);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError(error.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };
  
  // Read file as data URL (for preview and simple storage)
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // Handle copying email to clipboard
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(familyEmail)
      .then(() => {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      })
      .catch(error => {
        console.error("Error copying to clipboard:", error);
      });
  };
  
  // Handle toggling email settings
  const handleToggleSetting = (setting) => {
    const updatedSettings = {
      ...emailSettings,
      [setting]: !emailSettings[setting]
    };
    
    setEmailSettings(updatedSettings);
    
    // Save settings
    EmailIngestService.updateEmailSettings(familyId, updatedSettings)
      .catch(error => {
        console.error("Error updating email settings:", error);
        // Revert on error
        setEmailSettings(emailSettings);
      });
  };
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const CalendarSettingsTab = ({ userId }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [calendarSettings, setCalendarSettings] = useState(null);
    const [activeCalendarType, setActiveCalendarType] = useState('allie');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: '', message: '' });
    
    // Load calendar settings on component mount
    useEffect(() => {
      const loadSettings = async () => {
        if (!userId) {
          setIsLoading(false);
          return;
        }
        
        try {
          // Load user's calendar settings
          const settings = await CalendarService.loadUserCalendarSettings(userId);
          setCalendarSettings(settings);
          setActiveCalendarType('allie'); // Always use Allie calendar
          
        } catch (error) {
          console.error("Error loading calendar settings:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadSettings();
    }, [userId]);
    
    // Save calendar settings
    const saveCalendarSettings = async () => {
      if (!userId) return;
      
      setIsSaving(true);
      setSaveMessage({ type: '', message: '' });
      
      try {
        // Prepare updated settings
        const updatedSettings = {
          ...calendarSettings,
          defaultCalendarType: 'allie',
          allieCalendar: {
            enabled: true
          }
        };
        
        // Save to Firebase
        await CalendarService.saveUserCalendarSettings(userId, updatedSettings);
        setCalendarSettings(updatedSettings);
        
        // Create a visible success notification
        setSaveMessage({
          type: 'success',
          message: 'Calendar settings saved successfully'
        });
        
        // Use React state to handle button success state instead of direct DOM manipulation
        setIsSaving(false);
        
        // Clear message after delay using a safe approach
        const messageTimer = setTimeout(() => {
          setSaveMessage({ type: '', message: '' });
        }, 5000);
        
        // Clean up the timer if component unmounts
        return () => clearTimeout(messageTimer);
      } catch (error) {
        console.error("Error saving calendar settings:", error);
        setSaveMessage({
          type: 'error',
          message: 'Failed to save calendar settings: ' + error.message
        });
        setIsSaving(false);
      }
    };
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
          <div className="flex items-start">
            <Calendar className="text-blue-600 mr-3 mt-1 flex-shrink-0" size={22} />
            <div>
              <h4 className="font-medium text-blue-800 font-roboto">How Calendar Integration Works</h4>
              <p className="text-sm text-blue-700 mt-1 font-roboto">
                Allie helps you keep track of family meetings, tasks, and events in one place
                to better manage your family schedule and send helpful reminders.
              </p>
            </div>
          </div>
        </div>
        
        {/* Allie Calendar Settings */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3">Allie Calendar Settings</h4>
          
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Allie provides a simple calendar system to help you track important family events and tasks.
            </p>
            
            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
              <p className="flex items-center">
                <Check size={16} className="mr-2" />
                Allie Calendar is enabled
              </p>
            </div>
          </div>
        </div>
        
        {/* Email-to-Calendar Section */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3 flex items-center">
            <Mail size={16} className="mr-2" />
            Email-to-Calendar
          </h4>
          
          <p className="text-sm text-gray-600 mb-3">
            Forward event invitations to your family's email address, and Allie will automatically add them to your calendar.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Your Family Email Address</label>
            <div className="flex">
              <div className="flex-grow bg-gray-50 border rounded-l p-2 text-sm truncate">
                {loadingEmail ? 'Loading...' : familyEmail}
              </div>
              <button
                onClick={handleCopyEmail}
                className="bg-black text-white px-3 py-2 rounded-r flex items-center text-sm"
              >
                {emailCopied ? (
                  <>
                    <Check size={14} className="mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-3 bg-blue-50 p-3 rounded-md text-sm">
            <h5 className="font-medium text-blue-800 mb-1">About Your Family Email</h5>
            <p className="text-blue-700 text-xs">
              This is your family's unique Allie email address at checkallie.com. Simply forward event invitations or send emails with event details to this address, and Allie will automatically add them to your family calendar.
            </p>
            <p className="text-blue-700 text-xs mt-1">
              Try it now: Forward a birthday invitation, play date, or appointment email to this address!
            </p>
          </div>
          
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Email-to-Calendar</div>
                <div className="text-xs text-gray-500">Allow creating events from emails</div>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  name="enable"
                  id="enable"
                  checked={emailSettings.enabled}
                  onChange={() => handleToggleSetting('enabled')}
                  className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="enable"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    emailSettings.enabled ? 'bg-black' : ''
                  }`}
                ></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Email Confirmations</div>
                <div className="text-xs text-gray-500">Send confirmation after processing</div>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  name="confirm"
                  id="confirm"
                  checked={emailSettings.sendConfirmations}
                  onChange={() => handleToggleSetting('sendConfirmations')}
                  className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="confirm"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    emailSettings.sendConfirmations ? 'bg-black' : ''
                  }`}
                ></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Auto-Create Events</div>
                <div className="text-xs text-gray-500">Create events without confirmation</div>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  name="auto"
                  id="auto"
                  checked={emailSettings.allowAutoCreateEvents}
                  onChange={() => handleToggleSetting('allowAutoCreateEvents')}
                  className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="auto"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    emailSettings.allowAutoCreateEvents ? 'bg-black' : ''
                  }`}
                ></label>
              </div>
            </div>
          </div>
          
          {/* Email History */}
          {!loadingEmail && emailHistory.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium mb-2 flex items-center">
                <Clock size={14} className="mr-1" />
                Recent Email History
              </h5>
              <div className="border rounded overflow-hidden">
                {emailHistory.map((item, index) => (
                  <div 
                    key={item.id}
                    className={`text-sm p-2 flex items-start ${
                      index !== emailHistory.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 mr-2 flex-shrink-0 ${
                      item.processingResult?.eventCreated 
                        ? 'bg-green-500' 
                        : 'bg-yellow-500'
                    }`}></div>
                    <div className="flex-grow">
                      <div className="font-medium truncate">{item.subject}</div>
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span>{item.from}</span>
                        <span>{formatDate(item.processedAt || item.receivedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!loadingEmail && emailHistory.length === 0 && (
            <div className="text-center p-4 border rounded-md bg-gray-50 mt-4">
              <Mail size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No email history yet</p>
              <p className="text-xs text-gray-400">
                Send an email to your family address to get started
              </p>
            </div>
          )}
        </div>
        
        {/* ICS Download Settings */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3">Calendar Download</h4>
          
          <p className="text-sm text-gray-600 mb-4">
            You can download calendar files (.ics) for any event to import into your preferred calendar application.
          </p>
          
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
            <p>
              After downloading, open the .ics file with your preferred calendar application to add the event.
            </p>
          </div>
        </div>
        
        {/* Notification Settings */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3">Calendar Notifications</h4>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="w-4 h-4 mr-2"
                checked={calendarSettings?.notifications?.taskReminders}
                onChange={(e) => setCalendarSettings(prev => ({
                  ...prev,
                  notifications: {
                    ...prev?.notifications,
                    taskReminders: e.target.checked
                  }
                }))}
              />
              <span className="text-sm">Include reminders for tasks</span>
            </label>
            
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="w-4 h-4 mr-2"
                checked={calendarSettings?.notifications?.meetingReminders}
                onChange={(e) => setCalendarSettings(prev => ({
                  ...prev,
                  notifications: {
                    ...prev?.notifications,
                    meetingReminders: e.target.checked
                  }
                }))}
              />
              <span className="text-sm">Include reminders for family meetings</span>
            </label>
            
            <div>
              <label className="block text-sm mb-1">Reminder time</label>
              <select
                className="p-2 border rounded w-full"
                value={calendarSettings?.notifications?.reminderTime || 30}
                onChange={(e) => setCalendarSettings(prev => ({
                  ...prev,
                  notifications: {
                    ...prev?.notifications,
                    reminderTime: parseInt(e.target.value)
                  }
                }))}
              >
                <option value="10">10 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="120">2 hours before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveCalendarSettings}
            disabled={isSaving}
            className={`px-4 py-2 rounded text-white transition-colors duration-300 ${
              saveMessage.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-black hover:bg-gray-800'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </span>
            ) : (
              saveMessage.type === 'success' ? '✓ Saved' : 'Save Calendar Settings'
            )}
          </button>
        </div>
        
        {/* Save Message */}
        {saveMessage.message && (
          <div className={`p-3 rounded text-sm ${
            saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {saveMessage.message}
          </div>
        )}
      </div>
    );
  };

  // Update favicon
  const updateFavicon = (imageUrl) => {
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = imageUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  };
  
  // Helper function to mark a setting as saved with automatic clearing
  const markSettingSaved = (settingId) => {
    setSaveStatus({...saveStatus, [settingId]: 'saved'});
    setTimeout(() => {
      setSaveStatus(prev => ({...prev, [settingId]: null}));
    }, 3000);
  };

  // Handle search across settings
  const filterSettingsBySearch = (query) => {
    if (!query) return SETTINGS_CATEGORIES;
    
    return SETTINGS_CATEGORIES.filter(category => 
      category.label.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Component for Save/Edit buttons with consistent behavior
  const SaveControls = ({ id, onSave, showEdit = true, saveText = "Save", editText = "Edit" }) => {
    const status = saveStatus[id];
    
    return (
      <div className="flex space-x-2">
        {status === 'saved' && showEdit && (
          <button
            onClick={() => setSaveStatus({...saveStatus, [id]: 'editing'})}
            className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <Edit size={16} className="mr-1" />
            {editText}
          </button>
        )}
        
        {status !== 'saved' && (
          <button
            onClick={() => {
              onSave();
              markSettingSaved(id);
            }}
            className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {status === 'saving' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1" />
                {saveText}
              </>
            )}
          </button>
        )}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold">Family Settings</h2>
          <div className="flex items-center space-x-4">
            {hasUnsavedChanges && (
              <span className="text-sm text-amber-600 flex items-center">
                <AlertTriangle size={16} className="mr-1" />
                Unsaved changes
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r bg-gray-50 overflow-y-auto">
            {/* Search settings */}
            <div className="p-3 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
            
            {/* Settings categories */}
            <nav className="p-2">
              <ul>
                {filterSettingsBySearch(searchQuery).map(category => (
                  <li key={category.id} className="mb-1">
                    <button
                      onClick={() => {
                        setActiveCategory(category.id);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center ${
                        activeCategory === category.id 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`mr-3 ${activeCategory === category.id ? 'text-blue-600' : 'text-gray-500'}`}>
                        {category.icon}
                      </span>
                      <span className="font-medium">{category.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              
              {/* Quick Support */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-700 text-sm mb-2 flex items-center">
                  <LifeBuoy size={16} className="mr-2" />
                  Need Help?
                </h4>
                <p className="text-xs text-blue-700 mb-2">
                  Having trouble with settings? We're here to help!
                </p>
                <button className="w-full text-sm bg-blue-600 text-white py-1.5 px-3 rounded">
                  Contact Support
                </button>
              </div>
            </nav>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Content varies based on active category */}
            <div className="p-6">
              {/* Family Profile */}
              {activeCategory === 'family' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b">
                    <h3 className="text-lg font-semibold mb-1">Family Profile</h3>
                    <p className="text-sm text-gray-600">
                      Manage your family's basic information and members
                    </p>
                  </div>
                  
                  {/* Family Profile Card */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Family Picture */}
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200">
                            <img 
                              src={familyPicture || "/favicon.ico"} 
                              alt="Family" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full"
                            onClick={() => {
                              setUploadType('family');
                              setUploadForMember({id: 'family'});
                              document.getElementById('image-upload').click();
                            }}
                          >
                            <Camera size={16} />
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Family photo
                        </p>
                      </div>
                      
                      {/* Family Details */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Family Name</label>
                          <div className="flex">
                            <input
                              type="text"
                              className="flex-1 p-2 border rounded-l"
                              placeholder="Enter family name"
                              value={newFamilyName}
                              onChange={(e) => {
                                setNewFamilyName(e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                            />
                            <SaveControls 
                              id="familyName"
                              onSave={handleFamilyNameUpdate}
                              saveText="Update"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            This name will appear throughout the app
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Family Email</label>
                          <div className="flex">
                            <div className="flex-grow bg-gray-50 border rounded-l p-2 text-sm truncate">
                              {loadingEmail ? 'Loading...' : familyEmail}
                            </div>
                            <button
                              onClick={handleCopyEmail}
                              className="bg-black text-white px-3 py-2 rounded-r flex items-center text-sm"
                            >
                              {emailCopied ? (
                                <>
                                  <Check size={14} className="mr-1" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={14} className="mr-1" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Forward events to this address to add them to your family calendar
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Family Members */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b flex justify-between items-center">
                      <h4 className="font-medium">Family Members</h4>
                      <button className="text-sm bg-blue-600 text-white py-1.5 px-3 rounded flex items-center">
                        <UserPlus size={16} className="mr-1" />
                        Add Member
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {familyMembers.map(member => (
                          <div key={member.id} className="border rounded-lg p-3 flex flex-col items-center hover:bg-gray-50 cursor-pointer">
                            <div className="w-16 h-16 rounded-full overflow-hidden mb-2">
                              <img 
                                src={member.profilePicture} 
                                alt={member.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Personal Settings */}
              {activeCategory === 'personal' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b">
                    <h3 className="text-lg font-semibold mb-1">Personal Settings</h3>
                    <p className="text-sm text-gray-600">
                      Manage your personal account settings and preferences
                    </p>
                  </div>
                  
                  {/* User Profile Card */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* Profile Picture */}
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                            <img 
                              src={selectedUser?.profilePicture} 
                              alt={selectedUser?.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full"
                            onClick={() => {
                              setUploadType('profile');
                              setUploadForMember(selectedUser);
                              document.getElementById('image-upload').click();
                            }}
                          >
                            <Camera size={16} />
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">Update profile picture</p>
                      </div>
                      
                      {/* User Details */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={selectedUser?.name || ''}
                            readOnly // For now, we're not allowing name changes
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded bg-gray-50"
                            value={selectedUser?.role || ''}
                            readOnly
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            className="w-full p-2 border rounded bg-gray-50"
                            value={selectedUser?.email || currentUser?.email || ''}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Password Security */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Password & Security</h4>
                    </div>
                    
                    <div className="p-4">
                      <PasswordResetComponent user={selectedUser} />
                    </div>
                  </div>
                  
                  {/* Theme Preferences */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">App Theme</h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="text-sm text-gray-600 mb-3">
                        Choose your preferred color theme
                      </div>
                      <div className="flex space-x-3">
                        <button className="w-10 h-10 bg-blue-600 rounded-full border-2 border-white shadow-lg"></button>
                        <button className="w-10 h-10 bg-purple-600 rounded-full"></button>
                        <button className="w-10 h-10 bg-green-600 rounded-full"></button>
                        <button className="w-10 h-10 bg-amber-600 rounded-full"></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Calendar & Events */}
              {activeCategory === 'calendar' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b">
                    <h3 className="text-lg font-semibold mb-1">Calendar & Events</h3>
                    <p className="text-sm text-gray-600">
                      Manage calendars, events, and scheduling preferences
                    </p>
                  </div>
                  
                  <CalendarSettingsTab userId={currentUser?.uid} />
                </div>
              )}
              
              {/* Kids & Parental Controls */}
              {activeCategory === 'kids' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b">
                    <h3 className="text-lg font-semibold mb-1">Kids & Parental Controls</h3>
                    <p className="text-sm text-gray-600">
                      Manage settings related to your children and parental controls
                    </p>
                  </div>
                  
                  {/* Chat Access Controls */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Chat Settings</h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 mr-2" 
                            defaultChecked 
                            onChange={(e) => {
                              updateMemberProfile(selectedUser.id, { 
                                settings: {
                                  ...selectedUser.settings,
                                  childrenCanUseChat: e.target.checked
                                }
                              });
                            }}
                          />
                          <span>Allow children to use chat with Allie</span>
                        </label>
                        <p className="text-xs text-gray-500 ml-6">
                          When enabled, children can interact with Allie. Disable this if you want to restrict Allie access to parents only.
                        </p>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
                          <p className="flex items-center">
                            <Info size={16} className="mr-2 text-blue-500" />
                            Allie is designed to be kid-friendly and safe for family conversations.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Controls */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Content Controls</h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 mr-2" 
                            defaultChecked 
                          />
                          <div>
                            <span className="font-medium text-sm">Family-Friendly Mode</span>
                            <p className="text-xs text-gray-500">
                              Ensures all content is appropriate for all family members
                            </p>
                          </div>
                        </label>
                        
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 mr-2" 
                            defaultChecked 
                          />
                          <div>
                            <span className="font-medium text-sm">Child Event Privacy</span>
                            <p className="text-xs text-gray-500">
                              Children can only see events relevant to them
                            </p>
                          </div>
                        </label>
                        
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 mr-2" 
                          />
                          <div>
                            <span className="font-medium text-sm">Location Sharing</span>
                            <p className="text-xs text-gray-500">
                              Allow location sharing between family members
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Important Places */}
              {activeCategory === 'locations' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b">
                    <h3 className="text-lg font-semibold mb-1">Important Places</h3>
                    <p className="text-sm text-gray-600">
                      Manage your home and other important locations
                    </p>
                  </div>
                  
                  <LocationsSettingsTab />
                </div>
              )}
              
              {/* Notifications */}
              {activeCategory === 'notifications' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b">
                    <h3 className="text-lg font-semibold mb-1">Notifications</h3>
                    <p className="text-sm text-gray-600">
                      Manage how and when you receive notifications
                    </p>
                  </div>
                  
                  {/* Email Notifications */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Email Notifications</h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">Weekly Family Digest</span>
                            <p className="text-xs text-gray-500">Weekly summary of family activities</p>
                          </div>
                          <input 
                            type="checkbox" 
                            className="h-5 w-10 rounded-full appearance-none bg-gray-300 checked:bg-blue-600 transition-colors duration-200 relative cursor-pointer"
                            defaultChecked
                          />
                        </label>
                        
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">Family Meeting Reminders</span>
                            <p className="text-xs text-gray-500">Notifications about upcoming meetings</p>
                          </div>
                          <input 
                            type="checkbox" 
                            className="h-5 w-10 rounded-full appearance-none bg-gray-300 checked:bg-blue-600 transition-colors duration-200 relative cursor-pointer"
                            defaultChecked
                          />
                        </label>
                        
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">Survey Reminders</span>
                            <p className="text-xs text-gray-500">Notifications about new surveys</p>
                          </div>
                          <input 
                            type="checkbox" 
                            className="h-5 w-10 rounded-full appearance-none bg-gray-300 checked:bg-blue-600 transition-colors duration-200 relative cursor-pointer"
                            defaultChecked
                          />
                        </label>
                        
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">Special Offers</span>
                            <p className="text-xs text-gray-500">Information about new features and promotions</p>
                          </div>
                          <input 
                            type="checkbox" 
                            className="h-5 w-10 rounded-full appearance-none bg-gray-300 checked:bg-blue-600 transition-colors duration-200 relative cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* In-App Notifications */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">In-App Notifications</h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">Calendar Events</span>
                            <p className="text-xs text-gray-500">Notifications for upcoming events</p>
                          </div>
                          <input 
                            type="checkbox" 
                            className="h-5 w-10 rounded-full appearance-none bg-gray-300 checked:bg-blue-600 transition-colors duration-200 relative cursor-pointer"
                            defaultChecked
                          />
                        </label>
                        
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">Task Reminders</span>
                            <p className="text-xs text-gray-500">Notifications for assigned tasks</p>
                          </div>
                          <input 
                            type="checkbox" 
                            className="h-5 w-10 rounded-full appearance-none bg-gray-300 checked:bg-blue-600 transition-colors duration-200 relative cursor-pointer"
                            defaultChecked
                          />
                        </label>
                        
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">Family Chat</span>
                            <p className="text-xs text-gray-500">Notifications for new chat messages</p>
                          </div>
                          <input 
                            type="checkbox" 
                            className="h-5 w-10 rounded-full appearance-none bg-gray-300 checked:bg-blue-600 transition-colors duration-200 relative cursor-pointer"
                            defaultChecked
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Account & Security */}
              {activeCategory === 'account' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b">
                    <h3 className="text-lg font-semibold mb-1">Account & Security</h3>
                    <p className="text-sm text-gray-600">
                      Manage account settings, billing, and security
                    </p>
                  </div>
                  
                  {/* Subscription */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Subscription</h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Family Plan</div>
                          <p className="text-sm text-gray-600">Unlimited access for up to 8 family members</p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">Active</div>
                          <p className="text-sm text-gray-600">Renews Jul 15, 2023</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded flex items-center">
                          <CreditCard size={16} className="mr-1" />
                          Update Payment
                        </button>
                        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded">
                          View Plans
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Account Security */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Security</h4>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="font-medium text-sm">Password</div>
                          <button className="text-sm text-blue-600">Change</button>
                        </div>
                        <div className="text-sm text-gray-600">Last changed 3 months ago</div>
                      </div>
                      
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="font-medium text-sm">Two-Factor Authentication</div>
                          <button className="text-sm text-blue-600">Enable</button>
                        </div>
                        <div className="text-sm text-gray-600">Add an extra layer of security</div>
                      </div>
                      
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="font-medium text-sm">Login History</div>
                          <button className="text-sm text-blue-600">View</button>
                        </div>
                        <div className="text-sm text-gray-600">See recent account activity</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Privacy & Data */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Privacy & Data</h4>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <button className="w-full text-left px-3 py-2 border rounded flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center">
                          <FileText size={18} className="mr-2 text-gray-500" />
                          <span>Privacy Policy</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                      </button>
                      
                      <button className="w-full text-left px-3 py-2 border rounded flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center">
                          <Download size={18} className="mr-2 text-gray-500" />
                          <span>Download Your Data</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                      </button>
                      
                      <button className="w-full text-left px-3 py-2 border rounded flex items-center justify-between hover:bg-gray-50 text-red-600">
                        <div className="flex items-center">
                          <Trash2 size={18} className="mr-2" />
                          <span>Delete Account</span>
                        </div>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    className="w-full py-2 text-center border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    <LogOut size={18} className="mr-2" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
              
              {/* Help & Support */}
              {activeCategory === 'help' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b">
                    <h3 className="text-lg font-semibold mb-1">Help & Support</h3>
                    <p className="text-sm text-gray-600">
                      Get help and learn more about using the app
                    </p>
                  </div>
                  
                  {/* Quick Guidance */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Quick Help</h4>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button className="p-3 border rounded-lg text-left hover:bg-gray-50">
                        <div className="font-medium mb-1 flex items-center">
                          <Calendar size={18} className="mr-2 text-blue-500" />
                          Calendar Setup
                        </div>
                        <p className="text-sm text-gray-600">
                          Learn how to connect and sync calendars
                        </p>
                      </button>
                      
                      <button className="p-3 border rounded-lg text-left hover:bg-gray-50">
                        <div className="font-medium mb-1 flex items-center">
                          <Users size={18} className="mr-2 text-blue-500" />
                          Managing Family Members
                        </div>
                        <p className="text-sm text-gray-600">
                          Add, edit, and manage family members
                        </p>
                      </button>
                      
                      <button className="p-3 border rounded-lg text-left hover:bg-gray-50">
                        <div className="font-medium mb-1 flex items-center">
                          <Bell size={18} className="mr-2 text-blue-500" />
                          Notification Setup
                        </div>
                        <p className="text-sm text-gray-600">
                          Configure notifications to stay updated
                        </p>
                      </button>
                      
                      <button className="p-3 border rounded-lg text-left hover:bg-gray-50">
                        <div className="font-medium mb-1 flex items-center">
                          <Shield size={18} className="mr-2 text-blue-500" />
                          Privacy Settings
                        </div>
                        <p className="text-sm text-gray-600">
                          Control your data and privacy
                        </p>
                      </button>
                    </div>
                  </div>
                  
                  {/* Contact Support */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Contact Support</h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <div className="font-medium text-blue-700 mb-1">Our support team is here to help</div>
                        <p className="text-sm text-blue-600">
                          We typically respond within 24 hours during business days.
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                          <select className="w-full p-2 border rounded">
                            <option>Select a topic</option>
                            <option>Account Help</option>
                            <option>Billing Question</option>
                            <option>Calendar Issue</option>
                            <option>Feature Request</option>
                            <option>Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                          <textarea 
                            className="w-full p-2 border rounded min-h-[100px]" 
                            placeholder="Describe your issue or question..."
                          ></textarea>
                        </div>
                        
                        <button className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                          Send Message
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Version Info */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">About Allie</h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Version</div>
                          <p className="text-sm text-gray-600">1.0.0</p>
                        </div>
                        <button className="text-blue-600 text-sm flex items-center">
                          <RefreshCw size={16} className="mr-1" />
                          Check for Updates
                        </button>
                      </div>
                      
                      <div className="mt-4 text-center text-gray-500 text-sm">
                        <p>Helping families balance responsibilities since 2025.</p>
                        <p className="mt-1">Made with <Heart size={12} className="inline text-red-500" /> for families</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* File Upload Input (hidden) */}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="image-upload"
          onChange={handleImageUpload}
          disabled={isUploading}
        />
      </div>
    </div>
  );
};

export default UserSettingsScreen;