import React from 'react';

/**
 * Quote Component
 * Used to display a quotation with author attribution
 */
const Quote = ({ text, author, role, className = "" }) => {
  return (
    <div className={`bg-indigo-50 p-6 rounded-lg border border-indigo-200 ${className}`}>
      <p className="text-xl italic text-gray-700 mb-4">
        "{text}"
      </p>
      <div className="text-right">
        <p className="font-medium text-indigo-700">{author}</p>
        {role && <p className="text-sm text-gray-600">{role}</p>}
      </div>
    </div>
  );
};

export default Quote;