import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Mic, Image as ImageIcon, X } from 'lucide-react';
import { AllieEventProcessor } from '../services/AllieEventProcessor';
import { VoiceProcessor } from '../services/VoiceProcessor';
import { ImageProcessor } from '../services/ImageProcessor';
import { useCalendar } from '../hooks/useCalendar';
import { useFamily } from '../../../contexts/FamilyContext';

export const QuickEventCreator = ({ onClose, initialDate }) => {
  const { createEvent } = useCalendar();
  const { selectedFamily } = useFamily();
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showManualForm, setShowManualForm] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const processor = new AllieEventProcessor(selectedFamily?.id);
  const voiceProcessor = useRef(new VoiceProcessor()).current;
  const imageProcessor = useRef(new ImageProcessor()).current;
  const fileInputRef = useRef(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setProcessing(true);
    try {
      const result = await processor.processNaturalLanguage(input);
      
      if (result && result.eventData) {
        setEventData(result.eventData);
        
        // If we have follow-up questions, show them
        if (result.followUpQuestions.length > 0) {
          setFollowUpQuestions(result.followUpQuestions);
          setCurrentQuestionIndex(0);
        } else {
          // Otherwise, create the event
          await createAndClose(result.eventData);
        }
      } else {
        // Fall back to manual form
        setShowManualForm(true);
      }
    } catch (error) {
      console.error('Error processing input:', error);
      setShowManualForm(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleQuestionAnswer = async (answer) => {
    // Update event data based on answer
    const question = followUpQuestions[currentQuestionIndex];
    const updatedEventData = { ...eventData };

    switch (question.id) {
      case 'title':
        updatedEventData.title = answer;
        break;
      case 'time':
        updatedEventData.startTime = new Date(answer);
        updatedEventData.endTime = new Date(new Date(answer).getTime() + 60 * 60 * 1000);
        break;
      case 'attendees':
        updatedEventData.attendees = answer.map(memberId => ({
          familyMemberId: memberId,
          status: 'pending'
        }));
        break;
      default:
        break;
    }

    setEventData(updatedEventData);

    // Move to next question or create event
    if (currentQuestionIndex < followUpQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await createAndClose(updatedEventData);
    }
  };

  const createAndClose = async (data) => {
    await createEvent(data);
    onClose();
  };

  const handleVoiceInput = async () => {
    if (!voiceProcessor.isSupported()) {
      alert('Voice input is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    if (isListening) {
      voiceProcessor.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    try {
      const transcript = await voiceProcessor.startListening();
      setInput(transcript);
      setIsListening(false);
      
      // Automatically process the voice input
      setTimeout(() => {
        handleSubmit();
      }, 500);
    } catch (error) {
      console.error('Voice input error:', error);
      setIsListening(false);
      
      if (error.message === 'No speech detected') {
        // Just stop listening, don't show error
      } else {
        alert('Sorry, there was an error with voice input. Please try again.');
      }
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setProcessing(true);
    try {
      // Process image with OCR
      const result = await imageProcessor.processImage(file);
      
      if (result.eventInfo) {
        // Combine extracted text with event info
        let extractedText = '';
        if (result.eventInfo.title) {
          extractedText = result.eventInfo.title;
        }
        if (result.eventInfo.date || result.eventInfo.time) {
          extractedText += ` on ${result.eventInfo.date || ''} ${result.eventInfo.time || ''}`;
        }
        if (result.eventInfo.location) {
          extractedText += ` at ${result.eventInfo.location}`;
        }

        // Set the input field with extracted text
        setInput(extractedText || result.extractedText);

        // If we have good confidence, auto-process
        if (result.confidence > 0.5) {
          setTimeout(() => {
            handleSubmit();
          }, 500);
        }
      } else {
        // Just use the raw extracted text
        setInput(result.extractedText);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Sorry, there was an error processing the image. Please try typing the event details instead.');
    } finally {
      setProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Cleanup image processor on unmount
  useEffect(() => {
    return () => {
      imageProcessor.cleanup();
    };
  }, []);

  const renderNaturalInput = () => (
    <div className="quick-event-creator">
      <div className="quick-event-header">
        <div className="flex items-center gap-2">
          <Sparkles className="text-purple-500" size={20} />
          <h3>Tell Allie about your event</h3>
        </div>
        <button onClick={onClose} className="close-button">
          <X size={20} />
        </button>
      </div>

      <div className="quick-event-body">
        <div className="input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try: 'Soccer practice every Tuesday at 4pm' or 'Doctor appointment tomorrow at 2:30'"
            className="natural-language-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            autoFocus
          />
          
          <div className="input-actions">
            <button 
              className={`input-action-button ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
              disabled={processing}
            >
              <Mic size={20} />
            </button>
            <button 
              className="input-action-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
            >
              <ImageIcon size={20} />
            </button>
            <button 
              className="submit-button"
              onClick={handleSubmit}
              disabled={!input.trim() || processing}
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        <div className="examples">
          <p className="examples-title">Examples:</p>
          <ul className="examples-list">
            <li>"Dentist appointment next Monday at 10am"</li>
            <li>"Birthday party on Saturday 2-4pm at the park"</li>
            <li>"Team meeting every Wednesday at 9am"</li>
          </ul>
        </div>

        <button 
          className="manual-form-link"
          onClick={() => setShowManualForm(true)}
        >
          Or use the regular form →
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );

  const renderFollowUpQuestion = () => {
    const question = followUpQuestions[currentQuestionIndex];

    return (
      <div className="quick-event-creator">
        <div className="quick-event-header">
          <h3>Just a few more details...</h3>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <div className="quick-event-body">
          <div className="event-preview">
            <h4>{eventData.title || 'New Event'}</h4>
            <p className="event-preview-details">
              {eventData.startTime.toLocaleString()}
              {eventData.location && ` • ${eventData.location}`}
            </p>
          </div>

          <div className="question-section">
            <p className="question-text">{question.question}</p>
            
            {question.type === 'text' && (
              <input
                type="text"
                className="question-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleQuestionAnswer(e.target.value);
                  }
                }}
                autoFocus
              />
            )}

            {question.type === 'datetime' && (
              <input
                type="datetime-local"
                className="question-input"
                onChange={(e) => handleQuestionAnswer(e.target.value)}
              />
            )}

            {question.type === 'boolean' && (
              <div className="question-buttons">
                <button 
                  className="option-button"
                  onClick={() => handleQuestionAnswer(true)}
                >
                  Yes
                </button>
                <button 
                  className="option-button"
                  onClick={() => handleQuestionAnswer(false)}
                >
                  No
                </button>
              </div>
            )}

            {question.type === 'multiselect' && (
              <div className="attendee-options">
                {selectedFamily?.members?.map(member => (
                  <label key={member.id} className="attendee-option">
                    <input
                      type="checkbox"
                      value={member.id}
                      onChange={(e) => {
                        const currentSelection = [];
                        const checkboxes = document.querySelectorAll('.attendee-option input:checked');
                        checkboxes.forEach(cb => currentSelection.push(cb.value));
                        if (e.target.checked || currentSelection.length > 0) {
                          handleQuestionAnswer(currentSelection);
                        }
                      }}
                    />
                    {member.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="question-progress">
            Question {currentQuestionIndex + 1} of {followUpQuestions.length}
          </div>
        </div>
      </div>
    );
  };

  if (processing) {
    return (
      <div className="quick-event-creator processing">
        <div className="processing-content">
          <Sparkles className="processing-icon" size={40} />
          <h3>Allie is understanding your event...</h3>
          <p>Just a moment while I process that</p>
        </div>
      </div>
    );
  }

  if (followUpQuestions.length > 0 && !showManualForm) {
    return renderFollowUpQuestion();
  }

  return renderNaturalInput();
};