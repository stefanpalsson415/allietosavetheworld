import React, { useState, useEffect } from 'react';
import { User, X, Check, AlertCircle } from 'lucide-react';
import ProviderDirectory from '../document/ProviderDirectory';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFamily } from '../../contexts/FamilyContext';

/**
 * Provider Selector for Calendar Events
 * 
 * Allows selecting providers/babysitters for events
 * 
 * @param {Object} props
 * @param {Object} props.selectedProvider - Currently selected provider
 * @param {Function} props.onProviderSelected - Callback when a provider is selected
 * @param {Function} props.onClose - Callback when the selector is closed
 * @param {string} props.type - Type of provider to filter by (medical, childcare, etc.)
 * @param {boolean} props.isBabysitter - Whether selecting a babysitter (for date nights)
 */
const ProviderSelector = ({ 
  selectedProvider = null, 
  onProviderSelected, 
  onClose,
  type = null,
  isBabysitter = false
}) => {
  const { familyId } = useFamily();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load providers from Firebase
  useEffect(() => {
    const loadProviders = async () => {
      if (!familyId) return;
      
      try {
        setLoading(true);
        
        // Build query
        let providersQuery = query(
          collection(db, "familyProviders"),
          where("familyId", "==", familyId)
        );
        
        // Filter by type if specified
        if (type) {
          providersQuery = query(
            providersQuery,
            where("type", "==", type)
          );
        }
        
        // For babysitters, filter to childcare providers
        if (isBabysitter) {
          providersQuery = query(
            query(collection(db, "familyProviders"), 
            where("familyId", "==", familyId)),
            where("type", "==", "childcare")
          );
        }
        
        const querySnapshot = await getDocs(providersQuery);
        
        const loadedProviders = [];
        querySnapshot.forEach((doc) => {
          loadedProviders.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setProviders(loadedProviders);
        setLoading(false);
      } catch (error) {
        console.error("Error loading providers:", error);
        setError("Failed to load providers. Please try again.");
        setLoading(false);
      }
    };
    
    loadProviders();
  }, [familyId, type, isBabysitter]);
  
  // Handle provider selection
  const handleProviderSelected = (provider) => {
    if (onProviderSelected) {
      onProviderSelected(provider);
    }
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium">
            {isBabysitter ? 'Select Babysitter' : 'Select Provider'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto">
          {error ? (
            <div className="p-5 text-center">
              <AlertCircle size={24} className="mx-auto mb-3 text-red-500" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          ) : (
            <ProviderDirectory
              selectMode={true}
              onSelectProvider={handleProviderSelected}
              onClose={onClose}
              providers={providers}
              loadingProviders={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderSelector;