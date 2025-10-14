import React, { useState } from 'react';
import { setupFamilyEmails } from '../../services/setup-family-email';

const SetupFamilyEmails = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleSetup = async () => {
    setRunning(true);
    setResult(null);
    
    try {
      const success = await setupFamilyEmails();
      setResult(success ? 'success' : 'error');
    } catch (error) {
      console.error('Setup error:', error);
      setResult('error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Setup Family Emails</h3>
      <p className="text-sm text-gray-600 mb-4">
        This will set up email addresses for all families in the format: familyname@families.checkallie.com
      </p>
      
      <button
        onClick={handleSetup}
        disabled={running}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {running ? 'Setting up...' : 'Setup Family Emails'}
      </button>
      
      {result === 'success' && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">
          ✅ Family emails set up successfully! Check the console for details.
        </div>
      )}
      
      {result === 'error' && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">
          ❌ Error setting up family emails. Check the console for details.
        </div>
      )}
    </div>
  );
};

export default SetupFamilyEmails;