import React, { useState, useEffect, useContext } from 'react';
import { FamilyContext } from '../../contexts/FamilyContext';
import MedicationService from '../../services/MedicationManager';
import MedicationList from './MedicationList';
import MedicationDetail from './MedicationDetail';
import MedicationScheduler from './MedicationScheduler';
import MedicationReminders from './MedicationReminders';
import { Tab } from '@headlessui/react';

function MedicationManager() {
  const { selectedFamilyMember } = useContext(FamilyContext);
  const [medications, setMedications] = useState([]);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [view, setView] = useState('list'); // list, detail, create, schedule
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [adherenceStats, setAdherenceStats] = useState(null);

  useEffect(() => {
    if (selectedFamilyMember) {
      loadMedications();
    }
  }, [selectedFamilyMember]);

  useEffect(() => {
    if (selectedMedication) {
      loadSchedules();
    }
  }, [selectedMedication]);

  const loadMedications = async () => {
    if (!selectedFamilyMember) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const meds = await MedicationService.getMedicationsByFamilyMember(
        selectedFamilyMember.id, 
        true // Active medications only
      );
      setMedications(meds);
      
      // Load adherence statistics for the past 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const stats = await MedicationService.getMedicationAdherenceStats(
        selectedFamilyMember.id,
        startDate,
        endDate
      );
      setAdherenceStats(stats);
      
    } catch (err) {
      console.error('Error loading medications:', err);
      setError('Failed to load medications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchedules = async () => {
    if (!selectedMedication) return;
    
    try {
      const medicationSchedules = await MedicationService.getSchedulesForMedication(
        selectedMedication.id
      );
      setSchedules(medicationSchedules);
    } catch (err) {
      console.error('Error loading medication schedules:', err);
      setError('Failed to load medication schedules.');
    }
  };

  const handleCreateMedication = async (medicationData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const medicationId = await MedicationService.createMedication({
        ...medicationData,
        familyMemberId: selectedFamilyMember.id
      });
      
      await loadMedications();
      
      // Select the newly created medication
      const newMedication = await MedicationService.getMedicationById(medicationId);
      setSelectedMedication(newMedication);
      setView('detail');
    } catch (err) {
      console.error('Error creating medication:', err);
      setError('Failed to create medication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMedication = async (medicationId, medicationData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await MedicationService.updateMedication(medicationId, medicationData);
      await loadMedications();
      
      // Update the selected medication
      const updatedMedication = await MedicationService.getMedicationById(medicationId);
      setSelectedMedication(updatedMedication);
    } catch (err) {
      console.error('Error updating medication:', err);
      setError('Failed to update medication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMedication = async (medicationId) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await MedicationService.deleteMedication(medicationId);
      await loadMedications();
      
      // Reset selected medication and return to list view
      setSelectedMedication(null);
      setView('list');
    } catch (err) {
      console.error('Error deleting medication:', err);
      setError('Failed to delete medication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSchedule = async (scheduleData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await MedicationService.createMedicationSchedule({
        ...scheduleData,
        medicationId: selectedMedication.id,
        familyMemberId: selectedFamilyMember.id
      });
      
      await loadSchedules();
    } catch (err) {
      console.error('Error creating medication schedule:', err);
      setError('Failed to create schedule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSchedule = async (scheduleId, scheduleData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await MedicationService.updateMedicationSchedule(scheduleId, scheduleData);
      await loadSchedules();
    } catch (err) {
      console.error('Error updating medication schedule:', err);
      setError('Failed to update schedule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await MedicationService.deleteMedicationSchedule(scheduleId);
      await loadSchedules();
    } catch (err) {
      console.error('Error deleting medication schedule:', err);
      setError('Failed to delete schedule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMedication = (medication) => {
    setSelectedMedication(medication);
    setView('detail');
  };

  const handleBack = () => {
    if (view === 'detail' || view === 'create') {
      setView('list');
      setSelectedMedication(null);
    } else if (view === 'schedule') {
      setView('detail');
    }
  };

  if (!selectedFamilyMember) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center text-gray-600">Please select a family member to manage their medications.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {selectedFamilyMember.name}'s Medications
        </h2>
        {adherenceStats && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">30-day adherence rate: </span>
            <span className={`font-bold ${adherenceStats.adherenceRate >= 80 ? 'text-green-600' : adherenceStats.adherenceRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {adherenceStats.adherenceRate.toFixed(1)}%
            </span>
            <span className="ml-2">({adherenceStats.taken} taken, {adherenceStats.skipped} skipped)</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded mx-4 my-2">
          {error}
        </div>
      )}
      
      <Tab.Group>
        <Tab.List className="flex border-b border-gray-200">
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
          >
            Medications
          </Tab>
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
          >
            Reminders
          </Tab>
        </Tab.List>
        
        <Tab.Panels>
          <Tab.Panel>
            {view === 'list' && (
              <div className="p-4">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setView('create')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Medication
                  </button>
                </div>
                <MedicationList 
                  medications={medications}
                  onSelectMedication={handleSelectMedication}
                  isLoading={isLoading}
                />
              </div>
            )}
            
            {view === 'detail' && selectedMedication && (
              <MedicationDetail 
                medication={selectedMedication}
                schedules={schedules}
                onUpdateMedication={handleUpdateMedication}
                onDeleteMedication={handleDeleteMedication}
                onCreateSchedule={() => setView('schedule')}
                onUpdateSchedule={handleUpdateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onBack={handleBack}
                isLoading={isLoading}
              />
            )}
            
            {view === 'create' && (
              <div className="p-4">
                <button
                  onClick={handleBack}
                  className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to medications
                </button>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Medication</h3>
                <MedicationDetail 
                  isNewMedication={true}
                  onCreateMedication={handleCreateMedication}
                  onBack={handleBack}
                  isLoading={isLoading}
                />
              </div>
            )}
            
            {view === 'schedule' && selectedMedication && (
              <div className="p-4">
                <button
                  onClick={handleBack}
                  className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to medication details
                </button>
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Create Schedule for {selectedMedication.name}
                </h3>
                <MedicationScheduler 
                  medication={selectedMedication}
                  onCreateSchedule={handleCreateSchedule}
                  isLoading={isLoading}
                />
              </div>
            )}
          </Tab.Panel>
          
          <Tab.Panel>
            <div className="p-4">
              <MedicationReminders 
                familyMemberId={selectedFamilyMember.id}
                onRefresh={loadMedications}
              />
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

export default MedicationManager;