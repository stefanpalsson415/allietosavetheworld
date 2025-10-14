// Test email receiving with your current setup
const express = require('express');
const router = express.Router();

/**
 * For immediate testing - use plus addressing
 * Send emails to: stefan+familyname@checkallie.com
 * They'll arrive in your inbox, but we can also process them
 */

// Simulate processing an email sent to stefan+smith@checkallie.com
router.post('/api/test/process-family-email', async (req, res) => {
  const testEmail = {
    to: 'stefan+smith@checkallie.com',
    from: 'mom@gmail.com',
    subject: 'Fwd: Soccer Schedule Spring 2025',
    text: `
      Here's the soccer schedule:
      
      Practice: Every Tuesday and Thursday at 4:00 PM
      Location: City Park Field 3
      
      Games:
      - March 15: vs Eagles at 10 AM
      - March 22: vs Tigers at 2 PM  
      - March 29: vs Lions at 10 AM
      
      Coach: John Smith (555-1234)
    `
  };
  
  // Extract family name from plus address
  const [localPart] = testEmail.to.split('@');
  const [, familyTag] = localPart.split('+');
  
  console.log('Processing email for family:', familyTag);
  
  // Simulate Allie processing
  const extracted = {
    family: familyTag,
    sender: testEmail.from,
    events: [
      {
        title: 'Soccer Practice',
        recurring: true,
        days: ['Tuesday', 'Thursday'],
        time: '4:00 PM',
        location: 'City Park Field 3'
      },
      {
        title: 'Soccer Game vs Eagles',
        date: '2025-03-15',
        time: '10:00 AM'
      },
      {
        title: 'Soccer Game vs Tigers',
        date: '2025-03-22',
        time: '2:00 PM'
      },
      {
        title: 'Soccer Game vs Lions',
        date: '2025-03-29',
        time: '10:00 AM'
      }
    ],
    contacts: [
      {
        name: 'Coach John Smith',
        phone: '555-1234',
        role: 'Soccer Coach'
      }
    ]
  };
  
  res.json({
    success: true,
    message: 'Email processed successfully!',
    familyEmail: testEmail.to,
    detectedFamily: familyTag,
    sender: testEmail.from,
    extracted: extracted
  });
});

/**
 * Generate family email instructions
 */
router.post('/api/family/generate-email-instructions', async (req, res) => {
  const { familyName, familyId } = req.body;
  
  const cleanName = familyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  res.json({
    testing: {
      immediate: `stefan+${cleanName}@checkallie.com`,
      instruction: "For testing, forward emails here. They'll arrive in Stefan's inbox."
    },
    staging: {
      future: `${cleanName}@families.checkallie.com`,
      instruction: "Coming soon! Your dedicated family email address."
    },
    setup: {
      phase1: "Use the testing email for now",
      phase2: "We'll set up families.checkallie.com subdomain",
      phase3: "Switch to your permanent family email"
    }
  });
});

module.exports = router;