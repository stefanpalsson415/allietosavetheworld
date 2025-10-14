// KeyTakeaways.jsx - Highlighted key points from blog post
// Clean, scannable format for busy parents

import React from 'react';

/**
 * KeyTakeaways - Displays key takeaways from blog post
 * @param {Array} takeaways - Array of takeaway strings
 */
function KeyTakeaways({ takeaways }) {
  if (!takeaways || takeaways.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0 text-3xl mr-4">💡</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-blue-900 mb-4">
            Key Takeaways
          </h3>
          <ul className="space-y-3">
            {takeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 font-bold mr-3 flex-shrink-0">
                  {index + 1}.
                </span>
                <span className="text-blue-800">
                  {takeaway}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default KeyTakeaways;
