import React from 'react';

const ProgressBar = ({ currentSection }) => {
  const sections = [
    { id: 'problem', label: 'Problem' },
    { id: 'solution', label: 'Solution' },
    { id: 'market', label: 'Market' },
    { id: 'traction', label: 'Traction' },
    { id: 'team', label: 'Team' },
    { id: 'financials', label: 'Financials' }
  ];

  // Calculate current progress percentage based on section
  const getSectionIndex = (sectionId) => {
    return sections.findIndex(s => s.id === sectionId);
  };
  
  const progressPercentage = ((getSectionIndex(currentSection) + 1) / sections.length) * 100;

  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '10px 20px'
  };

  const progressStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  };

  const barContainerStyle = {
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden'
  };

  const barStyle = {
    height: '100%',
    width: `${progressPercentage}%`,
    backgroundColor: '#8b5cf6',
    borderRadius: '2px',
    transition: 'width 0.5s ease-out'
  };

  return (
    <div style={containerStyle}>
      <div style={progressStyle}>
        {sections.map((section) => (
          <div 
            key={section.id}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: currentSection === section.id ? '#8b5cf6' : 'transparent',
              color: currentSection === section.id ? 'white' : '#6b7280',
              fontWeight: currentSection === section.id ? '500' : '400',
              fontSize: '0.875rem',
              transform: currentSection === section.id ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          >
            {section.label}
          </div>
        ))}
      </div>
      <div style={barContainerStyle}>
        <div style={barStyle}></div>
      </div>
    </div>
  );
};

// Function to get the current section based on slide ID
export const getSlideSection = (slideId) => {
  const slideSectionMap = {
    // Problem section
    2: 'problem',
    3: 'problem',
    4: 'problem',
    5: 'problem',
    6: 'problem',
    7: 'problem',
    8: 'problem',
    9: 'problem',
    10: 'problem',
    11: 'problem',
    // Solution section
    12: 'solution',
    13: 'solution',
    14: 'solution',
    15: 'solution',
    16: 'solution',
    20: 'solution',
    22: 'solution',
    23: 'solution',
    // Market section
    17: 'market',
    18: 'market',
    19: 'market',
    // Traction section
    24: 'traction',
    25: 'traction', 
    // Team section
    21: 'team',
    // Financials section
    26: 'financials'
  };
  
  return slideSectionMap[slideId] || 'problem';
};

export default ProgressBar;