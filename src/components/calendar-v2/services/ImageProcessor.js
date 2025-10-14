// Image processing and OCR for event extraction
import Tesseract from 'tesseract.js';

export class ImageProcessor {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize Tesseract worker
      this.worker = await Tesseract.createWorker({
        logger: m => console.log('OCR Progress:', m)
      });

      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OCR:', error);
      throw error;
    }
  }

  async processImage(imageFile) {
    try {
      // Initialize if needed
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Convert file to data URL for processing
      const imageDataUrl = await this.fileToDataUrl(imageFile);

      // Perform OCR
      const { data: { text } } = await this.worker.recognize(imageDataUrl);
      
      console.log('Extracted text:', text);

      // Extract event information from text
      const eventInfo = this.extractEventInfo(text);

      return {
        extractedText: text,
        eventInfo,
        confidence: this.calculateConfidence(eventInfo)
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  extractEventInfo(text) {
    const eventInfo = {
      title: '',
      date: null,
      time: null,
      location: '',
      description: '',
      category: 'general'
    };

    // Clean up text
    const cleanText = text.replace(/\n+/g, ' ').trim();

    // Extract patterns
    // Date patterns
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, // MM/DD/YYYY or MM-DD-YYYY
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/g, // Month DD, YYYY
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(\w+)\s+(\d{1,2})/gi
    ];

    // Time patterns
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?/g,
      /(\d{1,2})\s*(am|pm|AM|PM)/g
    ];

    // Location patterns (common words that indicate location)
    const locationKeywords = /(?:at|@|location:|venue:|place:)\s*([^,\n]+)/gi;

    // Try to extract date
    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        eventInfo.date = match[0];
        break;
      }
    }

    // Try to extract time
    for (const pattern of timePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        eventInfo.time = match[0];
        break;
      }
    }

    // Extract location
    const locationMatch = cleanText.match(locationKeywords);
    if (locationMatch) {
      eventInfo.location = locationMatch[1].trim();
    }

    // Extract title (usually the first line or prominent text)
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      // Look for a line that's likely a title (not too long, not a date/time)
      for (const line of lines) {
        if (line.length < 50 && !line.match(/\d{1,2}[\/\-:]\d{1,2}/) && line.length > 5) {
          eventInfo.title = line.trim();
          break;
        }
      }
    }

    // Categorize based on keywords
    eventInfo.category = this.categorizeFromText(cleanText);

    // Use full text as description if we found key info
    if (eventInfo.title || eventInfo.date || eventInfo.time) {
      eventInfo.description = cleanText;
    }

    return eventInfo;
  }

  categorizeFromText(text) {
    const categories = {
      medical: /doctor|dentist|appointment|hospital|clinic|medical|health|checkup/i,
      school: /school|class|teacher|parent|conference|meeting|education|homework/i,
      sports: /game|practice|tournament|match|team|coach|sports|athletic/i,
      birthday: /birthday|party|celebration|cake/i,
      work: /meeting|conference|deadline|presentation|interview/i,
      social: /dinner|lunch|party|gathering|reunion|wedding/i
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(text)) {
        return category;
      }
    }

    return 'general';
  }

  calculateConfidence(eventInfo) {
    let score = 0;
    let total = 0;

    // Check each field
    if (eventInfo.title) score += 2; // Title is important
    total += 2;

    if (eventInfo.date) score += 2; // Date is important
    total += 2;

    if (eventInfo.time) score += 1;
    total += 1;

    if (eventInfo.location) score += 1;
    total += 1;

    if (eventInfo.category !== 'general') score += 1;
    total += 1;

    return score / total;
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}