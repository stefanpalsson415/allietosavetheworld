import React, { useState, useEffect } from 'react';
import { Bell, X, MessageSquare, AtSign, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

      {/* Reversed quarter-circle arc notification popout */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />

            {/* Notifications in reversed quarter-circle arc */}
            <div className="absolute right-0 top-0 pointer-events-none z-50" style={{ width: '300px', height: '300px' }}>
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x: -120, y: 60 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute pointer-events-auto"
                  style={{ right: '0px', top: '0px' }}
                >
                  <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-6 w-64">
                    <div className="text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                notifications.slice(0, 5).map((notification, index, arr) => {
                  // Reversed quarter-circle: from 270° to 360° (top-right to bottom)
                  const radius = 140;
                  const angleStep = 90 / (arr.length + 1);
                  const angle = 270 + angleStep * (index + 1); // Start at 270° (top)
                  const angleRad = (angle * Math.PI) / 180;

                  // Calculate position (origin at top-right)
                  const x = Math.cos(angleRad) * radius;
                  const y = Math.sin(angleRad) * radius;

                  return (
                    <motion.button
                      key={notification.id}
                      initial={{
                        opacity: 0,
                        scale: 0,
                        x: 0,
                        y: 0
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x,
                        y
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                        delay: index * 0.05
                      }}
                      onClick={() => handleNotificationClick(notification)}
                      className="absolute pointer-events-auto group"
                      style={{
                        right: '0px',
                        top: '0px'
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Notification card with glow */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                        <div className="relative bg-white rounded-2xl shadow-lg border-2 border-white p-4 w-56 hover:shadow-xl transition-shadow">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-xs font-semibold text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <p className="text-[10px] text-gray-600 line-clamp-2 mt-0.5">
                                {notification.body}
                              </p>
                              <p className="text-[9px] text-gray-400 mt-1">
                                {formatTimestamp(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}

              {/* Mark all as read button at the end of arc */}
              {notifications.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: Math.cos((365 * Math.PI) / 180) * 140,
                    y: Math.sin((365 * Math.PI) / 180) * 140
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: notifications.length * 0.05
                  }}
                  onClick={handleMarkAllAsRead}
                  className="absolute pointer-events-auto group"
                  style={{
                    right: '0px',
                    top: '0px'
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
                    <div className="relative bg-white rounded-full p-3 shadow-lg border-2 border-white w-14 h-14 flex items-center justify-center hover:border-green-500 transition-colors">
                      <Check size={20} className="text-gray-600 group-hover:text-green-500 transition-colors" />
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap shadow-lg"
                    >
                      Mark all read
                    </motion.div>
                  </div>
                </motion.button>
              )}
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;