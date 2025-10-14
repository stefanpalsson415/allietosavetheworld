// src/components/document/SimpleProviderDirectory.jsx - SIMPLIFIED
import React, { useState, useEffect } from 'react';
// Import only the necessary icons
import { User, Phone, Mail, MapPin, Search } from 'lucide-react';

// A simplified provider directory that only uses localStorage
// and doesn't depend on Firestore access
const SimpleProviderDirectory = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Simplified provider categories/types
  const providerTypes = [
    { id: 'medical', name: 'Medical', icon: <User size={16} className="text-red-500" /> },
    { id: 'education', name: 'Education', icon: <User size={16} className="text-blue-500" /> },
    { id: 'childcare', name: 'Childcare', icon: <User size={16} className="text-purple-500" /> },
    { id: 'other', name: 'Other', icon: <User size={16} className="text-gray-500" /> }
  ];

  // Load providers from localStorage
  useEffect(() => {
    const loadProviders = () => {
      setLoading(true);
      
      // Function to load and combine providers from all available sources
      const getProvidersFromAllSources = () => {
        const providers = [];
        
        // 1. Check localProviders in localStorage
        try {
          const localProviders = localStorage.getItem('localProviders');
          if (localProviders) {
            const parsed = JSON.parse(localProviders);
            if (Array.isArray(parsed)) {
              parsed.forEach(provider => {
                if (!providers.some(p => p.id === provider.id)) {
                  providers.push({
                    ...provider,
                    source: 'localStorage'
                  });
                }
              });
            }
          }
        } catch (e) {
          console.error('Error parsing localProviders:', e);
        }
        
        // 2. Check window.allieCreatedProviders
        if (window.allieCreatedProviders && Array.isArray(window.allieCreatedProviders)) {
          window.allieCreatedProviders.forEach(provider => {
            if (!providers.some(p => p.id === provider.id)) {
              providers.push({
                ...provider,
                source: 'allieCreatedProviders'
              });
            }
          });
        }
        
        // 3. Check lastProvider
        try {
          const lastProvider = localStorage.getItem('lastProvider');
          if (lastProvider) {
            const parsed = JSON.parse(lastProvider);
            if (parsed && !providers.some(p => p.id === parsed.id)) {
              providers.push({
                ...parsed,
                source: 'lastProvider'
              });
            }
          }
        } catch (e) {
          console.error('Error parsing lastProvider:', e);
        }
        
        // Create a test provider if none found
        if (providers.length === 0) {
          const testProvider = {
            id: `test-${Date.now()}`,
            name: 'Sample Provider (Auto-Created)',
            type: 'medical',
            specialty: 'General Practitioner',
            notes: 'This is an automatically generated provider for testing.',
            createdAt: new Date().toISOString(),
            source: 'auto-generated'
          };
          
          providers.push(testProvider);
          
          // Save to localStorage for future use
          try {
            localStorage.setItem('localProviders', JSON.stringify([testProvider]));
            if (!window.allieCreatedProviders) window.allieCreatedProviders = [];
            window.allieCreatedProviders.push(testProvider);
          } catch (e) {
            console.error('Error saving test provider:', e);
          }
        }
        
        return providers;
      };
      
      // Get all providers
      const allProviders = getProvidersFromAllSources();
      console.log(`Found ${allProviders.length} providers from all sources`);
      
      // Update state
      setProviders(allProviders);
      setLoading(false);
    };
    
    // Load providers initially
    loadProviders();
    
    // Set up event listener for provider changes
    const handleProviderAdded = () => {
      console.log('Provider added event detected, reloading providers');
      loadProviders();
    };
    
    window.addEventListener('provider-added', handleProviderAdded);
    window.addEventListener('directory-refresh-needed', handleProviderAdded);
    
    // Clean up
    return () => {
      window.removeEventListener('provider-added', handleProviderAdded);
      window.removeEventListener('directory-refresh-needed', handleProviderAdded);
    };
  }, []);
  
  // Add a test provider directly from the component
  const addTestProvider = () => {
    const testProvider = {
      id: `test-${Date.now()}`,
      name: `Dr. Test ${new Date().toLocaleTimeString()}`,
      type: 'medical',
      specialty: 'Test Provider',
      phone: '(555) 123-4567',
      email: 'test@example.com',
      notes: 'Added directly from the component',
      createdAt: new Date().toISOString(),
      source: 'component-added'
    };
    
    // Update state
    setProviders(prev => [...prev, testProvider]);
    
    // Save to localStorage
    try {
      const localProviders = localStorage.getItem('localProviders');
      let allProviders = [];
      
      if (localProviders) {
        allProviders = JSON.parse(localProviders);
        if (!Array.isArray(allProviders)) allProviders = [];
      }
      
      allProviders.push(testProvider);
      localStorage.setItem('localProviders', JSON.stringify(allProviders));
      
      // Also update window.allieCreatedProviders
      if (!window.allieCreatedProviders) window.allieCreatedProviders = [];
      window.allieCreatedProviders.push(testProvider);
      
      // Dispatch events
      window.dispatchEvent(new CustomEvent('provider-added', {
        detail: { provider: testProvider }
      }));
    } catch (e) {
      console.error('Error saving test provider:', e);
    }
  };
  
  // Filtered providers
  const filteredProviders = providers.filter(provider => {
    // Filter by category
    if (categoryFilter !== 'all' && provider.type !== categoryFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (provider.name && provider.name.toLowerCase().includes(query)) ||
        (provider.specialty && provider.specialty.toLowerCase().includes(query)) ||
        (provider.notes && provider.notes.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Provider detail modal
  const renderProviderDetail = () => {
    if (!selectedProvider) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                {selectedProvider.name?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{selectedProvider.name}</h2>
                <p className="text-gray-600">{selectedProvider.specialty}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedProvider(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            {selectedProvider.phone && (
              <div className="flex items-center">
                <Phone size={18} className="mr-3 text-gray-400" />
                <span>{selectedProvider.phone}</span>
              </div>
            )}
            
            {selectedProvider.email && (
              <div className="flex items-center">
                <Mail size={18} className="mr-3 text-gray-400" />
                <span>{selectedProvider.email}</span>
              </div>
            )}
            
            {selectedProvider.address && (
              <div className="flex items-start">
                <MapPin size={18} className="mr-3 text-gray-400 mt-1" />
                <span>{selectedProvider.address}</span>
              </div>
            )}
            
            {selectedProvider.notes && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <p className="text-gray-600">{selectedProvider.notes}</p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t text-xs text-gray-400">
              <p>Source: {selectedProvider.source}</p>
              {selectedProvider.createdAt && (
                <p>Created: {new Date(selectedProvider.createdAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Get provider type display info
  const getProviderTypeInfo = (typeId) => {
    return providerTypes.find(type => type.id === typeId) || providerTypes.find(type => type.id === 'other');
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-medium flex items-center">
            <User size={20} className="mr-2 text-purple-500" />
            Provider Directory (Local)
          </h2>
          <p className="text-sm text-gray-500">
            Manages providers stored in local browser storage
          </p>
        </div>
        
        <button
          onClick={addTestProvider}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Add Test Provider
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
              placeholder="Search providers..."
            />
          </div>
          
          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 rounded-md ${
                categoryFilter === 'all' 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setCategoryFilter('all')}
            >
              All
            </button>
            
            {providerTypes.map(type => (
              <button
                key={type.id}
                className={`px-3 py-1 rounded-md flex items-center ${
                  categoryFilter === type.id 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setCategoryFilter(type.id)}
              >
                <span className="mr-1">{type.icon}</span>
                {type.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Providers list */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-black rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading providers...</p>
        </div>
      ) : filteredProviders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map(provider => (
            <div 
              key={provider.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedProvider(provider)}
            >
              <div className="flex items-start space-x-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-medium">
                    {provider.name?.charAt(0)?.toUpperCase() || (
                      getProviderTypeInfo(provider.type)?.icon || <User size={16} />
                    )}
                  </span>
                </div>
                
                <div>
                  <h3 className="font-medium text-md mb-1">{provider.name}</h3>
                  <p className="text-sm text-gray-600">{provider.specialty}</p>
                  
                  {provider.phone && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center">
                      <Phone size={14} className="mr-1" />
                      {provider.phone}
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-2">
                    Source: {provider.source}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-gray-50 rounded-lg">
          <User size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No providers found</p>
          <button
            onClick={addTestProvider}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Sample Provider
          </button>
        </div>
      )}
      
      {/* Provider detail modal */}
      {renderProviderDetail()}
    </div>
  );
};

export default SimpleProviderDirectory;