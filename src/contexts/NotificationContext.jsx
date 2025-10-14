// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationToast from '../components/common/NotificationToast';

// Create notification context
const NotificationContext = createContext({
  createNotification: () => {},
  notifications: [],
  removeNotification: () => {}
});

// Custom hook to use the notification context
export function useNotification() {
  return useContext(NotificationContext);
}

// Provider component
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // Create a new notification
  const createNotification = useCallback((message, type = 'success', duration = 5000) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setNotifications(prev => [
      ...prev, 
      { id, message, type, duration }
    ]);
    
    // Return notification ID for potential use
    return id;
  }, []);

  // Remove a notification by ID
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // The celebration function that will replace createCelebration
  const createCelebration = useCallback((title, isSuccess = true, message = "") => {
    const type = isSuccess ? 'success' : 'error';
    const fullMessage = message ? `${title}: ${message}` : title;
    createNotification(fullMessage, type, 5000);
  }, [createNotification]);

  return (
    <NotificationContext.Provider 
      value={{ 
        createNotification, 
        notifications, 
        removeNotification,
        createCelebration
      }}
    >
      {children}
      
      {/* Render all active notifications */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
            isVisible={true}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export default NotificationContext;