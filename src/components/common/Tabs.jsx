import React from 'react';
import PropTypes from 'prop-types';

/**
 * Tabs component for creating tabbed interfaces
 */
export const Tabs = ({ children, activeTab, onChange, className }) => {
  // Filter out non-Tab children
  const tabs = React.Children.toArray(children).filter(
    child => React.isValidElement(child) && child.type === Tab
  );
  
  // Get active tab content
  const activeTabContent = tabs.find(
    tab => tab.props.id === activeTab
  )?.props.children;
  
  return (
    <div className={className}>
      {/* Tab buttons */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.props.id}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === tab.props.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              } ${tab.props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !tab.props.disabled && onChange(tab.props.id)}
              disabled={tab.props.disabled}
            >
              {tab.props.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {activeTabContent}
      </div>
    </div>
  );
};

/**
 * Tab component for individual tab content
 */
export const Tab = ({ children, id, label, disabled }) => {
  return <>{children}</>;
};

Tabs.propTypes = {
  children: PropTypes.node,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string
};

Tab.propTypes = {
  children: PropTypes.node,
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool
};

Tab.defaultProps = {
  disabled: false
};