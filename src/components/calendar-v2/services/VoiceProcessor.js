// Voice input processing for calendar events

export class VoiceProcessor {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.initializeSpeechRecognition();
  }

  initializeSpeechRecognition() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'en-US';
  }

  isSupported() {
    return !!this.recognition;
  }

  async startListening() {
    if (!this.recognition || this.isListening) return null;

    return new Promise((resolve, reject) => {
      let finalTranscript = '';
      let interimTranscript = '';

      this.recognition.onstart = () => {
        this.isListening = true;
        console.log('Voice recognition started');
      };

      this.recognition.onresult = (event) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // You could emit interim results here for real-time feedback
        if (this.onInterimResult) {
          this.onInterimResult(interimTranscript);
        }
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        console.error('Speech recognition error:', event.error);
        reject(new Error(event.error));
      };

      this.recognition.onend = () => {
        this.isListening = false;
        console.log('Voice recognition ended');
        
        if (finalTranscript.trim()) {
          resolve(finalTranscript.trim());
        } else if (interimTranscript.trim()) {
          resolve(interimTranscript.trim());
        } else {
          reject(new Error('No speech detected'));
        }
      };

      // Start recognition
      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Set callback for interim results (optional)
  setInterimCallback(callback) {
    this.onInterimResult = callback;
  }

  // Voice commands processing
  processVoiceCommands(transcript) {
    const commands = {
      // Navigation commands
      'next week': { action: 'navigate', direction: 'next', view: 'week' },
      'previous week': { action: 'navigate', direction: 'prev', view: 'week' },
      'next month': { action: 'navigate', direction: 'next', view: 'month' },
      'previous month': { action: 'navigate', direction: 'prev', view: 'month' },
      'today': { action: 'navigate', target: 'today' },
      'tomorrow': { action: 'navigate', target: 'tomorrow' },
      
      // View commands
      'show week': { action: 'view', target: 'week' },
      'show month': { action: 'view', target: 'month' },
      'show day': { action: 'view', target: 'day' },
      'show agenda': { action: 'view', target: 'agenda' },
      
      // Event commands
      'create event': { action: 'create' },
      'new event': { action: 'create' },
      'add event': { action: 'create' }
    };

    const lowerTranscript = transcript.toLowerCase();
    
    // Check for commands
    for (const [phrase, command] of Object.entries(commands)) {
      if (lowerTranscript.includes(phrase)) {
        return { type: 'command', ...command };
      }
    }

    // If no command found, treat as event creation
    return { type: 'event', transcript };
  }
}