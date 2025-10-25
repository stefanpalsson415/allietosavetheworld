// src/components/user/UserSettingsScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, Mic, Camera, Home, User, Users, Calendar, Download, 
  ChevronDown, ChevronUp, Settings, Globe, Check, Apple, Mail, 
  Copy, Clock, AlertTriangle, Search, Bell, Shield, HelpCircle,
  MapPin, Key, LogOut, LifeBuoy, UserPlus, CreditCard, Heart,
  Save, Edit, Edit2, Info, FileText, RefreshCw, Trash2, ChevronRight,
  BookUser, Brain, Award, Phone
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import DatabaseService from '../../services/DatabaseService';
import EmailIngestService from '../../services/EmailIngestService';
import NotionPlacesTab from '../dashboard/tabs/NotionPlacesTab';
import PasswordResetComponent from '../settings/PasswordResetComponent';
import EnhancedProfileManager from './EnhancedProfileManager';
import EmailSettingsCard from '../settings/EmailSettingsCard';
import PhoneVerificationForm from '../chat/PhoneVerificationForm';
import UserAvatar, { clearUserAvatarCache } from '../common/UserAvatar';
import FamilyAvatar from '../common/FamilyAvatar';
import { clearProfileImageCache } from '../../utils/profileUtils';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import MagicLinkServiceV2 from '../../services/MagicLinkServiceV2';
import SimpleCalendarSync from '../calendar-v2/views/SimpleCalendarSync';
import ProfileBuilderInterview from '../interview/ProfileBuilderInterview';
import BillingManagementPanel from '../billing/BillingManagementPanel';

const UserSettingsScreen = ({ onClose }) => {
  const navigate = useNavigate();
  
  const { 
    selectedUser, 
    familyMembers, 
    familyName,
    familyId,
    familyPicture,
    selectFamilyMember,
    updateMemberProfile, 
    updateFamilyName,
    updateFamilyPicture
  } = useFamily();
  
  const { currentUser, logout, familyData } = useAuth();
  
  // Handle close - use onClose prop if provided, otherwise navigate back
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/dashboard');
    }
  };
  
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
  const [emailHistory, setEmailHistory] = useState([]);
  const [loadingEmail, setLoadingEmail] = useState(true);
  
  // Flag to track settings changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Profile editing state
  const [editingMember, setEditingMember] = useState(null);
  const [showProfileInterview, setShowProfileInterview] = useState(false);

  // Phone verification state
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  
  // Email verification state
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');
  const [userPhone, setUserPhone] = useState(currentUser?.phoneNumber || selectedUser?.phoneNumber || '');
  const [userData, setUserData] = useState(null);

  // Listen for tab switch events
  useEffect(() => {
    const handleTabSwitch = (event) => {
      if (event.detail && event.detail.tab) {
        setActiveCategory(event.detail.tab);
      }
    };
    
    window.addEventListener('switch-settings-tab', handleTabSwitch);
    
    return () => {
      window.removeEventListener('switch-settings-tab', handleTabSwitch);
    };
  }, []);

  // Load user data from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          
          // Prioritize phone data in this order: Firebase Auth > selectedUser > Firestore user doc
          setUserPhone(currentUser?.phoneNumber || selectedUser?.phoneNumber || data.phoneNumber || '');
        } else {
          // If no user doc exists, check selectedUser and Firebase Auth
          setUserPhone(currentUser?.phoneNumber || selectedUser?.phoneNumber || '');
        }
      } catch (error) {
        // On error, still try to set phone from available sources
        setUserPhone(currentUser?.phoneNumber || selectedUser?.phoneNumber || '');
      }
    };
    
    loadUserData();
  }, [currentUser, selectedUser]);

  // Handler for family name update
  const handleFamilyNameUpdate = async () => {
    if (newFamilyName.trim() === '') return;
    
    try {
      await updateFamilyName(newFamilyName);
      // Update document title with family name
      document.title = `${newFamilyName} Family Allie`;
    } catch (error) {
      alert("Failed to update family name. Please try again.");
    }
  };
  
  // Load email settings
  useEffect(() => {
    if (familyId) {
      setLoadingEmail(true);
      
      Promise.all([
        EmailIngestService.getPersonalizedEmailAddress(familyId),
        EmailIngestService.getEmailHistory(familyId, 5)
      ])
        .then(([email, history]) => {
          setFamilyEmail(email);
          setEmailHistory(history);
          setLoadingEmail(false);
        })
        .catch(error => {
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
        
        // Use the member that was selected for upload, not selectedUser
        const memberId = uploadForMember ? uploadForMember.id : selectedUser.id;
        
        // Use Firebase Storage for profile pictures
        const downloadURL = await DatabaseService.uploadProfileImage(memberId, file);
        
        // Update member profile with the Firebase Storage URL
        await updateMemberProfile(memberId, { 
          profilePicture: downloadURL,
          profilePictureUrl: downloadURL  // Also set profilePictureUrl for compatibility
        });
        
        // Clear both avatar caches to force refresh
        clearUserAvatarCache(memberId);
        clearProfileImageCache(memberId);
        
        // Force a re-render by updating state
        setUploadError(null);
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
  
  // Create portal container if it doesn't exist
  useEffect(() => {
    let portalRoot = document.getElementById('modal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'modal-root';
      document.body.appendChild(portalRoot);
    }
  }, []);

  const modalContent = (
    <>
      {/* Overlay with very light tint */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.3)', /* Semi-transparent overlay */
          zIndex: 99998
        }}
        onClick={handleClose} 
      />
      
      {/* Modal */}
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 99999,
          width: '90vw',
          maxWidth: '1800px'
        }}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full h-[85vh] pointer-events-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
          <div className="flex items-center space-x-4">
            {hasUnsavedChanges && (
              <span className="text-sm text-amber-600 flex items-center">
                <AlertTriangle size={16} className="mr-1" />
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-80 border-r bg-gray-50 overflow-y-auto">
            {/* Search settings */}
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                />
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>
            
            {/* Settings categories */}
            <nav className="p-3">
              <ul className="space-y-1">
                {filterSettingsBySearch(searchQuery).map(category => (
                  <li key={category.id}>
                    <button
                      onClick={() => {
                        setActiveCategory(category.id);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center transition-all ${
                        activeCategory === category.id 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className={`mr-3 ${activeCategory === category.id ? 'text-blue-600' : 'text-gray-400'}`}>
                        {category.icon}
                      </span>
                      <span>{category.label}</span>
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
          <div className="flex-1 overflow-y-auto bg-white">
            {/* Content varies based on active category */}
            <div className={activeCategory === 'locations' ? '' : activeCategory === 'discovery' ? 'p-8 h-full' : 'p-8'}>
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
                          <div className="border-2 border-gray-200 rounded-xl">
                            <FamilyAvatar 
                              familyName={familyName}
                              familyPicture={familyPicture}
                              size={128}
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
                        
                      </div>
                    </div>
                  </div>
                  
                  {/* Family Email Settings */}
                  <EmailSettingsCard familyId={familyId} familyName={familyName} />
                  
                  {/* Family Members - Unified Section */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Users size={20} className="mr-2" />
                            Family Member Profiles
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">Manage profiles and preferences for each family member</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <Check size={16} className="mr-1" />
                            Active
                          </div>
                          <button className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm flex items-center gap-2 text-sm font-medium">
                            <UserPlus size={18} />
                            Add Member
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Info Box */}
                    <div className="px-6 pt-4">
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <Info size={16} className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                          <p className="text-sm text-blue-800">
                            Family profiles help Allie provide personalized assistance based on your family's unique needs and preferences.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {familyMembers.map(member => (
                          <motion.div
                            key={member.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100"
                            onClick={() => setEditingMember(member)}
                          >
                            {/* Status indicator */}
                            <div className="absolute top-3 right-3">
                              <div className={`w-2 h-2 rounded-full ${member.completed ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`} />
                            </div>
                            
                            {/* Profile content */}
                            <div className="flex flex-col items-center text-center">
                              <div className="relative mb-4 group">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white shadow-md">
                                  <UserAvatar 
                                    user={member} 
                                    size={96} 
                                    className="w-full h-full"
                                    key={`avatar-${member.id}-${member.profilePicture || member.profilePictureUrl || Date.now()}`}
                                  />
                                </div>
                                <button
                                  className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadType('profile');
                                    setUploadForMember(member);
                                    document.getElementById('image-upload').click();
                                  }}
                                >
                                  <div className="bg-white rounded-full p-2 shadow-lg">
                                    <Camera size={20} className="text-gray-700" />
                                  </div>
                                </button>
                                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Edit2 size={14} className="text-gray-600" />
                                </div>
                              </div>
                              
                              <h5 className="font-semibold text-gray-900 mb-1">{member.name}</h5>
                              <p className="text-sm text-gray-600 capitalize mb-2">{member.role}</p>
                              
                              {/* Survey Status */}
                              <div className="text-xs mb-3">
                                {member.completed ? (
                                  <span className="flex items-center justify-center text-green-600">
                                    <Check size={12} className="mr-1" />
                                    Survey completed
                                  </span>
                                ) : (
                                  <span className="text-amber-600">Survey pending</span>
                                )}
                              </div>
                              
                              {/* Progress bar */}
                              <div className="w-full">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-gray-500">Profile</span>
                                  <span className="text-xs font-medium text-gray-700">{member.profileCompleteness || 0}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                                    style={{ width: `${member.profileCompleteness || 0}%` }}
                                  />
                                </div>
                              </div>
                              
                              {/* Quick actions */}
                              <button className="mt-4 w-full px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                <Edit2 size={14} />
                                Edit Profile
                              </button>
                            </div>
                          </motion.div>
                        ))}
                        
                        {/* Add new member card - Bigger and clearer */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-indigo-300 flex flex-col items-center justify-center min-h-[280px] group"
                          onClick={() => {
                            // TODO: Implement add new member functionality
                          }}
                        >
                          <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <UserPlus size={32} className="text-indigo-600" />
                          </div>
                          <p className="text-lg font-semibold text-gray-800 mb-1">Add Family Member</p>
                          <p className="text-sm text-gray-600 text-center">Click to add a new member to your family</p>
                        </motion.div>
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
                            <UserAvatar 
                              user={selectedUser} 
                              size={128} 
                              className="w-full h-full"
                              key={`avatar-${selectedUser?.id}-${selectedUser?.profilePicture || selectedUser?.profilePictureUrl || Date.now()}`}
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
                          {(() => {
                            const email = selectedUser?.email || currentUser?.email || '';
                            const isFakeEmail = email.endsWith('.family');
                            const isVerified = (currentUser?.emailVerified || familyData?.emailVerified) && !isFakeEmail;
                            
                            if (isFakeEmail) {
                              return (
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                  <p className="text-sm text-yellow-800 mb-2">Please add and confirm an email address</p>
                                  <button
                                    onClick={() => {
                                      // Switch to account settings tab to show email verification
                                      setActiveCategory('account');
                                    }}
                                    className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                                  >
                                    Add Email
                                  </button>
                                </div>
                              );
                            }
                            
                            return (
                              <>
                                <input
                                  type="email"
                                  className="w-full p-2 border rounded bg-gray-50"
                                  value={email}
                                  readOnly
                                />
                                {isVerified && (
                                  <div className="flex items-center mt-1">
                                    <Check size={14} className="text-green-600 mr-1" />
                                    <span className="text-xs text-green-600">Verified</span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone Verification */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b flex items-center justify-between">
                      <div className="flex items-center">
                        <Phone size={20} className="text-green-600 mr-2" />
                        <h4 className="font-medium">Phone Number</h4>
                      </div>
                      {(userPhone || currentUser?.phoneNumber || selectedUser?.phoneVerified || userData?.phoneVerified) && (
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium flex items-center">
                          <Check size={12} className="mr-1" />
                          Verified
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      {!(userData?.phoneVerified || (userPhone && userData?.phoneNumber === userPhone) || currentUser?.phoneNumber || selectedUser?.phoneVerified) && (
                        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 mb-4">
                          <Info size={16} className="inline mr-1" />
                          Add your phone number to receive SMS messages from Allie. You can text Allie directly or send photos!
                        </div>
                      )}
                      
                      {(userData?.phoneVerified || (userPhone && userData?.phoneNumber === userPhone) || currentUser?.phoneNumber || selectedUser?.phoneVerified) ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Verified Phone Number</label>
                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center">
                                <Check className="w-5 h-5 text-green-600 mr-2" />
                                <span className="font-medium">{userPhone || currentUser?.phoneNumber || selectedUser?.phoneNumber}</span>
                              </div>
                              <button
                                onClick={() => setShowPhoneVerification(true)}
                                className="text-sm text-blue-600 hover:text-blue-700"
                              >
                                Change
                              </button>
                            </div>
                          </div>
                          
                          <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
                            <p className="flex items-center">
                              <Check size={16} className="mr-2" />
                              You can now text Allie at this number!
                            </p>
                            <p className="text-xs mt-1 text-green-600">
                              Try texting "Remind me to pick up groceries" or send a photo of a flyer.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                              <span className="text-gray-500">
                                {userPhone || currentUser?.phoneNumber || selectedUser?.phoneNumber || userData?.phoneNumber || 'No phone number added'}
                              </span>
                              <button
                                onClick={() => setShowPhoneVerification(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                              >
                                <Phone size={16} />
                                {userPhone || currentUser?.phoneNumber || selectedUser?.phoneNumber || userData?.phoneNumber ? 'Verify' : 'Add Phone'}
                              </button>
                            </div>
                          </div>
                          
                          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700">
                            <p className="flex items-center">
                              <AlertTriangle size={16} className="mr-2" />
                              Phone verification required for SMS features
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Family Preferences from Onboarding */}
                  {familyData && (familyData.priorities || familyData.communication || familyData.aiPreferences) && (
                    <div className="bg-white rounded-lg border">
                      <div className="p-4 border-b flex items-center justify-between">
                        <div className="flex items-center">
                          <Heart size={20} className="text-purple-600 mr-2" />
                          <h4 className="font-medium">Family Preferences</h4>
                        </div>
                        <span className="text-xs text-gray-500">From onboarding</span>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        {/* Priorities */}
                        {familyData.priorities && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Family Priorities</h5>
                            <div className="space-y-2">
                              {familyData.priorities.highestPriority && (
                                <div className="flex items-center text-sm">
                                  <span className="mr-2">🥇</span>
                                  <span className="text-gray-600">Top Priority:</span>
                                  <span className="ml-2 font-medium text-gray-800">{familyData.priorities.highestPriority}</span>
                                </div>
                              )}
                              {familyData.priorities.secondaryPriority && (
                                <div className="flex items-center text-sm">
                                  <span className="mr-2">🥈</span>
                                  <span className="text-gray-600">Secondary:</span>
                                  <span className="ml-2 font-medium text-gray-800">{familyData.priorities.secondaryPriority}</span>
                                </div>
                              )}
                              {familyData.priorities.tertiaryPriority && (
                                <div className="flex items-center text-sm">
                                  <span className="mr-2">🥉</span>
                                  <span className="text-gray-600">Also Important:</span>
                                  <span className="ml-2 font-medium text-gray-800">{familyData.priorities.tertiaryPriority}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Communication Style */}
                        {familyData.communication && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Communication</h5>
                            {familyData.communication.style && (
                              <div className="text-sm">
                                <span className="text-gray-600">Style:</span>
                                <span className="ml-2 font-medium text-gray-800 capitalize">{familyData.communication.style}</span>
                              </div>
                            )}
                            {familyData.communication.challengeAreas && familyData.communication.challengeAreas.length > 0 && (
                              <div className="mt-2">
                                <span className="text-sm text-gray-600">Challenge Areas:</span>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {familyData.communication.challengeAreas.map((area, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                      {area}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* AI Preferences */}
                        {familyData.aiPreferences && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">AI Assistant Preferences</h5>
                            <div className="space-y-1">
                              {familyData.aiPreferences.style && (
                                <div className="text-sm">
                                  <span className="text-gray-600">Style:</span>
                                  <span className="ml-2 font-medium text-gray-800 capitalize">{familyData.aiPreferences.style}</span>
                                </div>
                              )}
                              {familyData.aiPreferences.length && (
                                <div className="text-sm">
                                  <span className="text-gray-600">Response Length:</span>
                                  <span className="ml-2 font-medium text-gray-800 capitalize">{familyData.aiPreferences.length}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Meeting Preferences */}
                        {familyData.preferences && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Meeting Preferences</h5>
                            <div className="space-y-1">
                              {familyData.preferences.reminderFrequency && (
                                <div className="text-sm">
                                  <span className="text-gray-600">Reminder Frequency:</span>
                                  <span className="ml-2 font-medium text-gray-800 capitalize">{familyData.preferences.reminderFrequency}</span>
                                </div>
                              )}
                              {familyData.preferences.meetingDay && (
                                <div className="text-sm">
                                  <span className="text-gray-600">Preferred Day:</span>
                                  <span className="ml-2 font-medium text-gray-800">{familyData.preferences.meetingDay}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Profile Management */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b flex items-center justify-between">
                      <div className="flex items-center">
                        <BookUser size={20} className="text-blue-600 mr-2" />
                        <h4 className="font-medium">Enhanced Profile</h4>
                      </div>
                      <div className="flex items-center text-sm text-blue-600">
                        <Brain size={16} className="mr-1" />
                        <span>Personalized Experience</span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <div className="flex items-start">
                          <Info size={18} className="text-blue-600 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm text-blue-800 font-medium">
                              What are Enhanced Profiles?
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Enhanced profiles help Allie understand your preferences, routines, and important life events 
                              to provide personalized assistance. The more information you provide, the better Allie can 
                              help with your specific family needs.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {selectedUser?.id ? (
                        <button
                          onClick={() => setShowProfileInterview(true)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-center font-medium"
                        >
                          Start Profile Interview 🎤
                        </button>
                      ) : null}
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
                  
                  {/* Navigation Tab Preferences */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Navigation Tabs</h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="text-sm text-gray-600 mb-3">
                        Show or hide navigation tabs to customize your dashboard
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-lg mb-4 text-xs text-blue-700">
                        <p className="flex items-start">
                          <Info size={14} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          Hide tabs you don't use often to simplify your dashboard navigation. Changes take effect immediately.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Beta Features Header */}
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Beta Features</div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm flex items-center">
                              Strong Relationship
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">beta</span>
                            </div>
                            <div className="text-xs text-gray-500">Show relationship tab in navigation</div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input
                              type="checkbox"
                              name="showRelationshipTab"
                              id="showRelationshipTab"
                              defaultChecked={selectedUser?.settings?.showRelationshipTab !== false}
                              onChange={(e) => {
                                // Save to user preferences in database
                                updateMemberProfile(selectedUser.id, { 
                                  settings: {
                                    ...selectedUser.settings,
                                    showRelationshipTab: e.target.checked
                                  }
                                });
                                // Also update localStorage for immediate effect
                                localStorage.setItem('showRelationshipTab', e.target.checked ? 'true' : 'false');
                              }}
                              className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label
                              htmlFor="showRelationshipTab"
                              className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                            ></label>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm flex items-center">
                              Task Sequences
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">beta</span>
                            </div>
                            <div className="text-xs text-gray-500">Show task sequences tab in navigation</div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input
                              type="checkbox"
                              name="showTaskSequencesTab"
                              id="showTaskSequencesTab"
                              defaultChecked={selectedUser?.settings?.showTaskSequencesTab !== false}
                              onChange={(e) => {
                                // Save to user preferences in database
                                updateMemberProfile(selectedUser.id, { 
                                  settings: {
                                    ...selectedUser.settings,
                                    showTaskSequencesTab: e.target.checked
                                  }
                                });
                                // Also update localStorage for immediate effect
                                localStorage.setItem('showTaskSequencesTab', e.target.checked ? 'true' : 'false');
                              }}
                              className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label
                              htmlFor="showTaskSequencesTab"
                              className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                            ></label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm flex items-center">
                              Family Tree
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">beta</span>
                            </div>
                            <div className="text-xs text-gray-500">Show family tree tab in navigation</div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input
                              type="checkbox"
                              name="showFamilyTreeTab"
                              id="showFamilyTreeTab"
                              defaultChecked={selectedUser?.settings?.showFamilyTreeTab !== false}
                              onChange={(e) => {
                                updateMemberProfile(selectedUser.id, {
                                  settings: {
                                    ...selectedUser.settings,
                                    showFamilyTreeTab: e.target.checked
                                  }
                                });
                                localStorage.setItem('showFamilyTreeTab', e.target.checked ? 'true' : 'false');
                              }}
                              className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label
                              htmlFor="showFamilyTreeTab"
                              className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                            ></label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm flex items-center">
                              Sibling Dynamics
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">beta</span>
                            </div>
                            <div className="text-xs text-gray-500">Show sibling dynamics tab in navigation</div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input
                              type="checkbox"
                              name="showSiblingDynamicsTab"
                              id="showSiblingDynamicsTab"
                              defaultChecked={selectedUser?.settings?.showSiblingDynamicsTab !== false}
                              onChange={(e) => {
                                updateMemberProfile(selectedUser.id, {
                                  settings: {
                                    ...selectedUser.settings,
                                    showSiblingDynamicsTab: e.target.checked
                                  }
                                });
                                localStorage.setItem('showSiblingDynamicsTab', e.target.checked ? 'true' : 'false');
                              }}
                              className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label
                              htmlFor="showSiblingDynamicsTab"
                              className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                            ></label>
                          </div>
                        </div>

                        {/* Special Features Section */}
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">Special Features</div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">Wardrobe Wizard</div>
                            <div className="text-xs text-gray-500">Show wardrobe wizard in navigation</div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input
                              type="checkbox"
                              name="showWardrobeTab"
                              id="showWardrobeTab"
                              defaultChecked={selectedUser?.settings?.showWardrobeTab !== false}
                              onChange={(e) => {
                                updateMemberProfile(selectedUser.id, {
                                  settings: {
                                    ...selectedUser.settings,
                                    showWardrobeTab: e.target.checked
                                  }
                                });
                                localStorage.setItem('showWardrobeTab', e.target.checked ? 'true' : 'false');
                              }}
                              className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label
                              htmlFor="showWardrobeTab"
                              className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                            ></label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">Gift Wishes</div>
                            <div className="text-xs text-gray-500">Show gift wishes tab in navigation</div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input
                              type="checkbox"
                              name="showGiftWishesTab"
                              id="showGiftWishesTab"
                              defaultChecked={selectedUser?.settings?.showGiftWishesTab !== false}
                              onChange={(e) => {
                                updateMemberProfile(selectedUser.id, {
                                  settings: {
                                    ...selectedUser.settings,
                                    showGiftWishesTab: e.target.checked
                                  }
                                });
                                localStorage.setItem('showGiftWishesTab', e.target.checked ? 'true' : 'false');
                              }}
                              className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label
                              htmlFor="showGiftWishesTab"
                              className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                            ></label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">Habit Helper</div>
                            <div className="text-xs text-gray-500">Show habit helper tab in navigation</div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input
                              type="checkbox"
                              name="showHabitHelperTab"
                              id="showHabitHelperTab"
                              defaultChecked={selectedUser?.settings?.showHabitHelperTab !== false}
                              onChange={(e) => {
                                updateMemberProfile(selectedUser.id, {
                                  settings: {
                                    ...selectedUser.settings,
                                    showHabitHelperTab: e.target.checked
                                  }
                                });
                                localStorage.setItem('showHabitHelperTab', e.target.checked ? 'true' : 'false');
                              }}
                              className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label
                              htmlFor="showHabitHelperTab"
                              className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                            ></label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">Knowledge Graph</div>
                            <div className="text-xs text-gray-500">Show knowledge graph tab in navigation</div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input
                              type="checkbox"
                              name="showKnowledgeGraphTab"
                              id="showKnowledgeGraphTab"
                              defaultChecked={selectedUser?.settings?.showKnowledgeGraphTab !== false}
                              onChange={(e) => {
                                updateMemberProfile(selectedUser.id, {
                                  settings: {
                                    ...selectedUser.settings,
                                    showKnowledgeGraphTab: e.target.checked
                                  }
                                });
                                localStorage.setItem('showKnowledgeGraphTab', e.target.checked ? 'true' : 'false');
                              }}
                              className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label
                              htmlFor="showKnowledgeGraphTab"
                              className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                            ></label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">Co-Ownership</div>
                            <div className="text-xs text-gray-500">Show co-ownership tab in navigation</div>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input
                              type="checkbox"
                              name="showCoOwnershipTab"
                              id="showCoOwnershipTab"
                              defaultChecked={selectedUser?.settings?.showCoOwnershipTab === true}
                              onChange={(e) => {
                                updateMemberProfile(selectedUser.id, {
                                  settings: {
                                    ...selectedUser.settings,
                                    showCoOwnershipTab: e.target.checked
                                  }
                                });
                                localStorage.setItem('showCoOwnershipTab', e.target.checked ? 'true' : 'false');
                              }}
                              className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label
                              htmlFor="showCoOwnershipTab"
                              className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                            ></label>
                          </div>
                        </div>
                      </div>
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

                  {/* Google Calendar Sync */}
                  <SimpleCalendarSync embedded={true} />

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
                  </div>
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
                <NotionPlacesTab />
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
                  
                  {/* SMS Notifications */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">SMS Notifications</h4>
                    </div>
                    
                    <div className="p-4">
                      {userData?.phoneVerified ? (
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-sm">Habit Reminders</span>
                              <p className="text-xs text-gray-500">Text reminders before scheduled habit times</p>
                            </div>
                            <input 
                              type="checkbox" 
                              className="h-5 w-10 rounded-full appearance-none bg-gray-300 checked:bg-blue-600 transition-colors duration-200 relative cursor-pointer"
                              defaultChecked
                              onChange={async (e) => {
                                try {
                                  const prefsRef = doc(db, 'users', currentUser.uid, 'preferences', 'notifications');
                                  await setDoc(prefsRef, {
                                    sms: {
                                      habitReminders: e.target.checked,
                                      updatedAt: serverTimestamp()
                                    }
                                  }, { merge: true });
                                } catch (error) {
                                }
                              }}
                            />
                          </label>
                          
                          <label className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-sm">Event Reminders</span>
                              <p className="text-xs text-gray-500">Text reminders for calendar events</p>
                            </div>
                            <input 
                              type="checkbox" 
                              className="h-5 w-10 rounded-full appearance-none bg-gray-300 checked:bg-blue-600 transition-colors duration-200 relative cursor-pointer"
                            />
                          </label>
                          
                          <label className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-sm">Task Reminders</span>
                              <p className="text-xs text-gray-500">Text reminders for overdue tasks</p>
                            </div>
                            <input 
                              type="checkbox" 
                              className="h-5 w-10 rounded-full appearance-none bg-gray-300 checked:bg-blue-600 transition-colors duration-200 relative cursor-pointer"
                            />
                          </label>
                          
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-gray-500">
                              Your phone: {userData?.phoneNumber || userPhone}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Phone size={48} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-sm text-gray-600 mb-3">
                            Verify your phone number to receive SMS notifications
                          </p>
                          <button
                            onClick={() => setActiveCategory('personal')}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Go to Personal Settings →
                          </button>
                        </div>
                      )}
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
                  
                  {/* Billing & Subscription Management */}
                  <BillingManagementPanel />
                  
                  {/* Email Verification */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Email Address</h4>
                    </div>
                    
                    <div className="p-4">
                      {(() => {
                        const email = selectedUser?.email || currentUser?.email || '';
                        const isFakeEmail = email.endsWith('.family');
                        const isVerified = (currentUser?.emailVerified || familyData?.emailVerified) && !isFakeEmail;
                        
                        if (isFakeEmail || !email) {
                          return (
                            <div>
                              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                                <div className="flex items-start">
                                  <AlertTriangle className="text-yellow-600 mr-2 mt-0.5" size={18} />
                                  <div>
                                    <p className="text-sm font-medium text-yellow-800">
                                      No verified email address
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                      Add and verify your email to enable email notifications and account recovery.
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                  </label>
                                  <input
                                    type="email"
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="your.email@example.com"
                                    value={verificationEmail}
                                    onChange={(e) => setVerificationEmail(e.target.value)}
                                  />
                                </div>
                                
                                {emailVerificationMessage && (
                                  <div className={`p-3 rounded-lg text-sm ${
                                    emailVerificationMessage.includes('sent') 
                                      ? 'bg-green-50 text-green-700 border border-green-200' 
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                  }`}>
                                    {emailVerificationMessage}
                                  </div>
                                )}
                                
                                <button 
                                  className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                  disabled={!verificationEmail || isVerifyingEmail}
                                  onClick={async () => {
                                    setIsVerifyingEmail(true);
                                    setEmailVerificationMessage('');
                                    
                                    try {
                                      // Use existing MagicLinkServiceV2 to send verification email
                                      const result = await MagicLinkServiceV2.sendMagicLink(verificationEmail);
                                      
                                      if (result.success) {
                                        setEmailVerificationMessage(`Verification email sent to ${verificationEmail}. Please check your inbox and click the link to verify.`);
                                        
                                        // Update user's email in Firestore
                                        if (currentUser?.uid) {
                                          await updateDoc(doc(db, 'users', currentUser.uid), {
                                            pendingEmail: verificationEmail,
                                            emailUpdateRequested: new Date()
                                          });
                                        }
                                      } else {
                                        setEmailVerificationMessage(result.error || 'Failed to send verification email.');
                                      }
                                    } catch (error) {
                                      setEmailVerificationMessage('Failed to send verification email. Please try again.');
                                    } finally {
                                      setIsVerifyingEmail(false);
                                    }
                                  }}
                                >
                                  {isVerifyingEmail ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                      Sending...
                                    </>
                                  ) : (
                                    'Send Verification Email'
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div>
                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center">
                                <Check className="w-5 h-5 text-green-600 mr-2" />
                                <div>
                                  <span className="font-medium">{email}</span>
                                  <p className="text-xs text-green-600">Verified</p>
                                </div>
                              </div>
                              <button className="text-sm text-blue-600 hover:text-blue-700">
                                Change Email
                              </button>
                            </div>
                            
                            <div className="mt-3 text-sm text-gray-600">
                              <p>This email is used for:</p>
                              <ul className="list-disc list-inside mt-1 space-y-0.5">
                                <li>Account notifications</li>
                                <li>Password recovery</li>
                                <li>Security alerts</li>
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
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
        
        {/* Enhanced Profile Manager Modal */}
        {editingMember && (
          <EnhancedProfileManager
            memberId={editingMember.id}
            onUpdate={() => {
              setEditingMember(null);
              // The family context will automatically update
            }}
          />
        )}

        {/* Profile Builder Interview Modal */}
        {showProfileInterview && (
          <ProfileBuilderInterview
            onClose={() => setShowProfileInterview(false)}
            onComplete={() => {
              setShowProfileInterview(false);
              // Reload to show updated profile status
              window.location.reload();
            }}
          />
        )}
        
        {/* Phone Verification Modal */}
        {showPhoneVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[80] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <PhoneVerificationForm
                onVerified={async (phoneNumber) => {
                  setUserPhone(phoneNumber);
                  setShowPhoneVerification(false);
                  
                  // Reload user data from Firestore
                  if (currentUser?.uid) {
                    try {
                      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                      if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData(data);
                        setUserPhone(data.phoneNumber || '');
                      }
                    } catch (error) {
                    }
                  }
                }}
                onCancel={() => setShowPhoneVerification(false)}
              />
            </div>
          </div>
        )}
        </motion.div>
      </div>
    </>
  );

  // Render through portal
  const portalRoot = document.getElementById('modal-root');
  return portalRoot ? ReactDOM.createPortal(modalContent, portalRoot) : null;
};

export default UserSettingsScreen;