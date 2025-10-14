import React from 'react';

/**
 * Stat Component
 * Used to display a statistic with a value and label
 */
const Stat = ({ value, label, color = "text-purple-700" }) => {
  return (
    <div className="text-center p-4">
      <div className={`text-4xl font-bold mb-2 ${color}`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

export default Stat;