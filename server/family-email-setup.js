// Family Email Setup Service
const express = require('express');
const router = express.Router();

/**
 * Generate a unique family email address
 */
function generateFamilyEmail(familyName, familyId) {
  // Clean the family name
  const cleanName = familyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special chars
    .substring(0, 20); // Limit length
  
  // Add unique identifier to prevent duplicates
  const shortId = familyId.substring(0, 6);
  
  return `${cleanName}-${shortId}@families.checkallie.com`;
}

/**
 * Create family email on signup completion
 */
router.post('/api/family/create-email', async (req, res) => {
  try {
    const { familyId, familyName } = req.body;
    
    // Generate the email
    const familyEmail = generateFamilyEmail(familyName, familyId);
    
    // Save to database
    // await admin.firestore()
    //   .collection('families')
    //   .doc(familyId)
    //   .update({
    //     familyEmail,
    //     emailInstructions: {
    //       howTo: "Forward any emails with schedules, events, or tasks to this address",
    //       examples: [
    //         "School calendars",
    //         "Sports schedules", 
    //         "Birthday invitations",
    //         "Doctor appointments"
    //       ]
    //     }
    //   });
    
    // Return the email and instructions
    res.json({
      success: true,
      familyEmail,
      instructions: {
        desktop: `Add ${familyEmail} to your contacts, then forward emails`,
        mobile: `Save ${familyEmail} as a contact named "Allie Family"`,
        tips: [
          "Forward school newsletters and Allie will extract all dates",
          "Send photos of flyers or handwritten notes",
          "CC this address on important family emails"
        ]
      }
    });
  } catch (error) {
    console.error('Error creating family email:', error);
    res.status(500).json({ error: 'Failed to create family email' });
  }
});

/**
 * Process incoming email webhook from SendGrid
 */
router.post('/api/emails/inbound', async (req, res) => {
  try {
    const {
      to,      // smithfamily-abc123@allie.family
      from,    // mom@gmail.com (who forwarded it)
      subject,
      text,
      html,
      attachments
    } = req.body;
    
    // Extract family ID from email
    const match = to.match(/^(.+)-([a-z0-9]+)@allie\.family$/);
    if (!match) {
      console.error('Invalid family email format:', to);
      return res.status(200).send('OK');
    }
    
    const [, familyPrefix, familyIdPrefix] = match;
    
    // Find family
    // const family = await findFamilyByEmailPrefix(familyIdPrefix);
    
    // Identify sender within family
    // const sender = await identifyFamilyMember(from, family.id);
    
    // Process with Allie
    const context = {
      familyEmail: to,
      senderEmail: from,
      senderName: extractSenderName(from),
      isForwarded: subject.toLowerCase().includes('fwd:'),
      hasAttachments: attachments?.length > 0
    };
    
    console.log('Processing email:', {
      family: familyPrefix,
      sender: from,
      subject: subject
    });
    
    // Queue for processing
    // await queueEmailForProcessing({
    //   ...context,
    //   content: { subject, text, html },
    //   attachments
    // });
    
    // Always return 200 to SendGrid
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing inbound email:', error);
    res.status(200).send('OK'); // Still return 200
  }
});

/**
 * Helper to extract sender name from email
 */
function extractSenderName(fromEmail) {
  // "John Smith <john@gmail.com>" -> "John Smith"
  const match = fromEmail.match(/^"?([^"<]+)"?\s*<?/);
  return match ? match[1].trim() : fromEmail.split('@')[0];
}

/**
 * Test endpoint to check email configuration
 */
router.get('/api/family/email-status/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    // Mock response for now
    const mockFamily = {
      id: familyId,
      name: 'Smith Family',
      email: 'smithfamily-abc123@allie.family'
    };
    
    res.json({
      configured: true,
      familyEmail: mockFamily.email,
      status: 'active',
      usage: {
        emailsReceived: 0,
        eventsCreated: 0,
        lastEmailDate: null
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get email status' });
  }
});

module.exports = router;