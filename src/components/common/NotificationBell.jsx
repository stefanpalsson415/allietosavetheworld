import React, { useState, useEffect } from 'react';
import { Bell, X, MessageSquare, AtSign, Check } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import NotificationService from '../../services/NotificationService';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const { selectedUser, familyId } = useFamily();
  const { currentUser } = useAuth();
  const { openDrawer } = useChatDrawer();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const userId = currentUser?.uid || selectedUser?.uid;

  useEffect(() => {
    if (!userId || !familyId) return;

    // Subscribe to real-time notifications
    const unsubscribe = NotificationService.subscribeToNotifications(
      userId,
      familyId,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        setUnreadCount(updatedNotifications.length);
      }
    );

    // Request notification permission on mount
    NotificationService.checkPermission();

    return () => unsubscribe();
  }, [userId, familyId]);

  // Listen for thread open events from browser notifications
  useEffect(() => {
    const handleOpenThread = (event) => {
      const { threadId } = event.detail;
      console.log('🔔 Browser notification clicked, opening thread:', threadId);

      // Open drawer first
      openDrawer();

      // Navigate to thread in AllieChat (after brief delay)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-to-chat-thread', {
          detail: { threadId }
        }));
      }, 100);

      setShowDropdown(false);
    };

    window.addEventListener('open-thread', handleOpenThread);
    return () => window.removeEventListener('open-thread', handleOpenThread);
  }, [openDrawer]);

  const handleNotificationClick = async (notification) => {
    console.log('🔔 Notification clicked:', notification);

    // Mark as read
    await NotificationService.markAsRead(notification.id);

    // Open the drawer first
    console.log('📂 Opening chat drawer...');
    openDrawer();

    // Navigate to the thread (after a brief delay to ensure drawer opens)
    if (notification.threadId) {
      console.log('📬 Dispatching navigate-to-chat-thread event for:', notification.threadId);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-to-chat-thread', {
          detail: { threadId: notification.threadId }
        }));
      }, 100); // Small delay to ensure drawer is open
    }

    setShowDropdown(false);
  };

  const handleMarkAllAsRead = async () => {
    await NotificationService.markAllAsRead(userId, familyId);
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-4 h-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Click outside to close */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Notification Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTimestamp(notification.createdAt)}
                          </p>
                        </div>
                        
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2 border-t">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    // Navigate to full notifications page if you have one
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-1"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;