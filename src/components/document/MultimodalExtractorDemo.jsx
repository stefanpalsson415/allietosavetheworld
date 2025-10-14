import React, { useState } from 'react';
import MultimodalContentExtractor from './MultimodalContentExtractor';

/**
 * MultimodalExtractorDemo Component
 * 
 * A demo component showcasing the MultimodalContentExtractor 
 * with tabs for different analysis types
 */
const MultimodalExtractorDemo = () => {
  const [activeTab, setActiveTab] = useState('event');
  const [extractionResults, setExtractionResults] = useState({
    event: null,
    medical: null,
    document: null
  });

  const handleExtractionComplete = (type, results) => {
    setExtractionResults(prev => ({
      ...prev,
      [type]: results
    }));
  };

  const renderTab = (tabKey, label) => (
    <button
      className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === tabKey 
        ? 'bg-white border border-b-0 text-blue-600' 
        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
      onClick={() => setActiveTab(tabKey)}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-bold">Multimodal Understanding Demo</h1>
          <p className="text-gray-600 mt-2">
            Upload documents, images, or other files to extract structured information using our
            multimodal understanding pipeline.
          </p>
        </div>

        <div className="border-b">
          <div className="flex px-6">
            {renderTab('event', 'Event Extraction')}
            {renderTab('medical', 'Medical Document')}
            {renderTab('document', 'General Document')}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'event' && (
            <MultimodalContentExtractor
              analysisType="event"
              onExtractionComplete={(results) => handleExtractionComplete('event', results)}
              allowMultipleFiles={true}
              context={{
                preferredEventTypes: ['appointment', 'meeting', 'activity', 'party'],
                currentDateTime: new Date().toISOString()
              }}
            />
          )}

          {activeTab === 'medical' && (
            <MultimodalContentExtractor
              analysisType="medical"
              onExtractionComplete={(results) => handleExtractionComplete('medical', results)}
              allowMultipleFiles={false}
              context={{
                lookForMedications: true,
                lookForAppointments: true
              }}
            />
          )}

          {activeTab === 'document' && (
            <MultimodalContentExtractor
              analysisType="document"
              onExtractionComplete={(results) => handleExtractionComplete('document', results)}
              allowMultipleFiles={false}
              context={{
                extractSummary: true,
                extractKeywords: true
              }}
            />
          )}
        </div>

        {/* Usage examples section */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <h2 className="text-lg font-semibold mb-2">Usage Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded border border-blue-100">
              <h3 className="font-medium text-blue-800">Event Extraction</h3>
              <p className="text-sm mt-1">Upload event invitations, calendar screenshots, or flyers to extract event details.</p>
            </div>
            <div className="p-3 bg-green-50 rounded border border-green-100">
              <h3 className="font-medium text-green-800">Medical Documents</h3>
              <p className="text-sm mt-1">Upload prescription images, appointment cards, or medical reports to extract key information.</p>
            </div>
            <div className="p-3 bg-purple-50 rounded border border-purple-100">
              <h3 className="font-medium text-purple-800">General Documents</h3>
              <p className="text-sm mt-1">Upload any document to extract its content, summary, and keywords.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultimodalExtractorDemo;