import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import NotionDashboard from './NotionDashboard';
import LoadingScreen from '../common/LoadingScreen';

const DashboardWrapper = () => {
  const navigate = useNavigate();
  const { currentUser, availableFamilies, loadFamilyData, loadAllFamilies } = useAuth();
  const { familyId, familyMembers, selectedUser, selectFamilyMember } = useFamily();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log('DashboardWrapper: Initializing...', { currentUser, familyId, selectedUser, hasInitialized });

        // If no user, redirect to login
        if (!currentUser) {
          console.log('DashboardWrapper: No user, redirecting to login');
          navigate('/login');
          return;
        }

        // If we already have family data, we're done initializing
        if (familyId && familyMembers && familyMembers.length > 0) {
          console.log('DashboardWrapper: Family data already available');
          setHasInitialized(true);
          setLoading(false);
          return;
        }

        // Prevent duplicate initialization attempts
        if (hasInitialized) {
          console.log('DashboardWrapper: Already initialized, waiting for data...');
          return;
        }

        setHasInitialized(true);

        // If family is already loaded, just ensure we have a selected user
        if (familyId && familyMembers && familyMembers.length > 0) {
          console.log('DashboardWrapper: Family already loaded', { familyId, membersCount: familyMembers.length });
          
          // If no selected user, try to restore from localStorage or select the first one
          if (!selectedUser) {
            const savedUserId = localStorage.getItem('selectedUserId');
            const savedUser = savedUserId ? familyMembers.find(m => m.id === savedUserId) : null;
            const userToSelect = savedUser || familyMembers.find(m => m.role === 'parent') || familyMembers[0];
            
            console.log('DashboardWrapper: No selected user, selecting:', userToSelect?.name);
            localStorage.setItem('selectedUserId', userToSelect.id);
            await selectFamilyMember(userToSelect);
          }
          
          setLoading(false);
          return;
        }

        // Otherwise, we need to load families
        console.log('DashboardWrapper: Need to load family data...');
        
        // First, ensure families are loaded
        let families = availableFamilies;
        if (!families || families.length === 0) {
          console.log('DashboardWrapper: Loading all families for user...');
          families = await loadAllFamilies(currentUser.uid);
        }
        
        if (families && families.length > 0) {
          console.log('DashboardWrapper: Found families, loading first one...');
          const firstFamily = families[0];
          await loadFamilyData(firstFamily.familyId);
          console.log('DashboardWrapper: Family loaded successfully');
          
          // Don't set loading to false yet - let the second useEffect handle member selection
        } else {
          // No families available, redirect to onboarding
          console.log('DashboardWrapper: No families available, redirecting to onboarding');
          navigate('/onboarding');
          return;
        }
      } catch (err) {
        console.error('DashboardWrapper: Error initializing dashboard:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [currentUser, familyId, familyMembers, hasInitialized, navigate, loadAllFamilies, loadFamilyData]);

  // Wait for family member selection after family is loaded
  useEffect(() => {
    if (familyId && familyMembers && familyMembers.length > 0) {
      if (!selectedUser) {
        const savedUserId = localStorage.getItem('selectedUserId');
        const savedUser = savedUserId ? familyMembers.find(m => m.id === savedUserId) : null;
        const userToSelect = savedUser || familyMembers.find(m => m.role === 'parent') || familyMembers[0];
        
        console.log('DashboardWrapper: Auto-selecting family member:', userToSelect?.name);
        localStorage.setItem('selectedUserId', userToSelect.id);
        selectFamilyMember(userToSelect);
      }
      
      // Once we have family and members, we can stop loading
      setLoading(false);
    }
  }, [familyId, familyMembers, selectedUser]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg">
          <h2 className="text-xl font-semibold mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Only render dashboard when we have all required data
  if (!familyId || !selectedUser) {
    console.log('DashboardWrapper: Missing required data', { familyId, selectedUser });
    return <LoadingScreen />;
  }

  return <NotionDashboard />;
};

export default DashboardWrapper;