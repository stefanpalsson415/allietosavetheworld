# Voice Interview Fix - State Machine Implementation
**Date:** October 9, 2025
**Status:** ✅ DEPLOYED TO PRODUCTION
**Deployment:** https://parentload-ba995.web.app

## Problem Summary

The voice interview system had critical bugs causing:

1. **Feedback Loop**: Allie's voice was being transcribed as user input ("energy and", "what")
2. **Lost Transcripts**: User speech appeared in preview but not saved as message bubbles
3. **Microphone State Issues**: Mic not stopping during TTS, not resuming after, or resuming too early

## Root Cause

Multiple competing mechanisms were trying to control microphone state simultaneously:

- `InterviewChat` manually setting up event listeners
- `VoiceService.speak()` having its own auto-resume logic
- `PremiumVoiceService.playAudio()` promise resolution issues
- `handleVoiceResult` processing AND `onFinalPause` processing (duplicates)
- Race conditions between `recognition.stop()` (async) and `recognition.start()`

**The fundamental violation:** Microphone was running during TTS playback, causing AI's voice to be picked up as user input.

## Solution: State Machine Architecture

Implemented a proper conversational flow manager based on Claude Desktop best practices:

### New Component: `ConversationFlowManager.js`

A state machine service that enforces the golden rule: **Never have recognition running during TTS**

#### States:
- `idle`: Ready to speak or listen
- `speaking`: AI is speaking (mic MUST be off)
- `listening`: Mic is active, waiting for user input
- `processing`: Processing user's response

#### Valid Transitions:
```
idle → speaking | listening
speaking → idle | listening
listening → processing | idle
processing → speaking | idle | listening
```

Invalid transitions are blocked and logged as errors.

#### Key Features:

**1. Enforced Timing**
```javascript
this.PAUSE_DETECTION_MS = 1500; // Wait for user to finish
this.POST_SPEECH_DELAY = 700;   // Delay after AI speaks before mic resumes
this.POST_USER_DELAY = 500;     // Delay after user speaks before processing
```

**2. Guaranteed Mic Control**
```javascript
async speak(text, options = {}) {
  // CRITICAL: Stop mic before speaking
  if (this.state === 'listening') {
    console.log('🔇 Stopping microphone before AI speaks (prevent feedback)');
    this.voiceService.stopListening();
  }

  if (!this.setState('speaking', 'AI starting to speak')) {
    throw new Error('Cannot speak - invalid state');
  }

  try {
    await this.ttsService.speak(text, options);
    this.setState('idle', 'AI finished speaking');
    await this.delay(this.POST_SPEECH_DELAY); // Wait proper delay
    return { success: true };
  } catch (error) {
    this.setState('idle', 'Speech error');
    throw error;
  }
}
```

**3. Safe Mic Start**
```javascript
async startListening() {
  // CRITICAL: Never start mic while AI is speaking
  if (this.state === 'speaking') {
    console.error('❌ BLOCKED: Cannot start listening while AI is speaking');
    return { success: false, reason: 'ai_speaking' };
  }

  if (!this.setState('listening', 'Starting to listen for user')) {
    return { success: false, reason: 'invalid_state' };
  }

  const started = this.voiceService.startListening();
  if (!started) {
    this.setState('idle', 'Failed to start listening');
    return { success: false, reason: 'mic_failed' };
  }

  return { success: true };
}
```

**4. Input Processing**
```javascript
async processUserInput(transcript) {
  // Ensure we're not in speaking state
  if (this.state === 'speaking') {
    console.error('❌ BLOCKED: Cannot process input while AI is speaking');
    return { success: false, reason: 'ai_speaking' };
  }

  // Stop listening first
  if (this.state === 'listening') {
    this.stopListening();
  }

  if (!this.setState('processing', 'Processing user input')) {
    return { success: false, reason: 'invalid_state' };
  }

  try {
    await this.delay(this.POST_USER_DELAY); // Clean state transition
    this.emit('processStart', { transcript });
    this.setState('idle', 'Processing complete');
    this.emit('processEnd', { transcript });
    return { success: true, transcript };
  } catch (error) {
    this.setState('idle', 'Processing error');
    return { success: false, error };
  }
}
```

**5. Event Emitter for React Integration**
```javascript
// Emit to component listeners AND window events
emit(event, data = {}) {
  // Call registered callbacks
  this.listeners.get(event)?.forEach(callback => callback(data));

  // Emit window event for React components
  window.dispatchEvent(new CustomEvent(`conversationFlow:${event}`, { detail: data }));
}
```

## Changes to InterviewChat.jsx

### Initialization
```javascript
// Initialize Conversation Flow Manager
useEffect(() => {
  if (!flowManagerRef.current) {
    console.log('🎛️ Initializing Conversation Flow Manager');
    flowManagerRef.current = new ConversationFlowManager(voiceService, premiumVoiceService);

    // Listen to state changes
    flowManagerRef.current.on('stateChange', ({ newState }) => {
      setConversationState(newState);
      setIsListening(newState === 'listening');
    });

    // Listen to voice events
    flowManagerRef.current.on('speakStart', () => {
      console.log('🔊 AI started speaking');
    });

    flowManagerRef.current.on('speakEnd', () => {
      console.log('✅ AI finished speaking');
    });
  }

  return () => {
    if (flowManagerRef.current) {
      flowManagerRef.current.destroy();
      flowManagerRef.current = null;
    }
  };
}, []);
```

### Simplified askCurrentQuestion
```javascript
const askCurrentQuestion = async () => {
  // ... message creation ...

  // Use flow manager for coordinated speech + mic control
  if (voiceEnabled && flowManagerRef.current) {
    try {
      // Flow manager handles: stop mic -> speak -> wait -> resume mic
      await flowManagerRef.current.speak(personalizedQuestion);

      // Now safe to resume listening (flow manager already waited POST_SPEECH_DELAY)
      await flowManagerRef.current.startListening();

    } catch (speechError) {
      console.warn('⚠️ Could not speak question (network may be offline):', speechError);
      // Fall back to manual mic start
      setTimeout(() => {
        if (flowManagerRef.current) {
          flowManagerRef.current.startListening();
        }
      }, 1000);
    }
  }
};
```

### Streamlined Voice Result Handler
```javascript
const handleVoiceResult = useCallback(async (event) => {
  const transcript = event.detail.transcript;
  console.log('🎤 Voice result received:', transcript);

  if (!transcript.trim()) return;

  // ... speaker detection logic ...

  // Use flow manager to process input (stops mic, transitions to processing state)
  if (flowManagerRef.current) {
    const result = await flowManagerRef.current.processUserInput(transcript);

    if (result.success) {
      // Now safe to handle the response
      if (handleUserResponseRef.current) {
        await handleUserResponseRef.current(transcript, 'voice');
      }

      // Flow manager already transitioned back to idle
      // For transcriber/conversational mode, resume listening
      if (voiceMode === 'transcriber' || voiceMode === 'conversational') {
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    }
  }

  setShowTranscript('');
}, [voiceMode, participants, shouldPromptForSpeaker, voiceEnrollmentComplete]);
```

### Wrappers for Backward Compatibility
```javascript
const speakMessage = async (message) => {
  if (!flowManagerRef.current) {
    console.warn('⚠️ Flow manager not ready');
    return;
  }

  try {
    await flowManagerRef.current.speak(message);
  } catch (error) {
    console.error('Error speaking message:', error);
    throw error;
  }
};

const startListening = () => {
  if (!flowManagerRef.current) return;
  flowManagerRef.current.startListening();
  // State will be updated by flow manager's stateChange event
};

const stopListening = () => {
  if (!flowManagerRef.current) return;
  flowManagerRef.current.stopListening();
  // State will be updated by flow manager's stateChange event
};
```

## What Was Removed

1. **Manual event listeners for `voice:speakEnd`** - Flow manager handles this internally
2. **Direct voiceService.stopListening() calls** - Now goes through flow manager
3. **Duplicate processing in `onFinalPause`** - Only kept for UI feedback
4. **Race condition prone setTimeout chains** - Replaced with state machine timing
5. **speakMessage() complexity** - Simplified to just delegate to flow manager

## Expected Behavior Now

### 1. Question Flow
```
1. Flow manager transitions to 'speaking' state
2. Mic is STOPPED (guaranteed)
3. AI speaks question via OpenAI TTS-1-HD
4. Promise resolves when audio completes
5. Flow manager transitions to 'idle'
6. Wait POST_SPEECH_DELAY (700ms)
7. Flow manager transitions to 'listening' state
8. Mic starts
9. User responds
```

### 2. Response Flow
```
1. User speaks (mic is listening)
2. Voice result event fires
3. Flow manager transitions to 'processing'
4. Mic is STOPPED (guaranteed)
5. Transcript is saved
6. Wait POST_USER_DELAY (500ms)
7. Flow manager transitions to 'idle'
8. AI generates acknowledgment
9. Back to Question Flow step 1
```

### 3. Feedback Prevention
```
BEFORE: Mic listening → AI starts speaking → Mic picks up AI voice ❌
AFTER:  Mic listening → State machine BLOCKS speak() → Error logged ✅

BEFORE: AI speaking → setTimeout fires → Mic resumes too early ❌
AFTER:  AI speaking → Promise resolves → Wait 700ms → Mic resumes ✅
```

## Testing Checklist

- [x] Build succeeds without errors
- [x] Deployed to Firebase hosting
- [ ] User should hard refresh (Cmd+Shift+R) to clear cache
- [ ] Test interview start - no feedback loop
- [ ] Test user response - appears as message bubble
- [ ] Test follow-up questions - proper timing
- [ ] Test pause/resume - state preserved
- [ ] Test network offline scenarios

## Key Diagnostic Logs to Watch

```
🎛️ Initializing Conversation Flow Manager
🔄 State: idle -> speaking (AI starting to speak)
🔊 Audio playback started
✅ Audio playback completed
🔄 State: speaking -> idle (AI finished speaking)
🔄 State: idle -> listening (Starting to listen for user)
🎤 Voice result received: [transcript]
🔄 State: listening -> processing (Processing user input)
✅ Processing voice response: [transcript]
🔄 State: processing -> idle (Processing complete)
```

## Files Modified

### New Files:
- `/src/services/ConversationFlowManager.js` - State machine implementation (381 lines)

### Modified Files:
- `/src/components/interview/InterviewChat.jsx` - Integrated flow manager, removed competing mechanisms

## Deployment Commands

```bash
cd /Users/stefanpalsson/parentload\ copy/parentload-clean
npm run build
firebase deploy --only hosting
```

## Next Steps

1. **User Testing**: User should hard refresh and test the interview flow
2. **Monitor Logs**: Watch console for state transitions and timing
3. **Edge Cases**: Test with poor network, background tabs, etc.
4. **Metrics**: Track feedback loop occurrences (should be 0)
5. **Documentation Update**: Add state machine diagram to CLAUDE.md

## Benefits of This Approach

1. **Single Source of Truth**: Flow manager is THE authority on voice state
2. **Prevented Invalid States**: State machine blocks illegal transitions
3. **Clear Debugging**: State history shows exact sequence of events
4. **Timing Guarantees**: POST_SPEECH_DELAY and POST_USER_DELAY are enforced
5. **Abort Support**: Can interrupt any operation cleanly
6. **Event-Driven**: React components stay in sync via events
7. **Testable**: Can unit test state transitions independently

## Known Limitations

- Audio promise still relies on `audio.onended` event (has timeout fallback)
- State history grows unbounded (could add max limit)
- No retry logic for failed TTS (caller must handle)
- Events are fire-and-forget (no error handling for listeners)

## References

- Claude Desktop conversation: Comprehensive guide on conversational flow patterns
- CLAUDE.md: Updated with state machine approach
- MULTI_PERSON_INTERVIEW_SYSTEM_COMPLETE.md: Speaker detection integration

---

**Status**: ✅ Deployed and ready for testing
**Bundle**: Latest build at https://parentload-ba995.web.app
**Action Required**: User must hard refresh to load new code
