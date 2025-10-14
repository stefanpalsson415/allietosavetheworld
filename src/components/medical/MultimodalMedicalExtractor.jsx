import React, { useState } from 'react';
import { X, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import MultimodalContentExtractor from '../document/MultimodalContentExtractor';

/**
 * MultimodalMedicalExtractor Component
 * 
 * A specialized wrapper for MultimodalContentExtractor focused on medical documents
 * Provides pre-configured settings for medical document extraction
 * Shows a simplified UI for medical document upload and extraction
 */
const MultimodalMedicalExtractor = ({ 
  onExtractionComplete,
  onClose,
  title = "Extract Medical Information",
  showTitle = true,
  className
}) => {
  const { familyId } = useFamily();
  const { currentUser } = useAuth();

  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  // Handle extraction completion
  const handleExtractionComplete = (result, file) => {
    if (result.error) {
      setError(`Error processing file: ${result.error}`);
      return;
    }

    const medicalData = result.results?.analysis?.data || {};
    setExtractedData(medicalData);

    // Call the parent's completion handler
    if (onExtractionComplete) {
      onExtractionComplete(medicalData, file);
    }
  };

  // Render extracted information in a medical-friendly format
  const renderExtractedInformation = () => {
    if (!extractedData) return null;

    return (
      <div className="mt-6 p-4 border rounded bg-gray-50 text-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-blue-800">Extracted Medical Information</h3>
          <div className="flex items-center text-green-700 bg-green-50 px-2 py-1 rounded">
            <CheckCircle size={16} className="mr-1" />
            Successfully Extracted
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {extractedData.documentType && (
            <div>
              <span className="font-medium">Document Type:</span>{' '}
              {extractedData.documentType}
            </div>
          )}
          
          {extractedData.patientName && (
            <div>
              <span className="font-medium">Patient:</span>{' '}
              {extractedData.patientName}
            </div>
          )}

          {extractedData.providerName && (
            <div>
              <span className="font-medium">Provider:</span>{' '}
              {extractedData.providerName}
              {extractedData.providerSpecialty && ` (${extractedData.providerSpecialty})`}
            </div>
          )}

          {extractedData.date && (
            <div>
              <span className="font-medium">Date:</span>{' '}
              {new Date(extractedData.date).toLocaleDateString()}
            </div>
          )}

          {extractedData.location && (
            <div>
              <span className="font-medium">Location:</span>{' '}
              {extractedData.location}
            </div>
          )}
        </div>

        {extractedData.diagnosis && (
          <div className="mt-3">
            <span className="font-medium">Diagnosis:</span>{' '}
            {extractedData.diagnosis}
          </div>
        )}

        {extractedData.treatment && (
          <div className="mt-2">
            <span className="font-medium">Treatment:</span>{' '}
            {extractedData.treatment}
          </div>
        )}

        {extractedData.followUp && (
          <div className="mt-2">
            <span className="font-medium">Follow-up:</span>{' '}
            {extractedData.followUp}
          </div>
        )}

        {extractedData.medications && extractedData.medications.length > 0 && (
          <div className="mt-3">
            <div className="font-medium mb-1">Medications:</div>
            <ul className="pl-5 space-y-1 list-disc">
              {extractedData.medications.map((med, idx) => (
                <li key={idx}>
                  <strong>{med.name}</strong>
                  {med.dosage && ` - ${med.dosage}`}
                  {med.instructions && ` (${med.instructions})`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {extractedData.additionalInstructions && (
          <div className="mt-3">
            <span className="font-medium">Additional Instructions:</span>
            <div className="mt-1 p-2 bg-yellow-50 rounded-md">
              {extractedData.additionalInstructions}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg p-5 ${className || ''}`}>
      {/* Header with title and close button */}
      {(showTitle || onClose) && (
        <div className="flex justify-between items-center mb-4">
          {showTitle && (
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FileText size={20} className="mr-2 text-blue-600" />
              {title}
            </h2>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle size={18} className="mr-2" />
          {error}
        </div>
      )}
      
      {/* Content extractor */}
      <MultimodalContentExtractor
        analysisType="medical"
        onExtractionComplete={handleExtractionComplete}
        allowMultipleFiles={false}
        context={{
          userId: currentUser?.uid,
          familyId
        }}
      />

      {/* Display extracted information */}
      {renderExtractedInformation()}
    </div>
  );
};

export default MultimodalMedicalExtractor;