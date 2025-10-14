// src/components/common/NotificationToast.jsx
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

const NotificationToast = ({ 
  message, 
  type = 'success', 
  duration = 5000, 
  onClose,
  isVisible = true
}) => {
  const [isShowing, setIsShowing] = useState(isVisible);
  
  useEffect(() => {
    setIsShowing(isVisible);
    
    // Auto-dismiss after duration
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsShowing(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  // Don't render if not showing
  if (!isShowing) return null;

  // Determine styling based on notification type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          icon: <CheckCircle size={20} className="text-green-500" />
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          icon: <AlertCircle size={20} className="text-red-500" />
        };
      case 'warning':
        return {
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          icon: <AlertCircle size={20} className="text-amber-500" />
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          icon: <Info size={20} className="text-blue-500" />
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed top-6 right-6 z-50 max-w-md fade-in">
      <div className={`flex items-start p-4 rounded-lg shadow-lg border ${styles.bgColor} ${styles.borderColor} ${styles.textColor}`}>
        <div className="flex-shrink-0 mr-3">
          {styles.icon}
        </div>
        <div className="flex-1 mr-2">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button 
          onClick={() => {
            setIsShowing(false);
            if (onClose) onClose();
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;