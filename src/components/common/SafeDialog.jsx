import React from 'react';
import { Dialog } from '@mui/material';

/**
 * SafeDialog component that prevents DOM manipulation errors
 * by ensuring proper cleanup and using React Portal correctly
 */
const SafeDialog = ({ open, onClose, children, ...props }) => {
  // Ensure onClose is always defined
  const handleClose = onClose || (() => {});
  
  // Don't render if not open to prevent DOM issues
  if (!open) return null;
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      disablePortal={false}
      keepMounted={false}
      {...props}
    >
      {children}
    </Dialog>
  );
};

export default SafeDialog;