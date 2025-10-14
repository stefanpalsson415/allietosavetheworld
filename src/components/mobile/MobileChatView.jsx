import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Settings, Loader2 } from 'lucide-react';
import AllieChat from '../chat/refactored/AllieChat';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';

/**
 * Mobile-optimized full-screen chat view
 * This is the primary interface for mobile users
 */
const MobileChatView = () => {
  const navigate = useNavigate();
  const { currentUser, logout, loading: authLoading } = useAuth();
  const { selectedUser, familyMembers, familyName, familyId } = useFamily();
  const [showMenu, setShowMenu] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  // Add timeout for loading to prevent infinite spinner
  useEffect(() => {
    if (currentUser && !familyId) {
      const timer = setTimeout(() => {
        console.log('⏰ Load timeout - family data not loaded in 5 seconds');
        setLoadTimeout(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, familyId]);

  // Show loading only if auth is loading AND haven't timed out
  const isLoading = authLoading || (!familyId && currentUser && familyMembers.length === 0 && !loadTimeout);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (showMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showMenu]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSettings = () => {
    setShowMenu(false);
    navigate('/user/settings');
  };

  // Show loading state while family data loads
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Allie...</h2>
          <p className="text-gray-600 text-sm">Setting up your chat</p>
        </div>
      </div>
    );
  }

  // Show error state if logged in but no family data
  if (currentUser && !familyId && !isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Setup Required</h2>
          <p className="text-gray-600 text-sm mb-6">
            Please complete your profile setup to start chatting with Allie.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Complete Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
      {/* Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
        <div className="flex items-center space-x-3">
          <UserAvatar
            user={selectedUser}
            size={36}
            className="ring-2 ring-white"
          />
          <div className="text-white">
            <div className="font-semibold text-sm">
              {selectedUser?.name || 'User'}
            </div>
            <div className="text-xs opacity-90">
              {familyName || 'Family'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-white hover:bg-white/20 rounded-lg transition"
          aria-label="Menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Full-screen Allie Chat */}
      <div className="flex-1 overflow-hidden bg-white">
        <AllieChat
          notionMode={true}
          embedded={false}
          initialVisible={true}
          className="h-full w-full"
        />
      </div>

      {/* Slide-out Menu */}
      {showMenu && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    user={selectedUser}
                    size={48}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {selectedUser?.name || 'User'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentUser?.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                  {/* Settings */}
                  <button
                    onClick={handleSettings}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-100 rounded-lg transition"
                  >
                    <Settings size={20} className="text-gray-600" />
                    <span className="text-gray-900">Settings</span>
                  </button>

                  {/* Family Members */}
                  {familyMembers && familyMembers.length > 0 && (
                    <div className="mt-4">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Family Members
                      </div>
                      {familyMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg"
                        >
                          <UserAvatar user={member} size={32} />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {member.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.isParent ? 'Parent' : 'Child'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-4 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileChatView;
