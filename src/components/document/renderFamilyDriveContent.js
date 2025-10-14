/**
 * Helper functions for FamilyAllieDrive component
 * This file contains the renderContent function
 */
import React from 'react';
import { Search, FileText } from 'lucide-react';

/**
 * Renders the main content of the Family Drive based on current state
 * 
 * @param {Object} props All the component state and handlers needed for rendering
 * @returns {JSX.Element} The rendered content
 */
export const renderFamilyDriveContent = (props) => {
  // Use defaults for all props to prevent runtime errors
  const {
    loading = false,
    activeTab = 'all',
    providers = [],
    documents = [],
    viewMode = 'list',
    searchQuery = '',
    formatFileSize = (bytes) => bytes ? `${bytes} bytes` : 'Unknown',
    handleProviderClick = () => {},
    handleDocumentClick = () => {},
    handleDownloadDocument = () => {},
    handleDeleteItemClick = () => {},
    renderProviderCard = (item) => <div key={item.id}>Provider Card</div>,
    renderDocumentCard = (item) => <div key={item.id}>Document Card</div>
  } = props || {};

  // If still loading, show loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-600">Loading family data...</span>
      </div>
    );
  }

  // Combine and filter items based on active tab and search query
  let items = [];
  
  if (activeTab === 'all' || activeTab === 'providers') {
    items = [...items, ...providers];
  }
  
  if (activeTab === 'all' || activeTab === 'documents') {
    items = [...items, ...documents];
  }
  
  // Filter by specific type if needed
  if (!['all', 'providers', 'documents'].includes(activeTab)) {
    items = items.filter(item => 
      (item.type === activeTab) || 
      (item.category === activeTab)
    );
  }
  
  // Apply search filtering
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    items = items.filter(item => {
      // For providers
      if (item.itemType === 'provider') {
        return (
          (item.name && item.name.toLowerCase().includes(query)) ||
          (item.specialty && item.specialty.toLowerCase().includes(query)) ||
          (item.notes && item.notes.toLowerCase().includes(query))
        );
      }
      // For documents
      else {
        return (
          (item.title && item.title.toLowerCase().includes(query)) ||
          (item.description && item.description.toLowerCase().includes(query))
        );
      }
    });
  }

  // If no items found
  if (items.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Search size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {searchQuery 
            ? `No results found for "${searchQuery}". Try a different search term.` 
            : "There are no items in this category yet. Use the + button to add a new item."}
        </p>
      </div>
    );
  }

  // Display items in the selected view mode
  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4' : 'divide-y'}>
      {items.map(item => {
        if (item.itemType === 'provider') {
          return renderProviderCard(item, viewMode);
        } else {
          return renderDocumentCard(item, viewMode);
        }
      })}
    </div>
  );
};

export default renderFamilyDriveContent;