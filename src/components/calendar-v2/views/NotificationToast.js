// src/components/calendar-v2/views/NotificationToast.js

import React, { useState, useEffect } from 'react';
import { Bell, X, Calendar, Clock, MapPin } from 'lucide-react';

export function NotificationToast() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for in-app notifications
    const handleNotification = (event) => {
      const { title, body, type, eventId } = event.detail;
      const id = Date.now();
      
      setNotifications(prev => [...prev, {
        id,
        title,
        body,
        type,
        eventId,
        timestamp: new Date()
      }]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        dismissNotification(id);
      }, 5000);
    };

    window.addEventListener('calendar:notification', handleNotification);
    return () => window.removeEventListener('calendar:notification', handleNotification);
  }, []);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClick = (notification) => {
    if (notification.eventId) {
      window.dispatchEvent(new CustomEvent('calendar:viewEvent', {
        detail: { eventId: notification.eventId }
      }));
    }
    dismissNotification(notification.id);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'reminder':
        return <Clock className="w-5 h-5" />;
      case 'location':
        return <MapPin className="w-5 h-5" />;
      case 'event':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'reminder':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'success':
        return 'bg-green-500';
      default:
        return 'bg-gray-700';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 cursor-pointer transform transition-all duration-300 hover:scale-105"
          onClick={() => handleClick(notification)}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full text-white ${getColor(notification.type)}`}>
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{notification.title}</h4>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                {notification.body}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification(notification.id);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}