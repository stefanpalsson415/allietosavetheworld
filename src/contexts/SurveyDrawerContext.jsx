import React, { createContext, useContext, useState } from 'react';

const SurveyDrawerContext = createContext();

export const SurveyDrawerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [surveyType, setSurveyType] = useState(null);
  const [memberId, setMemberId] = useState(null);

  const openSurveyDrawer = (type = null, member = null) => {
    setSurveyType(type);
    setMemberId(member);
    setIsOpen(true);
  };

  const closeSurveyDrawer = () => {
    setIsOpen(false);
    // Clear state after animation
    setTimeout(() => {
      setSurveyType(null);
      setMemberId(null);
    }, 300);
  };

  return (
    <SurveyDrawerContext.Provider value={{
      isOpen,
      surveyType,
      memberId,
      openSurveyDrawer,
      closeSurveyDrawer
    }}>
      {children}
    </SurveyDrawerContext.Provider>
  );
};

export const useSurveyDrawer = () => {
  const context = useContext(SurveyDrawerContext);
  if (!context) {
    throw new Error('useSurveyDrawer must be used within a SurveyDrawerProvider');
  }
  return context;
};