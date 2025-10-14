import React, { useState } from 'react';
import { X, AlertCircle, FileText, CheckCircle, GraduationCap, List, Book, Calendar } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import MultimodalUnderstandingService from '../../services/MultimodalUnderstandingService';
import MultimodalContentExtractor from '../document/MultimodalContentExtractor';

/**
 * MultimodalSchoolExtractor Component
 * 
 * A specialized wrapper for MultimodalContentExtractor focused on school documents
 * Provides pre-configured settings for school document extraction (permission slips,
 * homework assignments, project instructions, etc.)
 */
const MultimodalSchoolExtractor = ({ 
  onExtractionComplete,
  onClose,
  title = "Extract School Information",
  showTitle = true,
  studentId = null,
  className
}) => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();

  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  
  // Get the student name if studentId is provided
  const studentName = studentId ? 
    (familyMembers.find(member => member.id === studentId)?.name || '') : '';

  // Handle extraction completion
  const handleExtractionComplete = (result, file) => {
    if (result.error) {
      setError(`Error processing file: ${result.error}`);
      return;
    }

    const schoolData = result.results?.analysis?.data || {};
    setExtractedData(schoolData);

    // Call the parent's completion handler
    if (onExtractionComplete) {
      onExtractionComplete(schoolData, file);
    }
  };

  // Render extracted information in a school-friendly format
  const renderExtractedInformation = () => {
    if (!extractedData) return null;

    return (
      <div className="mt-6 p-4 border rounded bg-gray-50 text-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-blue-800">Extracted School Information</h3>
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
          
          {extractedData.studentName && (
            <div>
              <span className="font-medium">Student:</span>{' '}
              {extractedData.studentName}
            </div>
          )}

          {extractedData.schoolName && (
            <div>
              <span className="font-medium">School:</span>{' '}
              {extractedData.schoolName}
            </div>
          )}

          {extractedData.className && (
            <div>
              <span className="font-medium">Class:</span>{' '}
              {extractedData.className}
            </div>
          )}
          
          {extractedData.teacherName && (
            <div>
              <span className="font-medium">Teacher:</span>{' '}
              {extractedData.teacherName}
            </div>
          )}

          {extractedData.eventDate && (
            <div>
              <span className="font-medium">Date:</span>{' '}
              {new Date(extractedData.eventDate).toLocaleDateString()}
            </div>
          )}
          
          {extractedData.dueDate && (
            <div>
              <span className="font-medium">Due Date:</span>{' '}
              {new Date(extractedData.dueDate).toLocaleDateString()}
            </div>
          )}
          
          {extractedData.eventType && (
            <div>
              <span className="font-medium">Event Type:</span>{' '}
              {extractedData.eventType}
            </div>
          )}
        </div>

        {extractedData.description && (
          <div className="mt-3">
            <span className="font-medium">Description:</span>
            <div className="mt-1 p-2 bg-white rounded-md">
              {extractedData.description}
            </div>
          </div>
        )}

        {extractedData.permissionSlipRequired && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="font-medium">Permission Slip Required</div>
            {extractedData.paymentRequired && (
              <div className="mt-1">
                <span className="font-medium">Payment Required:</span> ${extractedData.paymentAmount || 'unspecified'}
                {extractedData.paymentDueDate && ` (Due: ${new Date(extractedData.paymentDueDate).toLocaleDateString()})`}
              </div>
            )}
          </div>
        )}

        {extractedData.suppliesList && extractedData.suppliesList.length > 0 && (
          <div className="mt-3">
            <div className="font-medium mb-1">Required Supplies:</div>
            <ul className="pl-5 space-y-1 list-disc bg-white p-2 rounded-md">
              {extractedData.suppliesList.map((item, idx) => (
                <li key={idx}>
                  {typeof item === 'string' ? item : item.name}
                  {item.quantity && ` (Qty: ${item.quantity})`}
                  {item.notes && ` - ${item.notes}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {extractedData.specialRequirements && extractedData.specialRequirements.length > 0 && (
          <div className="mt-3">
            <div className="font-medium mb-1">Special Requirements:</div>
            <ul className="pl-5 space-y-1 list-disc bg-white p-2 rounded-md">
              {extractedData.specialRequirements.map((req, idx) => (
                <li key={idx}>
                  {typeof req === 'string' ? req : req.description}
                  {req.type && ` (${req.type})`}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {extractedData.parentParticipationNeeded && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="font-medium">Parent Participation Needed</div>
            {extractedData.parentParticipationDetails && (
              <div className="mt-1">{extractedData.parentParticipationDetails}</div>
            )}
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
              <GraduationCap size={20} className="mr-2 text-blue-600" />
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
        analysisType="school"
        onExtractionComplete={handleExtractionComplete}
        allowMultipleFiles={false}
        context={{
          userId: currentUser?.uid,
          familyId,
          studentId,
          studentName
        }}
      />

      {/* Display extracted information */}
      {renderExtractedInformation()}
    </div>
  );
};

export default MultimodalSchoolExtractor;