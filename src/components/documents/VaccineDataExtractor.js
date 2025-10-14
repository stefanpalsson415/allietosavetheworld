// src/components/documents/VaccineDataExtractor.js

/**
 * Extracts structured vaccine information from document text
 */
class VaccineDataExtractor {
  /**
   * Extract vaccine information from document text
   * @param {string} text - The document text
   * @param {string} documentTitle - The document title
   * @returns {Object} Extracted vaccine data
   */
  static extractVaccineData(text, documentTitle = '') {
    const data = {
      patientName: null,
      dateOfBirth: null,
      vaccines: [],
      provider: {
        name: null,
        address: null,
        phone: null,
        type: 'pediatrician'
      },
      dates: [],
      nextAppointment: null
    };

    // Extract patient name (common patterns)
    const namePatterns = [
      /Patient:\s*([A-Za-z\s]+)/i,
      /Name:\s*([A-Za-z\s]+)/i,
      /Child:\s*([A-Za-z\s]+)/i,
      /([A-Za-z]+\s+[A-Za-z]+)\s*\n\s*DOB:/i
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        data.patientName = match[1].trim();
        break;
      }
    }

    // Extract date of birth
    const dobPatterns = [
      /DOB:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /Date of Birth:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /Birth Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
    ];
    
    for (const pattern of dobPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.dateOfBirth = match[1];
        break;
      }
    }

    // Extract vaccine information
    const vaccinePatterns = [
      /(\w+(?:\s+\w+)?)\s+(?:vaccine|immunization)(?:.*?)(\d{1,2}\/\d{1,2}\/\d{4})/gi,
      /(?:Administered|Given):\s*(\w+(?:\s+\w+)?)\s+on\s+(\d{1,2}\/\d{1,2}\/\d{4})/gi,
      /(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–]\s*(\w+(?:\s+\w+)?)/gi
    ];
    
    const vaccineNames = [
      'DTaP', 'IPV', 'Hib', 'PCV13', 'RV', 'HepB', 'HepA',
      'MMR', 'Varicella', 'Influenza', 'COVID-19', 'Tdap',
      'HPV', 'MenACWY', 'MenB', 'Polio'
    ];
    
    // Look for vaccines in the text
    vaccineNames.forEach(vaccine => {
      const regex = new RegExp(`${vaccine}[^\\d]*(\\d{1,2}\\/\\d{1,2}\\/\\d{4})`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        data.vaccines.push({
          name: vaccine,
          date: match[1],
          type: this.categorizeVaccine(vaccine)
        });
        data.dates.push(match[1]);
      }
    });

    // Extract provider information
    const providerPatterns = [
      /(?:Dr\.|Doctor)\s+([A-Za-z\s]+?)(?:\n|,)/i,
      /Provider:\s*([A-Za-z\s,\.]+)/i,
      /Physician:\s*([A-Za-z\s,\.]+)/i
    ];
    
    for (const pattern of providerPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.provider.name = match[1].trim();
        break;
      }
    }

    // Extract address
    const addressPattern = /(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)[^\n]*)/i;
    const addressMatch = text.match(addressPattern);
    if (addressMatch) {
      data.provider.address = addressMatch[1].trim();
    }

    // Extract phone
    const phonePattern = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
    const phoneMatch = text.match(phonePattern);
    if (phoneMatch) {
      data.provider.phone = phoneMatch[0];
    }

    // Look for next appointment
    const nextApptPatterns = [
      /Next (?:appointment|visit|checkup):\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /Follow-up:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /Return:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
    ];
    
    for (const pattern of nextApptPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.nextAppointment = match[1];
        break;
      }
    }

    return data;
  }

  /**
   * Categorize vaccine type
   * @private
   */
  static categorizeVaccine(vaccineName) {
    const categories = {
      'DTaP': 'routine',
      'IPV': 'routine',
      'Hib': 'routine',
      'PCV13': 'routine',
      'RV': 'routine',
      'HepB': 'routine',
      'HepA': 'routine',
      'MMR': 'routine',
      'Varicella': 'routine',
      'Influenza': 'seasonal',
      'COVID-19': 'special',
      'Tdap': 'booster',
      'HPV': 'adolescent',
      'MenACWY': 'adolescent',
      'MenB': 'adolescent'
    };
    
    return categories[vaccineName] || 'other';
  }

  /**
   * Generate tags from extracted data
   */
  static generateTags(extractedData) {
    const tags = {
      people: [],
      medical: [],
      dates: [],
      contacts: [],
      locations: []
    };

    // Add patient name
    if (extractedData.patientName) {
      tags.people.push(extractedData.patientName);
    }

    // Add vaccines as medical tags
    extractedData.vaccines.forEach(vaccine => {
      tags.medical.push(`${vaccine.name} vaccine`);
    });

    // Add dates
    tags.dates = [...new Set(extractedData.dates)];

    // Add provider as contact
    if (extractedData.provider.name) {
      tags.contacts.push(extractedData.provider.name);
    }

    // Add location
    if (extractedData.provider.address) {
      tags.locations.push(extractedData.provider.address);
    }

    return tags;
  }
}

export default VaccineDataExtractor;