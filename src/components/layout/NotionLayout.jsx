// src/components/layout/NotionLayout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Home, Inbox, Settings, FileText, Trash2, Users,
  X, Command, Plus, ChevronDown, ChevronRight, Calendar, MessageSquare,
  Layers, Heart, AlertCircle, Gift, Database, User, Mail,
  CheckCircle, CheckSquare, Award, Star, DollarSign, Sparkles,
  FolderOpen, ClipboardList, Shirt, Package, Trees, Brain
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUnifiedEvent } from '../../contexts/UnifiedEventContext';
import { ChatDrawerProvider, useChatDrawer } from '../../contexts/ChatDrawerContext';
import ChatButton from '../chat/ChatButton';
import UserAvatar from '../common/UserAvatar';
import ConfirmationDialog from '../common/ConfirmationDialog';
import NotificationBell from '../common/NotificationBell';
import BucksService from '../../services/BucksService';
import FamilyDiscoveryDrawer from '../interview/FamilyDiscoveryDrawer';

// Inner component that has access to ChatDrawer context
const NotionLayoutInner = ({ children, title }) => {
  const { selectedUser, familyMembers, familyName, selectFamilyMember } = useFamily();
  const { logout, setSelectedFamilyMember } = useAuth();
  const { isOpen: isChatOpen, toggleDrawer } = useChatDrawer();
  const { openEventParser } = useUnifiedEvent();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [userToSwitchTo, setUserToSwitchTo] = useState(null);
  const [localSelectedUser, setLocalSelectedUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [bucksBalance, setBucksBalance] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [chatDrawerWidth, setChatDrawerWidth] = useState(0);
  
  // When selectedUser from context changes, update local state
  useEffect(() => {
    if (selectedUser) {
      setLocalSelectedUser(selectedUser);
    }
  }, [selectedUser]);
  
  // Listen for chat drawer resize events
  useEffect(() => {
    const handleChatDrawerResize = (event) => {
      const { width, isOpen } = event.detail;
      setChatDrawerWidth(isOpen ? width : 0);
    };
    
    window.addEventListener('chat-drawer-resize', handleChatDrawerResize);
    
    // Set initial state - always start at 0 to prevent white space
    setChatDrawerWidth(0);
    
    return () => {
      window.removeEventListener('chat-drawer-resize', handleChatDrawerResize);
    };
  }, []);
  
  // Fetch bucks balance for children
  useEffect(() => {
    if (selectedUser?.role === 'child' && selectedUser?.id) {
      const fetchBalance = async () => {
        try {
          const balanceData = await BucksService.getBalance(selectedUser.id);
          setBucksBalance(balanceData.currentBalance || 0);
        } catch (error) {
          console.error('Error fetching bucks balance:', error);
          setBucksBalance(0);
        }
      };
      
      fetchBalance();
      
      // Refresh balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);
  
  // No chat state management needed - it's handled by the injected panel
  
  // Handle keyboard shortcuts and click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command palette shortcut (Cmd+K or Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      
      // Close command palette on Escape
      if (e.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
      }
    };
    
    const handleClickOutside = (e) => {
      // Close user dropdown when clicking outside
      if (showUserDropdown && !e.target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCommandPalette, showUserDropdown]);
  
  // Check if family has completed initial setup
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);
  const [hasProfilePhotos, setHasProfilePhotos] = useState(false);
  
  useEffect(() => {
    // Check if any family member has completed survey
    const surveyCompleted = familyMembers?.some(member => 
      member.completed || member.surveyCompleted || member.initialSurveyCompleted
    );
    setHasCompletedSurvey(surveyCompleted);
    
    // Check if any family member has profile photo
    const hasPhotos = familyMembers?.some(member => member.profilePictureUrl);
    setHasProfilePhotos(hasPhotos);
  }, [familyMembers]);
  
  // Check tab visibility settings
  const isTabVisible = (tabKey) => {
    // First check localStorage for immediate effect
    const localStorageValue = localStorage.getItem(tabKey);
    if (localStorageValue !== null) {
      return localStorageValue === 'true';
    }
    // Fall back to user settings, default to FALSE (OFF) if not set for new families
    return selectedUser?.settings?.[tabKey] === true;
  };

  // Navigation items
  const navigationItems = [
    { name: 'Home', icon: <Home size={18} />, path: '/dashboard?tab=home' },
    { name: 'Balance & Habits', icon: <FileText size={18} />, path: '/dashboard?tab=tasks', requiresData: true },
    { name: 'Task Board', icon: <CheckSquare size={18} />, path: '/dashboard?tab=taskboard', requiresData: true },
    { name: 'Family Dashboard', icon: <Inbox size={18} />, path: '/dashboard?tab=dashboard', requiresData: true },
    { name: 'Family Calendar', icon: <Calendar size={18} />, path: '/dashboard?tab=calendar' },
    { name: 'Document Hub', icon: <FolderOpen size={18} />, path: '/dashboard?tab=documents' },
    { name: 'Knowledge Graph', icon: <Layers size={18} />, path: '/dashboard?tab=knowledge', requiresData: true, visibilityKey: 'showKnowledgeGraphTab' },
    { name: 'Co-Ownership', icon: <Users size={18} />, path: '/dashboard?tab=coownership', requiresData: true, visibilityKey: 'showCoOwnershipTab' },
    { name: 'Allie Chat', icon: <Mail size={18} />, path: '/dashboard?tab=chat' },
    // Parent-only admin panel
    {
      name: 'Kids Section Admin',
      icon: <Sparkles size={18} className="text-amber-500" />,
      path: '/dashboard?tab=chore-admin',
      isParentOnly: true
    },
    // Beta features
    { name: 'Strong Relationship', icon: <Heart size={18} />, path: '/dashboard?tab=relationship', isBeta: true, requiresData: true, visibilityKey: 'showRelationshipTab' },
    { name: 'Task Sequences', icon: <Layers size={18} />, path: '/dashboard?tab=sequences', isBeta: true, requiresData: true, visibilityKey: 'showTaskSequencesTab' },
    { name: 'Family Tree', icon: <Trees size={18} />, path: '/dashboard?tab=family-tree', isBeta: true, requiresData: true, visibilityKey: 'showFamilyTreeTab' },
    { name: 'Sibling Dynamics', icon: <Users size={18} />, path: '/dashboard?tab=siblings', isBeta: true, requiresData: true, visibilityKey: 'showSiblingDynamicsTab' },
    // New kid-friendly items with larger icons
    { 
      name: 'Chore Chart', 
      icon: <CheckSquare size={24} className="text-blue-500" />, 
      path: '/dashboard?tab=chores',
      isKidFriendly: true,
      requiresData: true 
    },
    { 
      name: 'Reward Party', 
      icon: <Award size={24} className="text-purple-500" />, 
      path: '/dashboard?tab=rewards',
      isKidFriendly: true,
      requiresData: true 
    },
    { 
      name: 'My Palsson Bucks', 
      icon: <DollarSign size={24} className="text-green-500" />, 
      path: '/dashboard?tab=bucks',
      isKidFriendly: true,
      requiresData: true 
    },
    {
      name: 'Wardrobe Wizard',
      icon: <Shirt size={24} className="text-indigo-500" />,
      path: '/dashboard?tab=wardrobe',
      isKidFriendly: true,
      requiresData: true,
      visibilityKey: 'showWardrobeTab'
    },
    {
      name: 'Gift Wishes',
      icon: <Package size={24} className="text-pink-500" />,
      path: '/dashboard?tab=gifts',
      isKidFriendly: true,
      requiresData: true,
      visibilityKey: 'showGiftWishesTab'
    },
    {
      name: 'Habit Helper',
      icon: <Users size={24} className="text-teal-500" />,
      path: '/dashboard?tab=habit-helper',
      isKidFriendly: true,
      requiresData: true,
      visibilityKey: 'showHabitHelperTab'
    },
  ];
  
  // Settings and account items
  const settingsItems = [
    { name: 'Settings', icon: <Settings size={18} />, action: () => {
      // Check if we're on the dashboard
      if (location.pathname === '/dashboard') {
        window.dispatchEvent(new CustomEvent('open-settings-modal'));
      } else {
        navigate('/user/settings');
      }
    }},
    { name: 'Logout', icon: <Trash2 size={18} />, action: () => logout() },
  ];
  
  // Get current page from URL
  const getCurrentPage = () => {
    const path = location.pathname;
    const tab = new URLSearchParams(location.search).get('tab');
    
    if (path === '/dashboard') {
      if (tab === 'home') return 'Home';
      if (tab === 'survey') return 'Survey';
      if (tab === 'tasks') return 'Balance & Habits';
      if (tab === 'dashboard') return 'Family Dashboard';
      if (tab === 'calendar') return 'Family Calendar';
      if (tab === 'documents') return 'Document Hub';
      if (tab === 'taskboard') return 'Task Board';
      if (tab === 'knowledge') return 'Knowledge Graph';
      if (tab === 'coownership') return 'Co-Ownership';
      if (tab === 'relationship') return 'Strong Relationship';
      if (tab === 'sequences') return 'Task Sequences';
      if (tab === 'family-tree') return 'Family Tree';
      if (tab === 'workload-balance') return 'Workload Balance';
      if (tab === 'chat') return 'Allie Chat';
      // Parent-only admin page
      if (tab === 'chore-admin') return 'Kids Section Admin';
      // Kid-friendly pages
      if (tab === 'chores') return 'Chore Chart';
      if (tab === 'rewards') return 'Reward Party';
      if (tab === 'bucks') return 'My Palsson Bucks';
      if (tab === 'wardrobe') return 'Wardrobe Wizard';
      if (tab === 'gifts') return 'Gift Wishes';
      if (tab === 'habit-helper') return 'Habit Helper';
      return 'Home';
    }
    
    return 'Home';
  };
  
  // Handle user switching
  const handleUserSwitch = (member) => {
    // If clicking on already selected user, do nothing
    if (selectedUser && member.id === selectedUser.id) return;
    
    // Set the user to switch to and open the confirmation dialog
    setUserToSwitchTo(member);
    setSwitchDialogOpen(true);
  };
  
  // Confirm user switch
  const confirmUserSwitch = async () => {
    if (!userToSwitchTo) return;
    
    try {
      // Close dialog first to prevent UI freeze
      setSwitchDialogOpen(false);
      
      // Store user info before switching
      const userToSwitch = {...userToSwitchTo}; // Clone to avoid any reference issues
      const userToSwitchId = userToSwitch.id;
      const userName = userToSwitch.name;
      
      console.log(`Switching to user: ${userName} (${userToSwitchId})`);
      
      // Update local UI state immediately for responsive feedback
      setLocalSelectedUser(userToSwitch);
      
      // Clean up dialog state
      setUserToSwitchTo(null);
      
      // First update in local storage directly (fallback mechanism)
      localStorage.setItem('selectedUserId', userToSwitchId);
      
      // Then update in Family context (doesn't require async wait)
      selectFamilyMember(userToSwitch);
      
      // Lastly, try to update in Auth context (but don't wait for it)
      // Run this in a timeout to avoid blocking the UI
      setTimeout(() => {
        setSelectedFamilyMember(userToSwitchId)
          .then(() => {
            console.log("User switch completed successfully in Auth context");
          })
          .catch(error => {
            console.error("Error in Auth context update (but switch still happened in UI):", error);
          });
      }, 100);
    } catch (error) {
      console.error("Error switching user:", error);
      setSwitchDialogOpen(false);
      setUserToSwitchTo(null);
    }
  };
  
  // Cancel user switch
  const cancelUserSwitch = () => {
    setSwitchDialogOpen(false);
    setUserToSwitchTo(null);
  };
  
  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };
  
  // Handle command palette selection
  const handleCommandSelect = (command) => {
    setShowCommandPalette(false);
    if (command.action) {
      command.action();
    } else if (command.path) {
      navigate(command.path);
    }
  };
  
  // Filter commands based on query
  const getFilteredCommands = () => {
    const allCommands = [
      ...navigationItems.map(item => ({ 
        ...item, 
        type: 'navigation', 
        action: () => navigate(item.path)
      })),
      ...settingsItems.map(item => ({ ...item, type: 'settings' })),
      {
        name: 'Open Family Meeting',
        icon: <Users size={18} />,
        type: 'action',
        action: () => {
          setShowCommandPalette(false);
          window.dispatchEvent(new CustomEvent('open-family-meeting'));
        }
      },
      {
        name: 'Start Chat',
        icon: <MessageSquare size={18} />,
        type: 'action',
        action: () => {
          setShowCommandPalette(false);
          window.dispatchEvent(new CustomEvent('open-allie-chat'));
        }
      },
      {
        name: 'Quick Add Event',
        icon: <Plus size={18} />,
        type: 'action',
        action: () => {
          setShowCommandPalette(false);
          openEventParser();
        }
      },
      {
        name: 'Add Event from Clipboard',
        icon: <Calendar size={18} />,
        type: 'action',
        action: () => {
          setShowCommandPalette(false);
          navigator.clipboard.readText().then(text => {
            openEventParser(text);
          }).catch(() => {
            openEventParser();
          });
        }
      }
    ];
    
    if (!commandQuery) return allCommands;
    
    return allCommands.filter(cmd => 
      cmd.name.toLowerCase().includes(commandQuery.toLowerCase())
    );
  };
  
  return (
      <div className="flex h-screen bg-white font-['Inter','SF_Pro_Display','-apple-system','BlinkMacSystemFont','Segoe_UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira_Sans','Droid_Sans','Helvetica_Neue','sans-serif'] overflow-hidden">
        {/* Mobile menu button - visible only on mobile */}
        <button 
          className="mobile-menu-button md:hidden fixed bottom-4 left-4 z-50 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          title="Open Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        
        {/* Mobile sidebar overlay */}
        {showMobileMenu && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
        )}
        
        {/* Sidebar - Notion style gray - Always visible on desktop */}
        <div className={`sidebar-scroll w-60 flex-shrink-0 bg-[#FBFBFA] border-r border-[#E3E2E0] flex flex-col h-full overflow-y-auto relative z-30 ${
          showMobileMenu ? 'fixed left-0 top-0 bottom-0 z-50' : 'flex'
        }`}>
          {/* User section with dropdown */}
          <div className="relative user-dropdown-container">
            <div 
              className="p-3 flex items-center hover:bg-[#37352F]/5 rounded-lg mx-2 mt-2 cursor-pointer"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <UserAvatar user={localSelectedUser || selectedUser} size={28} className="mr-2" />
              <div className="flex-1 truncate">
                <div className="text-[13px] font-medium text-[#37352F] truncate">{(localSelectedUser || selectedUser)?.name || 'User'}</div>
                <div className="text-[11px] text-[#37352F]/60 truncate">{familyName} Family</div>
              </div>
              <ChevronDown 
                size={14} 
                className={`text-[#37352F]/40 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`}
              />
            </div>
            
            {/* User dropdown menu */}
            {showUserDropdown && (
              <div className="absolute left-2 right-2 top-full mt-1 bg-white rounded-lg shadow-lg border border-[#E3E2E0] py-2 z-50">
                <div className="px-3 pb-2">
                  <div className="text-[11px] font-medium text-[#37352F]/40 uppercase tracking-wider">
                    Switch User
                  </div>
                </div>
                
                {/* Family members list */}
                {familyMembers.map(member => {
                  const isSelected = 
                    (localSelectedUser && localSelectedUser.id === member.id) ||
                    (selectedUser && selectedUser.id === member.id);
                  
                  return (
                    <button
                      key={member.id}
                      className={`w-full flex items-center px-3 py-2 text-[13px] hover:bg-[#37352F]/5 transition-all ${
                        isSelected ? 'bg-[#37352F]/5 font-medium' : ''
                      }`}
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleUserSwitch(member);
                      }}
                    >
                      <UserAvatar user={member} size={24} className="mr-3" />
                      <div className="flex-1 text-left">
                        <div className="text-[#37352F]">{member.name}</div>
                        <div className="text-[11px] text-[#37352F]/60">{member.role}</div>
                      </div>
                      {isSelected && (
                        <CheckCircle size={14} className="text-[#37352F]/60" />
                      )}
                    </button>
                  );
                })}
                
                <div className="border-t border-[#E3E2E0] mt-2 pt-2">
                  <button className="w-full flex items-center px-3 py-2 text-[13px] text-[#37352F]/60 hover:bg-[#37352F]/5">
                    <Plus size={14} className="mr-3" />
                    <span>Add family member</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Search */}
          <div className="px-3 pb-2">
            <div 
              className="w-full flex items-center px-2.5 py-1.5 text-[#37352F]/60 cursor-pointer hover:bg-[#37352F]/5 rounded-md transition-colors"
              onClick={() => setShowCommandPalette(true)}
            >
              <Search size={14} className="mr-2 text-[#37352F]/40" />
              <span className="text-[13px]">Search</span>
              <div className="ml-auto text-[11px] text-[#37352F]/40 font-medium">⌘K</div>
            </div>
          </div>
          
          {/* Main navigation - Split into standard and kid-friendly sections */}
          <div className="py-2">
            {/* Regular navigation items */}
            <div className="mb-4">
              {/* Filter out Allie Chat, kid-friendly items, and parent-only items for non-parents */}
              {navigationItems
                .filter(item => {
                  // Skip Allie Chat (handled elsewhere)
                  if (item.name === 'Allie Chat') return false;

                  // Skip kid-friendly items (handled in kid section)
                  if (item.isKidFriendly) return false;

                  // Skip parent-only items for non-parents
                  if (item.isParentOnly && selectedUser?.role !== 'parent') return false;

                  // Skip beta items (handled in beta section)
                  if (item.isBeta) return false;

                  // Check visibility settings
                  if (item.visibilityKey && !isTabVisible(item.visibilityKey)) return false;
                  
                  return true;
                })
                .map((item) => {
                  const isDisabled = item.requiresData && !hasCompletedSurvey;
                  const isActive = getCurrentPage() === item.name;
                  
                  return (
                    <button
                      key={item.name}
                      onClick={() => !isDisabled && handleNavigation(item.path)}
                      className={`w-full flex items-center px-3 py-1 text-[13px] rounded-md transition-all ${
                        isActive 
                          ? 'bg-[#37352F]/8 text-[#37352F] font-medium' 
                          : isDisabled
                          ? 'text-[#37352F]/20 cursor-not-allowed'
                          : item.highlight
                          ? 'text-[#0F62FE] hover:bg-[#0F62FE]/5'
                          : 'text-[#37352F]/60 hover:bg-[#37352F]/5'
                      }`}
                      disabled={isDisabled}
                    >
                      <span className={`mr-2 flex-shrink-0 ${
                        isActive 
                          ? 'text-[#37352F]' 
                          : isDisabled
                          ? 'text-[#37352F]/20'
                          : item.highlight
                          ? 'text-[#0F62FE]'
                          : 'text-[#37352F]/40'
                      }`}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.name}</span>
                      {item.highlight && !hasCompletedSurvey && (
                        <span className="ml-auto w-2 h-2 bg-[#0F62FE] rounded-full"></span>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Kid-friendly navigation with home tab card design */}
            {/* Only show this section for kids, or if there are children in the family for parents */}
            {(selectedUser?.role === 'child' || (selectedUser?.role === 'parent' && familyMembers?.some(m => m.role === 'child'))) && (
              <div className="mt-2 border-t pt-3 border-[#E3E2E0]">
                <div className="text-[11px] font-medium text-[#37352F]/40 uppercase tracking-wider px-2 mb-3">
                  For Kids
                </div>
                <div className="px-2 space-y-2">
                  {navigationItems
                    .filter(item => {
                      if (!item.isKidFriendly) return false;
                      // Check visibility settings
                      if (item.visibilityKey && !isTabVisible(item.visibilityKey)) return false;
                      return true;
                    })
                    .map((item) => {
                      // Get icon background color based on item
                      const getIconBgColor = () => {
                        if (item.name === 'Chore Chart') return 'bg-blue-100';
                        if (item.name === 'Reward Party') return 'bg-purple-100';
                        if (item.name === 'My Palsson Bucks') return 'bg-green-100';
                        if (item.name === 'Wardrobe Wizard') return 'bg-indigo-100';
                        if (item.name === 'Gift Wishes') return 'bg-pink-100';
                        if (item.name === 'Habit Helper') return 'bg-teal-100';
                        return 'bg-gray-100';
                      };

                      const getIconHoverBgColor = () => {
                        if (item.name === 'Chore Chart') return 'group-hover:bg-blue-200';
                        if (item.name === 'Reward Party') return 'group-hover:bg-purple-200';
                        if (item.name === 'My Palsson Bucks') return 'group-hover:bg-green-200';
                        if (item.name === 'Wardrobe Wizard') return 'group-hover:bg-indigo-200';
                        if (item.name === 'Gift Wishes') return 'group-hover:bg-pink-200';
                        if (item.name === 'Habit Helper') return 'group-hover:bg-teal-200';
                        return 'group-hover:bg-gray-200';
                      };

                      // Special rendering for Palsson Bucks with balance
                      if (item.name === 'My Palsson Bucks' && selectedUser?.role === 'child') {
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full flex items-center gap-3 p-3 bg-white rounded-lg border transition-all text-left group ${
                              getCurrentPage() === item.name
                                ? 'border-green-300 shadow-md'
                                : 'border-gray-200 hover:shadow-md hover:border-green-300'
                            }`}
                          >
                            <div className={`p-2 rounded-lg transition-colors ${getIconBgColor()} ${getIconHoverBgColor()}`}>
                              {React.cloneElement(item.icon, { size: 20, className: 'text-green-600' })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                              <p className="text-lg font-bold text-green-600">${bucksBalance}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                          </button>
                        );
                      }

                      // Default home tab card design for other items
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleNavigation(item.path)}
                          className={`w-full flex items-center gap-3 p-3 bg-white rounded-lg border transition-all text-left group ${
                            getCurrentPage() === item.name
                              ? 'border-blue-300 shadow-md'
                              : 'border-gray-200 hover:shadow-md hover:border-blue-300'
                          }`}
                        >
                          <div className={`p-2 rounded-lg transition-colors ${getIconBgColor()} ${getIconHoverBgColor()}`}>
                            {React.cloneElement(item.icon, { size: 20 })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
          
          
          {/* Spacer */}
          <div className="flex-grow"></div>
          
          {/* Beta Section */}
          <div className="px-3 py-2 mb-2">
            <div className="text-[11px] font-medium text-[#37352F]/40 uppercase tracking-wider px-2 mb-2">
              Beta Features
            </div>
            <div className="space-y-1">
              {navigationItems
                .filter(item => {
                  if (!item.isBeta) return false;
                  // Check visibility settings
                  if (item.visibilityKey && !isTabVisible(item.visibilityKey)) return false;
                  return true;
                })
                .map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center px-3 py-1 text-[13px] rounded-md transition-all ${
                      getCurrentPage() === item.name 
                        ? 'bg-[#37352F]/8 text-[#37352F] font-medium' 
                        : 'text-[#37352F]/60 hover:bg-[#37352F]/5'
                    }`}
                  >
                    <span className={`mr-2 flex-shrink-0 ${
                      getCurrentPage() === item.name ? 'text-[#37352F]' : 'text-[#37352F]/40'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                    <span className="ml-auto text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">beta</span>
                  </button>
                ))}
            </div>
          </div>
          
          {/* Settings and account */}
          <div className="p-3 border-t border-[#E3E2E0]">
            {settingsItems.map((item) => (
              <button
                key={item.name}
                onClick={item.action}
                className="w-full flex items-center px-2 py-1.5 text-[13px] text-[#37352F]/60 hover:bg-[#37352F]/5 rounded-md mb-1"
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Main content */}
        <div 
          className={`flex-1 flex flex-col transition-all duration-300 main-content-wrapper h-full overflow-y-auto ${getCurrentPage() === 'Task Board' ? 'bg-gray-100' : ''}`}
          style={{
            marginRight: isChatOpen && chatDrawerWidth > 0 ? `${chatDrawerWidth}px` : '0',
            transition: document.body.classList.contains('resizing') ? 'none' : 'margin-right 300ms ease-in-out'
          }}
        >
          {/* Top bar - Notion style */}
          <div className={`h-14 border-b border-[#E3E2E0] ${getCurrentPage() === 'Task Board' ? '' : 'bg-white'} flex items-center justify-between px-6 flex-shrink-0`} style={{ position: 'relative', zIndex: 21 }}>
            {/* Title on the left */}
            <div className="flex items-center">
              <h1 className="text-[#37352F] font-semibold" style={{ fontSize: '24px' }}>{title || getCurrentPage()}</h1>
            </div>
            
            {/* Notification bell on the right */}
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
          
          {/* Page content */}
          <div className="flex-1 w-full overflow-y-auto">
            {children}
          </div>
        </div>
        
        {/* Chat Drawer is now global ResizableChatDrawer in App.js */}
        
        {/* Floating Chat Button - Notion style */}
        {!isChatOpen && (
          <button
            onClick={() => {
              toggleDrawer();
              window.dispatchEvent(new CustomEvent('open-allie-chat'));
            }}
            className="fixed bottom-6 right-6 bg-white rounded-full shadow-lg px-4 py-3 flex items-center gap-2 hover:shadow-xl transition-all duration-200 border border-gray-200 z-40"
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            <MessageSquare size={18} className="text-gray-700" />
            <span className="text-sm font-medium text-gray-700">Chat with Allie</span>
          </button>
        )}
        
        {/* Command Palette */}
        {showCommandPalette && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
              <div className="p-2 border-b border-gray-200 flex items-center">
                <Command size={16} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search commands..."
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  className="flex-1 outline-none text-sm"
                  autoFocus
                />
                <button onClick={() => setShowCommandPalette(false)}>
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
              
              <div className="max-h-80 overflow-y-auto py-2">
                {getFilteredCommands().map((command, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => handleCommandSelect(command)}
                  >
                    <span className="mr-3 text-gray-500">{command.icon}</span>
                    <span>{command.name}</span>
                  </button>
                ))}
                
                {getFilteredCommands().length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    No commands found matching "{commandQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* User switching confirmation dialog */}
        <ConfirmationDialog
          isOpen={switchDialogOpen}
          title="Switch User"
          message={userToSwitchTo ? `Do you want to switch to ${userToSwitchTo.name}'s account?` : "Do you want to switch users?"}
          confirmText="Switch"
          cancelText="Cancel"
          onConfirm={confirmUserSwitch}
          onCancel={cancelUserSwitch}
        />
      </div>
  );
};

// Export the layout directly since ChatDrawerProvider is now global in App.js
const NotionLayout = NotionLayoutInner;

export default NotionLayout;