import React, { useState, useEffect } from 'react';
import UserAvatar from '../common/UserAvatar';
import voiceEnrollmentService from '../../services/voice/VoiceEnrollmentService';

/**
 * VoiceEnrollmentFlow - Guides participants through voice enrollment
 *
 * This component:
 * 1. Shows enrollment progress for each participant
 * 2. Displays prompts for natural speech samples
 * 3. Records 3 voice samples per person (5 seconds each)
 * 4. Extracts voice features and creates voiceprint
 * 5. Saves to Firestore for future auto-detection
 */
const VoiceEnrollmentFlow = ({ participants, familyId, onComplete, onSkip }) => {
  const [currentParticipantIndex, setCurrentParticipantIndex] = useState(0);
  const [enrollmentProgress, setEnrollmentProgress] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentSample, setCurrentSample] = useState(0);
  const [error, setError] = useState(null);
  const [enrolledProfiles, setEnrolledProfiles] = useState([]);

  const currentParticipant = participants[currentParticipantIndex];
  const totalSamplesNeeded = 3;

  useEffect(() => {
    // Initialize voice enrollment service
    voiceEnrollmentService.initialize();
  }, []);

  // Enrollment prompts for natural speech
  const prompts = [
    `${currentParticipant?.name}, please say: "Hello, I'm ${currentParticipant?.name}"`,
    `${currentParticipant?.name}, please count from 1 to 10`,
    `${currentParticipant?.name}, tell me about your favorite hobby`
  ];

  const handleStartRecording = async () => {
    setIsRecording(true);
    setError(null);

    try {
      // Record voice sample (5 seconds)
      const audioData = await voiceEnrollmentService.recordVoiceSample(5000);

      // Extract voice features
      const features = await voiceEnrollmentService.extractVoiceFeatures(audioData);

      console.log(`✅ Sample ${currentSample + 1} recorded for ${currentParticipant.name}`);

      // Move to next sample
      if (currentSample < totalSamplesNeeded - 1) {
        setCurrentSample(currentSample + 1);
      } else {
        // All samples collected - create voiceprint
        await completeEnrollment();
      }

      setIsRecording(false);

    } catch (error) {
      console.error('Recording error:', error);
      setError(error.message);
      setIsRecording(false);
    }
  };

  const completeEnrollment = async () => {
    try {
      // Enroll participant with progress callback
      const profile = await voiceEnrollmentService.enrollParticipant(
        currentParticipant,
        (progress) => setEnrollmentProgress(progress)
      );

      // Save to Firestore
      await voiceEnrollmentService.saveVoiceProfile(
        familyId,
        currentParticipant.id,
        profile.voiceprint
      );

      console.log(`🎉 Enrollment complete for ${currentParticipant.name}`);

      // Add to enrolled profiles list
      setEnrolledProfiles(prev => [...prev, currentParticipant]);

      // Move to next participant or complete
      if (currentParticipantIndex < participants.length - 1) {
        setCurrentParticipantIndex(currentParticipantIndex + 1);
        setCurrentSample(0);
        setEnrollmentProgress(null);
      } else {
        // All participants enrolled!
        onComplete(enrolledProfiles);
      }

    } catch (error) {
      console.error('Enrollment error:', error);
      setError(error.message);
    }
  };

  const handleSkip = () => {
    if (window.confirm('Skip voice enrollment? You\'ll need to manually select speakers during the interview.')) {
      onSkip();
    }
  };

  return (
    <div className="voice-enrollment-flow fixed inset-0 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center z-50 p-4">
      <div className="enrollment-card bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            🎤 Voice Enrollment
          </h2>
          <p className="text-gray-600">
            Let's learn everyone's voice for automatic speaker detection
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Participant {currentParticipantIndex + 1} of {participants.length}
            </span>
            <span className="text-sm text-gray-500">
              {enrolledProfiles.length} enrolled
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentParticipantIndex + (currentSample / totalSamplesNeeded)) / participants.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Participant */}
        {currentParticipant && (
          <div className="text-center mb-8">
            <UserAvatar user={currentParticipant} size={120} />
            <h3 className="text-2xl font-bold text-gray-900 mt-4">
              {currentParticipant.name}
            </h3>
            <p className="text-sm text-gray-500">
              {currentParticipant.role === 'parent' ? 'Parent' : `${currentParticipant.age} years old`}
            </p>
          </div>
        )}

        {/* Sample Progress */}
        <div className="mb-6">
          <div className="flex gap-2 justify-center">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  index < currentSample
                    ? 'bg-green-500 text-white'
                    : index === currentSample
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {index < currentSample ? '✓' : index + 1}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 mt-3">
            Sample {currentSample + 1} of {totalSamplesNeeded}
          </p>
        </div>

        {/* Prompt */}
        <div className="mb-8 p-6 bg-blue-50 rounded-xl">
          <p className="text-lg text-center text-gray-800 font-medium">
            {prompts[currentSample]}
          </p>
        </div>

        {/* Recording Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleStartRecording}
            disabled={isRecording}
            className={`px-8 py-4 rounded-full text-white font-bold text-lg transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 animate-pulse cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105 hover:shadow-lg'
            }`}
          >
            {isRecording ? (
              <>
                <span className="inline-block w-3 h-3 bg-white rounded-full animate-ping mr-2"></span>
                Recording... (5 seconds)
              </>
            ) : (
              <>
                🎙️ Start Recording
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-600 mb-6">
          <p>Speak naturally and clearly for 5 seconds</p>
          <p className="text-xs mt-1">We'll use your voice to automatically detect who's speaking</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Skip Button */}
        <div className="text-center">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Skip voice enrollment (manual selection only)
          </button>
        </div>

        {/* Already Enrolled */}
        {enrolledProfiles.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800 font-medium mb-2">
              ✅ Enrolled:
            </p>
            <div className="flex gap-2 flex-wrap">
              {enrolledProfiles.map(profile => (
                <span
                  key={profile.id}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                >
                  {profile.name}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VoiceEnrollmentFlow;
