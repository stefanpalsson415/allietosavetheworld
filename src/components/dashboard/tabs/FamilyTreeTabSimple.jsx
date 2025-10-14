import React from 'react';
import { Trees } from 'lucide-react';

const FamilyTreeTabSimple = () => {
  console.log('FamilyTreeTabSimple: Rendering');
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trees className="h-8 w-8 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Family Tree</h2>
        </div>
        <p className="text-gray-600">
          This is a simple test to verify the Family Tree tab is loading.
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            If you can see this message, the tab routing is working correctly!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FamilyTreeTabSimple;