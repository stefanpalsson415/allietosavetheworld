import React from 'react';
import ReactDOM from 'react-dom';
import EnhancedFamilyMeeting from './EnhancedFamilyMeeting';

const FamilyMeetingModal = ({ isOpen, onClose }) => {
  console.log("FamilyMeetingModal render, isOpen:", isOpen);
  
  if (!isOpen) {
    console.log("FamilyMeetingModal not open, returning null");
    return null;
  }

  console.log("FamilyMeetingModal is open, creating portal");
  
  // Component is now unused since we're using routing instead of modal

  return ReactDOM.createPortal(
    <div 
      id="family-meeting-modal-backdrop"
      className="family-meeting-modal-do-not-remove"
      data-modal="family-meeting"
      style={{
        position: 'fixed',
        top: '0px',
        left: '0px',
        right: '0px',
        bottom: '0px',
        width: '100vw',
        height: '100vh',
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto'
      }}
      onClick={(e) => {
        // Close if clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          maxWidth: '95vw',
          maxHeight: '95vh',
          width: '1200px',
          height: 'auto',
          backgroundColor: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <EnhancedFamilyMeeting onClose={onClose} />
      </div>
    </div>,
    document.body
  );
};

export default FamilyMeetingModal;