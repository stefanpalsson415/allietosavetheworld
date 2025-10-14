import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

function SuppliesManager({ supplies, onMarkSupplyItem, isLoading }) {
  const [filter, setFilter] = useState('all'); // all, urgent, optional
  const [shoppingList, setShoppingList] = useState([]);
  const [showShoppingList, setShowShoppingList] = useState(false);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (supplies.length === 0) {
    return (
      <div className="text-center py-10">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No supplies needed</h3>
        <p className="mt-1 text-sm text-gray-500">All your school supplies are ready.</p>
      </div>
    );
  }
  
  // Apply filters
  const filteredSupplies = supplies.filter(supply => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return supply.item.urgency >= 7;
    if (filter === 'optional') return supply.item.optional;
    return true;
  });
  
  // Group by events
  const groupedSupplies = filteredSupplies.reduce((groups, supply) => {
    const eventId = supply.eventId;
    
    if (!groups[eventId]) {
      groups[eventId] = {
        eventTitle: supply.eventTitle,
        eventDate: supply.eventDate,
        studentName: supply.studentName,
        schoolName: supply.schoolName,
        items: []
      };
    }
    
    groups[eventId].items.push(supply.item);
    return groups;
  }, {});
  
  // Sort events by date
  const sortedEvents = Object.keys(groupedSupplies).sort((a, b) => {
    const dateA = groupedSupplies[a].eventDate.toDate();
    const dateB = groupedSupplies[b].eventDate.toDate();
    return dateA - dateB;
  });
  
  const handleAddToShoppingList = (item) => {
    if (!shoppingList.find(i => i.id === item.id)) {
      setShoppingList([...shoppingList, item]);
    }
  };
  
  const handleRemoveFromShoppingList = (itemId) => {
    setShoppingList(shoppingList.filter(item => item.id !== itemId));
  };
  
  const handleGenerateShoppingList = () => {
    // Here you would integrate with shopping services, but for now we'll just display the list
    setShowShoppingList(true);
  };
  
  const handleExportToShoppingApp = (app) => {
    // In a real implementation, this would integrate with shopping apps like:
    // - Amazon
    // - Walmart
    // - Target
    // - Instacart
    // - etc.
    
    alert(`Export to ${app} would happen here with ${shoppingList.length} items`);
    
    // In a real implementation, you'd use something like:
    // window.open(`https://amazon.com/list?items=${encodeURIComponent(JSON.stringify(shoppingList))}`, '_blank');
  };
  
  const handleClearShoppingList = () => {
    setShoppingList([]);
    setShowShoppingList(false);
  };
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">School Supplies</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'urgent' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Urgent
          </button>
          <button
            onClick={() => setFilter('optional')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'optional' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Optional
          </button>
        </div>
      </div>
      
      {/* Shopping list controls */}
      <div className="mb-6 flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div>
          <h4 className="text-sm font-medium text-blue-800">Shopping List</h4>
          <p className="text-xs text-blue-600">{shoppingList.length} items selected</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleGenerateShoppingList}
            disabled={shoppingList.length === 0}
            className={`px-3 py-1 text-sm rounded ${
              shoppingList.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Generate List
          </button>
          <button
            onClick={handleClearShoppingList}
            disabled={shoppingList.length === 0}
            className={`px-3 py-1 text-sm rounded ${
              shoppingList.length > 0
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* Shopping list modal */}
      {showShoppingList && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-800">Your Shopping List</h4>
            <button
              onClick={() => setShowShoppingList(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="divide-y divide-gray-200">
            {shoppingList.map(item => (
              <div key={item.id} className="py-2 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <button
                  onClick={() => handleRemoveFromShoppingList(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Export to Shopping App</h5>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExportToShoppingApp('Amazon')}
                className="px-3 py-1 text-sm rounded bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Amazon
              </button>
              <button
                onClick={() => handleExportToShoppingApp('Walmart')}
                className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Walmart
              </button>
              <button
                onClick={() => handleExportToShoppingApp('Target')}
                className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Target
              </button>
              <button
                onClick={() => handleExportToShoppingApp('Instacart')}
                className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700"
              >
                Instacart
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Supplies list by event */}
      <div className="space-y-6">
        {sortedEvents.map(eventId => {
          const event = groupedSupplies[eventId];
          
          return (
            <div key={eventId} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4">
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{event.eventTitle}</h4>
                    <p className="text-xs text-gray-500">
                      {event.studentName} • {event.schoolName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {format(event.eventDate.toDate(), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(event.eventDate.toDate(), 'EEEE')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {event.items.map(item => (
                  <div key={item.id} className="p-4 flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h5 className="text-sm font-medium text-gray-800 mr-2">{item.name}</h5>
                        {item.optional && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Optional
                          </span>
                        )}
                        {item.urgency >= 7 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Urgent
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <span>Quantity: {item.quantity}</span>
                        {item.category && (
                          <>
                            <span className="mx-1">•</span>
                            <span>Category: {item.category}</span>
                          </>
                        )}
                        {item.estimatedCost && (
                          <>
                            <span className="mx-1">•</span>
                            <span>Est. Cost: ${item.estimatedCost}</span>
                          </>
                        )}
                      </div>
                      
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">{item.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!item.acquired && (
                        <button
                          onClick={() => handleAddToShoppingList(item)}
                          className={`px-2 py-1 text-xs rounded border ${
                            shoppingList.find(i => i.id === item.id)
                              ? 'bg-green-100 border-green-300 text-green-800'
                              : 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200'
                          }`}
                          disabled={shoppingList.find(i => i.id === item.id)}
                        >
                          {shoppingList.find(i => i.id === item.id) ? 'Added' : 'Add to List'}
                        </button>
                      )}
                      
                      {item.purchaseLink && (
                        <a
                          href={item.purchaseLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 text-xs rounded border border-purple-300 bg-purple-100 text-purple-800 hover:bg-purple-200"
                        >
                          Buy Now
                        </a>
                      )}
                      
                      <button
                        onClick={() => onMarkSupplyItem(eventId, item.id, !item.acquired)}
                        className={`px-2 py-1 text-xs rounded border ${
                          item.acquired
                            ? 'bg-green-100 border-green-300 text-green-800'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {item.acquired ? 'Acquired' : 'Mark as Acquired'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

SuppliesManager.propTypes = {
  supplies: PropTypes.array.isRequired,
  onMarkSupplyItem: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

SuppliesManager.defaultProps = {
  isLoading: false
};

export default SuppliesManager;