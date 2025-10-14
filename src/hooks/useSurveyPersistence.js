// Hook to handle survey persistence and recovery
import { useEffect, useCallback, useRef } from 'react';
import { useSurvey } from '../contexts/SurveyContext';
import { useFamily } from '../contexts/FamilyContext';

export const useSurveyPersistence = (selectedUser, mode = 'initial') => {
  const { currentSurveyResponses, setCurrentSurveyResponses } = useSurvey();
  const { familyId, getMemberSurveyResponses } = useFamily();
  const hasLoadedFromDb = useRef(false);
  const prevUserId = useRef(null);

  // DISABLED: This hook was causing issues by loading stale data
  // The SurveyScreen now handles all data loading to prevent contamination
  useEffect(() => {
    if (!selectedUser || !familyId) return;

    // Only clear if the user actually changed (not for same user resuming)
    const isUserChange = prevUserId.current !== null && prevUserId.current !== selectedUser.id;

    if (isUserChange) {
      console.log(`useSurveyPersistence: User changed from ${prevUserId.current} to ${selectedUser.name}, clearing cached responses`);
      setCurrentSurveyResponses({});
      hasLoadedFromDb.current = false;
    } else if (prevUserId.current === null) {
      console.log(`useSurveyPersistence: Initial user set to ${selectedUser.name}`);
    } else {
      console.log(`useSurveyPersistence: Same user (${selectedUser.name}) - preserving responses`);
    }

    prevUserId.current = selectedUser.id;
  }, [selectedUser, familyId, setCurrentSurveyResponses]);
  
  // This hook is being simplified - the SurveyScreen now manages local storage directly
  // This keeps it for backward compatibility but most functionality is moved to SurveyScreen
  
  // Get combined response count (localStorage + context)
  const getResponseCount = useCallback(() => {
    const contextCount = Object.keys(currentSurveyResponses).length;
    
    if (!selectedUser) return contextCount;
    
    try {
      const storageKey = mode === 'initial' 
        ? `surveyInProgress_${selectedUser.id}`
        : `weeklyProgress_${selectedUser.id}`;
      
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        const savedCount = Object.keys(data.responses || {}).length;
        return Math.max(contextCount, savedCount);
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
    
    return contextCount;
  }, [currentSurveyResponses, selectedUser, mode]);
  
  return {
    responseCount: getResponseCount(),
    hasLoadedFromDb: hasLoadedFromDb.current
  };
};