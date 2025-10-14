// src/components/dashboard/OnboardingHomePage.jsx
import React, { useState } from 'react';
import { Camera, MessageSquare, ClipboardList, ChevronRight, X } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import PhotoUploader from '../common/PhotoUploader';
import DatabaseService from '../../services/DatabaseService';

const OnboardingHomePage = ({ onStartSurvey }) => {
  const { selectedUser, familyMembers, updateMemberProfile } = useFamily();
  const { openDrawerWithPrompt } = useChatDrawer();
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleChatWithAllie = () => {
    // Open chat drawer with a welcome message
    openDrawerWithPrompt("Hi! I'm here to help you get started with your family dashboard. What would you like to know?", {
      context: { 
        isOnboarding: true,
        userName: selectedUser?.name 
      }
    });
  };
  
  const handleAddPhoto = () => {
    setShowPhotoUploader(true);
  };
  
  const handlePhotoUploaded = () => {
    setShowPhotoUploader(false);
    // Refresh the page or update the UI
    window.location.reload();
  };
  
  const handlePhotoChange = async (file) => {
    setIsUploading(true);
    try {
      if (!selectedUser?.id) {
        throw new Error('No user selected for photo upload');
      }
      
      // Upload the profile image
      const imageUrl = await DatabaseService.uploadProfileImage(selectedUser.id, file);
      
      // Update the member profile with the new image URL
      await updateMemberProfile(selectedUser.id, { profilePictureUrl: imageUrl });
      
      // Close the modal and refresh
      handlePhotoUploaded();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 transition-all duration-300">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            Welcome to Your Family Dashboard, {selectedUser?.name}! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Let's get started by setting up your family profile
          </p>
        </div>
        
        {/* Action Cards - Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
          {/* Add Profile Photo Card */}
          <button
            onClick={handleAddPhoto}
            className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Profile Photos</h3>
            <p className="text-sm text-gray-600">
              Personalize your family profiles with photos
            </p>
          </button>
          
          {/* Take Survey Card */}
          <button
            onClick={onStartSurvey}
            className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <ClipboardList className="w-6 h-6 text-green-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Take Initial Survey</h3>
            <p className="text-sm text-gray-600">
              Help us understand your family dynamics better
            </p>
            <div className="mt-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                10 minutes
              </span>
            </div>
          </button>
          
          {/* Chat with Allie Card */}
          <button
            onClick={handleChatWithAllie}
            className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat with Allie</h3>
            <p className="text-sm text-gray-600">
              Get personalized guidance for your family
            </p>
          </button>
        </div>
        
        {/* Family Members Preview */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Family Members</h2>
          <div className="flex flex-wrap gap-4">
            {familyMembers?.map((member) => (
              <div key={member.id} className="flex items-center space-x-3 bg-white rounded-lg px-4 py-3 min-w-[200px]">
                <div className="flex-shrink-0">
                  {member.profilePictureUrl ? (
                    <img 
                      src={member.profilePictureUrl} 
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
                {!member.profilePictureUrl && (
                  <span className="text-xs text-orange-600 font-medium whitespace-nowrap">Photo needed</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Why Get Started Section */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Why complete your profile?</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <p>Personalized recommendations</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <p>Better family insights</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <p>Unlock all features</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Photo Uploader Modal */}
      {showPhotoUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowPhotoUploader(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={isUploading}
            >
              <X size={20} />
            </button>
            <PhotoUploader
              currentPhoto={selectedUser?.profilePictureUrl}
              onPhotoChange={handlePhotoChange}
              title="Add Profile Photo"
              description={`Upload a photo for ${selectedUser?.name}`}
              size="large"
              allowCamera={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingHomePage;