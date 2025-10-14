import React, { useEffect } from 'react';
import UserAvatar from '../common/UserAvatar';

const SpeakerSelector = ({ participants, onSelectSpeaker, currentSpeaker, pendingTranscript }) => {

  // Keyboard shortcuts (1-5)
  useEffect(() => {
    const handleKeyPress = (e) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= participants.length) {
        onSelectSpeaker(participants[num - 1]);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [participants, onSelectSpeaker]);

  return (
    <div className="speaker-selector-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="speaker-selector-modal bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Who's speaking?
          </h3>
          {pendingTranscript && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 italic">
                "{pendingTranscript}"
              </p>
            </div>
          )}
        </div>

        {/* Speaker Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 mb-6">
          {participants.map((person, index) => (
            <button
              key={person.id}
              onClick={() => onSelectSpeaker(person)}
              className={`speaker-button relative p-4 rounded-xl transition-all duration-200 ${
                currentSpeaker?.id === person.id
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 hover:scale-105'
              }`}
            >
              {/* Avatar */}
              <div className="flex justify-center mb-3">
                <UserAvatar user={person} size={80} />
              </div>

              {/* Name */}
              <div className="text-center">
                <span className="block font-semibold text-sm mb-1">
                  {person.name}
                </span>
                <span className={`text-xs ${
                  currentSpeaker?.id === person.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {person.role === 'parent'
                    ? (person.isParent ? 'Parent' : person.age)
                    : `${person.age} years old`
                  }
                </span>
              </div>

              {/* Keyboard Shortcut Badge */}
              <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentSpeaker?.id === person.id
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-600 text-white'
              }`}>
                {index + 1}
              </div>

              {/* Active Pulse Animation */}
              {currentSpeaker?.id === person.id && (
                <div className="absolute inset-0 rounded-xl">
                  <div className="active-pulse absolute inset-0 rounded-xl border-4 border-white animate-pulse"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Keyboard Hints */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            💡 <strong>Quick keys:</strong> {participants.map((p, i) => `${i + 1} = ${p.name}`).join(' • ')}
          </p>
        </div>

      </div>
    </div>
  );
};

export default SpeakerSelector;
