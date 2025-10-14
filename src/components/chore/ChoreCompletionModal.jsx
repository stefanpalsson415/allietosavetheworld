import React, { useState } from 'react';
import { X, Camera, Upload, CheckCircle2, Smile, Clock, AlertCircle } from 'lucide-react';

const ChoreCompletionModal = ({ chore, onClose, onComplete }) => {
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('neutral');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle photo upload
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Call the onComplete callback with all the data
      await onComplete(chore.id, photo, notes, mood);
      
      // Close the modal on success
      onClose();
    } catch (error) {
      console.error('Error completing chore:', error);
      setError('There was a problem submitting your chore. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Mood options
  const moodOptions = [
    { value: 'veryEasy', label: 'Very Easy', emoji: '😄' },
    { value: 'easy', label: 'Easy', emoji: '🙂' },
    { value: 'neutral', label: 'Just Right', emoji: '😐' },
    { value: 'hard', label: 'Hard', emoji: '🙁' },
    { value: 'veryHard', label: 'Very Hard', emoji: '😫' }
  ];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Complete Chore</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Chore details */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-1">{chore.title || chore.name || "Complete Chore"}</h3>
            <p className="text-sm text-gray-700">{chore.description || chore.details || "Complete this chore to earn Palsson Bucks!"}</p>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Photo upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo Evidence (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                {photoPreview ? (
                  <div className="w-full">
                    <div className="relative w-full h-48 mb-2">
                      <img
                        src={photoPreview}
                        alt="Chore completion preview"
                        className="h-full w-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <label
                        htmlFor="photo-upload"
                        className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
                      >
                        Choose a different photo
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <Camera size={40} className="mx-auto text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="photo-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Upload a photo</span>
                        <input
                          id="photo-upload"
                          name="photo-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handlePhotoChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notes field */}
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Any details about how you completed this chore..."
              />
            </div>
            
            {/* Mood selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How was this chore? (Optional)
              </label>
              <div className="flex justify-between">
                {moodOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors ${
                      mood === option.value ? 'bg-blue-50 ring-2 ring-blue-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setMood(option.value)}
                  >
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <span className="text-xs text-center">{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Submit button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="mr-2" />
                    Mark as Complete
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChoreCompletionModal;