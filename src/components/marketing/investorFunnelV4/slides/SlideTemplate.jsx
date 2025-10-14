import React from 'react';
import './slideStyles.css';

/**
 * Base template for investor deck slides
 * Provides consistent styling and layout for all slides
 * Uses Roboto font from Google Fonts (imported in slideStyles.css)
 */
const SlideTemplate = ({ 
  title, 
  subtitle,
  children,
  footnote,
  backgroundColor = "bg-white",
  textColor = "text-gray-800"
}) => {
  // Add debugging console.log for ALLIE title detection
  if (title === "ALLIE") {
    console.log("ALLIE title detected in SlideTemplate");
  }
  // Add extra debugging for ALLIE title
  console.log(`Rendering SlideTemplate with title: "${title}", isALLIE: ${title === "ALLIE"}`);
  
  // Special styles for the ALLIE title to ensure visibility
  const allieStyles = {
    fontSize: '6rem',
    fontWeight: 'bold',
    marginBottom: '0.8rem',
    color: '#7c3aed',
    letterSpacing: '0.05em',
    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
    display: 'block',
    position: 'relative',
    zIndex: 10
  };
  
  return (
    <div className={`investor-slide flex flex-col ${title === "ALLIE" ? "min-h-full" : "h-full"} ${backgroundColor} ${textColor} p-6 ${title === "ALLIE" ? "overflow-visible" : ""}`}>
      {/* Slide header with title and optional subtitle - fixed at top for ALLIE */}
      <div className={`${title === "ALLIE" ? "sticky top-0 z-10 bg-white pb-2 pt-0" : "pt-4 mb-8"}`}>
        {title && (
          <h1 
            className={title === "ALLIE" ? "text-6xl font-extrabold mb-4 text-purple-600" : "text-3xl font-bold mb-2 text-purple-800"}
            style={title === "ALLIE" ? allieStyles : {}}
            data-title={title} // Add data attribute for debugging
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <h2 className={title === "ALLIE" ? "text-2xl text-gray-800" : "text-xl text-gray-700"}>
            {subtitle}
          </h2>
        )}
      </div>
      
      {/* Main content area - adjusted for ALLIE slide */}
      <div className={`${title === "ALLIE" ? "h-auto pt-2" : "flex-grow overflow-auto"}`}>
        {children}
      </div>
      
      {/* Optional footnote */}
      {footnote && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
          {footnote}
        </div>
      )}
    </div>
  );
};

export default SlideTemplate;