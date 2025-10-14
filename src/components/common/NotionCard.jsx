// src/components/common/NotionCard.jsx
import React from 'react';

const NotionCard = ({ 
  children, 
  title, 
  icon, 
  actions, 
  className = '', 
  noPadding = false,
  fullWidth = false,
  hover = false
}) => {
  return (
    <div 
      className={`
        bg-white border border-[#E5E7EB] rounded-md 
        ${className} 
        ${fullWidth ? 'w-full' : ''} 
        ${hover ? 'transition-all duration-150 hover:border-[#C1C7CD] hover:shadow-sm' : ''}
      `}
      style={{ borderRadius: '4px' }}
    >
      {(title || icon || actions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
          <div className="flex items-center">
            {icon && <span className="mr-2 text-gray-500">{icon}</span>}
            {title && <h3 className="font-medium text-base">{title}</h3>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4'}>
        {children}
      </div>
    </div>
  );
};

// For key metrics, status pills, etc.
export const NotionPill = ({ 
  label, 
  value, 
  color = 'blue', 
  size = 'md',
  className = ''
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
  };
  
  const sizeMap = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  return (
    <div className={`rounded-full ${colorMap[color]} ${sizeMap[size]} ${className} inline-flex items-center`}>
      {label && <span className="font-medium mr-1">{label}:</span>}
      <span>{value}</span>
    </div>
  );
};

// For progress bars
export const NotionProgressBar = ({
  value,
  max = 100,
  color = 'blue',
  showLabel = true,
  label,
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500',
  };
  
  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1 text-sm">
          <span>{label || ''}</span>
          {showLabel && <span>{value}/{max}</span>}
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorMap[color]}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default NotionCard;