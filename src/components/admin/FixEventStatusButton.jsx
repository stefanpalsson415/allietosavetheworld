import React, { useState } from 'react';
import { Wrench } from 'lucide-react';
import { fixEventStatus } from '../../utils/fixEventStatus';

const FixEventStatusButton = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState(null);

  const handleFix = async () => {
    setIsFixing(true);
    setFixResult(null);
    
    try {
      const result = await fixEventStatus();
      setFixResult(result);
      
      // Clear the result after 5 seconds
      setTimeout(() => {
        setFixResult(null);
      }, 5000);
    } catch (error) {
      console.error('Error fixing events:', error);
      setFixResult({ 
        success: false, 
        error: error.message 
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleFix}
        disabled={isFixing}
        className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        <Wrench size={12} />
        {isFixing ? 'Fixing...' : 'Fix Missing Status'}
      </button>
      
      {fixResult && (
        <span className={`text-xs ${fixResult.success ? 'text-green-600' : 'text-red-600'}`}>
          {fixResult.success 
            ? `✓ Fixed ${fixResult.fixed} events`
            : `✗ Error: ${fixResult.error}`
          }
        </span>
      )}
    </div>
  );
};

export default FixEventStatusButton;