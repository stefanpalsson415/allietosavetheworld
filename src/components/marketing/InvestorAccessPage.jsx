import React from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordProtection from '../shared/PasswordProtection';

/**
 * Password protection screen for investor pitch deck
 * Routes to different versions based on password:
 * - "changetheworld" for read-only slideshow view
 * - "tegner" for full editor view
 */
const InvestorAccessPage = () => {
  const navigate = useNavigate();

  const handleViewOnlyAccess = () => {
    navigate('/investor/slideshow');
  };

  const handleEditorAccess = () => {
    navigate('/investor/v4');
  };

  return (
    <PasswordProtection 
      onCorrectPassword={handleViewOnlyAccess} 
      onEditorAccess={handleEditorAccess}
      viewOnlyPassword="changetheworld"
      editorPassword="tegner"
    />
  );
};

export default InvestorAccessPage;