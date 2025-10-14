import React from 'react';

/**
 * Card Component
 * Used to display content in a card layout
 */
const Card = ({ 
  title, 
  children, 
  icon = null,
  className = "", 
  titleColor = "text-purple-700"
}) => {
  return (
    <div className={`bg-white p-5 rounded-lg shadow-md border border-gray-100 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center mb-3">
          {icon && (
            <div className="mr-3">
              {icon}
            </div>
          )}
          {title && (
            <h3 className={`font-medium ${titleColor}`}>{title}</h3>
          )}
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
};

export default Card;