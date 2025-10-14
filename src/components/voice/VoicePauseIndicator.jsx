import React from 'react';
import './VoicePauseIndicator.css';

/**
 * Voice Pause Indicator
 *
 * Visual feedback for different pause states during voice conversation:
 * - 'none': No pause (user speaking)
 * - 'short': Short pause (user thinking) - shows "..."
 * - 'long': Long pause (probably done) - shows "Ready to send"
 * - 'final': Final pause (auto-sending) - shows "Sending..."
 */
const VoicePauseIndicator = ({ pauseType, isUserSpeaking }) => {
  if (!pauseType || pauseType === 'none') {
    if (isUserSpeaking) {
      return (
        <div className="voice-pause-indicator speaking">
          <div className="speaking-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <span className="pause-text">Listening...</span>
        </div>
      );
    }
    return null;
  }

  const getIndicatorContent = () => {
    switch (pauseType) {
      case 'short':
        return {
          className: 'short-pause',
          icon: '💭',
          text: 'Thinking...',
          dots: true
        };

      case 'long':
        return {
          className: 'long-pause',
          icon: '✓',
          text: 'Ready to send',
          dots: false
        };

      case 'final':
        return {
          className: 'final-pause',
          icon: '🚀',
          text: 'Sending to Allie',
          dots: true
        };

      default:
        return null;
    }
  };

  const content = getIndicatorContent();
  if (!content) return null;

  return (
    <div className={`voice-pause-indicator ${content.className}`}>
      <span className="pause-icon">{content.icon}</span>
      <span className="pause-text">{content.text}</span>
      {content.dots && (
        <div className="thinking-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      )}
    </div>
  );
};

export default VoicePauseIndicator;
