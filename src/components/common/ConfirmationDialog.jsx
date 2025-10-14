// src/components/common/ConfirmationDialog.jsx
import React from 'react';

const ConfirmationDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-md shadow-lg max-w-md w-full">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        
        <div className="p-4">
          <p className="text-gray-700">{message}</p>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;