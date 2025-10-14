// src/components/common/NotionUI.jsx
import React from 'react';

// Notion-style button component
export const NotionButton = ({
  children,
  onClick,
  variant = 'default', // default, primary, outline, subtle, link
  size = 'md', // sm, md, lg
  icon,
  className = '',
  disabled = false,
  fullWidth = false,
  ...props
}) => {
  const variants = {
    default: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    primary: 'bg-[#0F62FE] text-white hover:bg-blue-600 border border-transparent',
    subtle: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent',
    outline: 'bg-white border border-gray-300 text-[#0F62FE] hover:bg-blue-50',
    link: 'bg-transparent text-[#0F62FE] hover:underline border-0'
  };
  
  const sizes = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded
        transition-colors duration-150
        font-roboto
        focus:outline-none
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center justify-center">
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </div>
    </button>
  );
};

// Notion-style input component
export const NotionInput = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  className = '',
  disabled = false,
  error,
  ...props
}) => {
  return (
    <div className="w-full">
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full
            border border-gray-300
            rounded
            bg-white
            text-gray-700
            text-sm
            p-2
            ${icon ? 'pl-10' : ''}
            placeholder-gray-400
            focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            transition-colors duration-150
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

// Notion-style checkbox component
export const NotionCheckbox = ({
  checked,
  onChange,
  label,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <label className={`flex items-center ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="
          h-4 w-4
          rounded
          border-gray-300
          text-[#0F62FE]
          focus:ring-blue-500
          transition-colors duration-150
        "
        {...props}
      />
      {label && <span className="ml-2 text-sm text-gray-700">{label}</span>}
    </label>
  );
};

// Notion-style badge component
export const NotionBadge = ({
  children,
  color = 'default', // default, blue, green, red, yellow, purple
  className = '',
  ...props
}) => {
  const colors = {
    default: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700'
  };
  
  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2 py-0.5
        text-xs font-medium
        rounded
        ${colors[color]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

// Notion-style tabs component
export const NotionTabs = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  ...props
}) => {
  return (
    <div className={`border-b border-gray-200 ${className}`} {...props}>
      <div className="flex space-x-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              px-3 py-2 
              text-sm font-medium
              border-b-2 
              ${activeTab === tab.id 
                ? 'border-[#0F62FE] text-[#0F62FE]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.icon && <span className="mr-2">{React.createElement(tab.icon, { className: "h-4 w-4 inline" })}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const NotionUI = {
  Button: NotionButton,
  Input: NotionInput,
  Checkbox: NotionCheckbox,
  Badge: NotionBadge,
  Tabs: NotionTabs
};

export default NotionUI;