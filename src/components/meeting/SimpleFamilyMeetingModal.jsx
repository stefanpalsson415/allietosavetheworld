import React, { useEffect } from 'react';
import EnhancedFamilyMeeting from './EnhancedFamilyMeeting';

const SimpleFamilyMeetingModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Create modal container
      const modalContainer = document.createElement('div');
      modalContainer.id = 'simple-family-meeting-modal';
      modalContainer.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background-color: rgba(0, 0, 0, 0.5) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 2147483647 !important;
      `;
      
      // Prevent the diagnostic script from removing it
      modalContainer.setAttribute('data-keep', 'true');
      modalContainer.setAttribute('data-modal-type', 'family-meeting');
      
      document.body.appendChild(modalContainer);
      
      // Force a re-render after the element is added
      setTimeout(() => {
        if (document.getElementById('simple-family-meeting-modal')) {
          document.getElementById('simple-family-meeting-modal').style.display = 'flex';
        }
      }, 0);
      
      return () => {
        const modal = document.getElementById('simple-family-meeting-modal');
        if (modal) {
          modal.remove();
        }
      };
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      id="simple-family-meeting-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '1200px',
          backgroundColor: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <EnhancedFamilyMeeting onClose={onClose} />
      </div>
    </div>
  );
};

export default SimpleFamilyMeetingModal;