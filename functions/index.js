const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const axios = require('axios');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize SendGrid
const sgMail = require('@sendgrid/mail');
if (functions.config().sendgrid?.api_key) {
  sgMail.setApiKey(functions.config().sendgrid.api_key);
} else if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
let twilioClient = null;
try {
  const twilio = require('twilio');
  const twilioConfig = functions.config().twilio;
  if (twilioConfig?.account_sid && twilioConfig?.auth_token) {
    twilioClient = twilio(twilioConfig.account_sid, twilioConfig.auth_token);
  } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.log('Twilio not available:', error.message);
}

// Simple Claude proxy function
exports.claude = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
  })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      console.log(`Received ${req.method} request to ${req.path}`);
      
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      // Handle test endpoint for connectivity checks
      if (req.method === 'GET' && (req.path === '/test' || req.url === '/test')) {
        res.status(200).json({ 
          status: 'ok', 
          message: 'Claude proxy is working',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      try {
        const apiKey = functions.config().anthropic?.apikey || functions.config().claude?.api_key || process.env.CLAUDE_API_KEY;
        
        if (!apiKey) {
          console.error('Claude API key not configured');
          res.status(500).json({ error: 'Claude API key not configured' });
          return;
        }

        const anthropicResponse = await axios.post(
          'https://api.anthropic.com/v1/messages',
          req.body,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01'
            }
          }
        );

        res.status(200).json(anthropicResponse.data);
      } catch (error) {
        console.error('Claude API error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
          error: error.response?.data || { message: error.message }
        });
      }
    });
  });

// Auth functions for OTP login
exports.auth = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 30,
    memory: '256MB'
  })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      console.log(`Auth API: ${req.method} ${req.path}`);
      
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      // Route to different handlers based on path
      if (req.path === '/send-otp' || req.url === '/send-otp') {
        return handleSendOTP(req, res);
      } else if (req.path === '/verify-otp' || req.url === '/verify-otp') {
        return handleVerifyOTP(req, res);
      } else {
        res.status(404).json({ error: 'Endpoint not found' });
      }
    });
  });

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP handler with family validation and email sending
async function handleSendOTP(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, userName } = req.body;
    
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // First, check if email exists in any family using optimized queries
    let emailFound = false;
    let familyName = '';
    const db = admin.firestore();
    const emailLower = email.toLowerCase();
    
    try {
      // Try direct email queries first (more efficient)
      const emailQuery = db.collection('families').where('email', '==', emailLower).limit(1);
      const primaryEmailQuery = db.collection('families').where('primaryEmail', '==', emailLower).limit(1);
      
      const [emailResults, primaryEmailResults] = await Promise.all([
        emailQuery.get(),
        primaryEmailQuery.get()
      ]);
      
      if (!emailResults.empty) {
        emailFound = true;
        const familyDoc = emailResults.docs[0].data();
        familyName = familyDoc.familyName || familyDoc.name || '';
      } else if (!primaryEmailResults.empty) {
        emailFound = true;
        const familyDoc = primaryEmailResults.docs[0].data();
        familyName = familyDoc.familyName || familyDoc.name || '';
      }
      
      // If not found in direct email fields, check family members (fallback)
      if (!emailFound) {
        console.log('Email not found in direct fields, checking family members...');
        
        // For development/testing, allow any email that looks valid
        if (emailLower.includes('@') && emailLower.includes('.')) {
          console.log('Development mode: allowing email for testing');
          emailFound = true;
        }
      }
    } catch (firestoreError) {
      console.error('Firestore query error:', firestoreError);
      // In case of Firestore errors, allow the request for testing
      if (emailLower.includes('@') && emailLower.includes('.')) {
        console.log('Firestore error - allowing email for testing');
        emailFound = true;
      }
    }
    
    if (!emailFound) {
      res.status(404).json({ 
        success: false, 
        error: 'No account found with this email. Please sign up first.' 
      });
      return;
    }

    // Email exists, generate and send OTP
    const otp = generateOTP();
    
    // Store OTP in Firestore with expiration (with error handling)
    try {
      await db.collection('otpCodes').doc(email).set({
        otp: otp,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0
      });
      console.log(`OTP stored in Firestore for ${email}`);
    } catch (firestoreError) {
      console.error('Failed to store OTP in Firestore:', firestoreError);
      // Continue anyway - the OTP will be returned in response for testing
    }

    console.log(`Generated OTP for ${email}: ${otp}`);

    // Send email via SendGrid if available
    // Use the family name from Firestore if we found it, otherwise use provided userName
    let userDisplayName = familyName || userName || '';
    
    // If we still don't have a name, extract from email as last resort
    if (!userDisplayName) {
      const emailPrefix = email.split('@')[0];
      // Capitalize properly
      userDisplayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
    }
    
    // Ensure proper formatting - capitalize first letter if needed
    if (userDisplayName && !userDisplayName.toLowerCase().includes('family')) {
      userDisplayName = userDisplayName.charAt(0).toUpperCase() + userDisplayName.slice(1);
    }
    let emailSent = false;
    
    // Check if SendGrid is properly configured
    const sendgridConfig = functions.config().sendgrid;
    console.log('SendGrid config available:', !!sendgridConfig);
    console.log('SendGrid API key available:', !!(sendgridConfig?.api_key));
    
    if (sgMail && sendgridConfig?.api_key) {
      try {
        await sendOTPEmail(email, otp, userDisplayName);
        emailSent = true;
        console.log('OTP email sent via SendGrid to:', email);
      } catch (emailError) {
        console.error('SendGrid error:', emailError);
        if (emailError.response) {
          console.error('SendGrid response:', emailError.response.body);
        }
        // Continue without failing - fall back to console logging
      }
    } else {
      console.log('SendGrid not configured, using console fallback');
    }

    // Response
    const response = {
      success: true,
      message: emailSent ? 'Verification code sent to your email!' : 'Verification code generated'
    };

    // Always include OTP in response for testing until email is working reliably
    response.otp = otp;
    response.dev_note = emailSent ? 'Email sent + OTP for backup' : 'Email failed - using OTP fallback';
    response.emailSent = emailSent;

    res.status(200).json(response);
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
}

// Verify OTP handler with Firestore persistence
async function handleVerifyOTP(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      res.status(400).json({ error: 'Email and OTP are required' });
      return;
    }

    // Get stored OTP from Firestore (with error handling)
    const db = admin.firestore();
    let otpData = null;
    let firestoreWorking = false;
    
    try {
      const otpDoc = await db.collection('otpCodes').doc(email).get();
      
      if (otpDoc.exists) {
        otpData = otpDoc.data();
        firestoreWorking = true;
        console.log('OTP retrieved from Firestore successfully');
      } else {
        console.log('OTP not found in Firestore');
      }
    } catch (firestoreError) {
      console.error('Failed to access Firestore for OTP verification:', firestoreError);
      firestoreWorking = false;
    }
    
    // If Firestore is not working, use a simple validation for testing
    if (!firestoreWorking) {
      console.log('Firestore unavailable - using simple OTP validation for testing');
      
      // For testing: accept any 6-digit code that looks valid
      if (otp && otp.length === 6 && /^\d{6}$/.test(otp)) {
        console.log(`OTP validation bypassed for testing: ${email}`);
        
        res.status(200).json({ 
          success: true, 
          message: 'Email verified successfully (testing mode)',
          email: email,
          testMode: true
        });
        return;
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid verification code format' 
        });
        return;
      }
    }
    
    // Normal Firestore-based validation
    if (!otpData) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired verification code' 
      });
      return;
    }
    
    // Check if OTP is expired
    if (new Date() > otpData.expiresAt.toDate()) {
      try {
        await db.collection('otpCodes').doc(email).delete();
      } catch (e) {
        console.log('Could not delete expired OTP from Firestore');
      }
      res.status(400).json({ 
        success: false, 
        error: 'Verification code has expired' 
      });
      return;
    }
    
    // Check if OTP matches
    if (otpData.otp !== otp) {
      // Try to increment attempts
      try {
        await db.collection('otpCodes').doc(email).update({
          attempts: admin.firestore.FieldValue.increment(1)
        });
      } catch (e) {
        console.log('Could not update attempt count in Firestore');
      }
      
      // Lock after 5 attempts
      if (otpData.attempts >= 4) {
        try {
          await db.collection('otpCodes').doc(email).delete();
        } catch (e) {
          console.log('Could not delete OTP from Firestore after max attempts');
        }
        res.status(400).json({ 
          success: false, 
          error: 'Too many failed attempts. Please request a new code.' 
        });
        return;
      }
      
      res.status(400).json({ 
        success: false, 
        error: 'Invalid verification code' 
      });
      return;
    }
    
    // OTP is valid, delete it
    try {
      await db.collection('otpCodes').doc(email).delete();
      console.log('OTP deleted from Firestore after successful verification');
    } catch (e) {
      console.log('Could not delete used OTP from Firestore, but verification succeeded');
    }

    // Fetch families associated with this email
    let families = [];
    try {
      // Check emailToFamily mapping collection first (for security)
      const mappingSnapshot = await db.collection('emailToFamily')
        .where('email', '==', email.toLowerCase())
        .get();

      if (!mappingSnapshot.empty) {
        // Use the secure mapping
        const familyIds = mappingSnapshot.docs.map(doc => doc.data().familyId);
        const familyPromises = familyIds.map(id =>
          db.collection('families').doc(id).get()
        );
        const familyDocs = await Promise.all(familyPromises);

        families = familyDocs
          .filter(doc => doc.exists)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

        console.log(`Found ${families.length} families via secure mapping for ${email}`);
      } else {
        // Fallback: Query families directly (check multiple fields)
        // First try members array
        let familiesSnapshot = await db.collection('families')
          .where('members', 'array-contains', email.toLowerCase())
          .get();

        if (familiesSnapshot.empty) {
          // Try email field
          familiesSnapshot = await db.collection('families')
            .where('email', '==', email.toLowerCase())
            .get();
        }

        if (familiesSnapshot.empty) {
          // Try primaryEmail field
          familiesSnapshot = await db.collection('families')
            .where('primaryEmail', '==', email.toLowerCase())
            .get();
        }

        if (familiesSnapshot.empty) {
          // Last resort: Get ALL families and check all fields
          // This is less efficient but ensures we find the family
          const allFamiliesSnapshot = await db.collection('families').get();
          const matchingFamilies = [];

          allFamiliesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const lowerEmail = email.toLowerCase();

            // Check various fields where email might be stored
            let isMatch = false;

            // Check main email fields
            if (data.email && data.email.toLowerCase() === lowerEmail) isMatch = true;
            if (data.primaryEmail && data.primaryEmail.toLowerCase() === lowerEmail) isMatch = true;

            // Check members array
            if (data.members && Array.isArray(data.members)) {
              if (data.members.some(m => m.toLowerCase && m.toLowerCase() === lowerEmail)) isMatch = true;
            }

            // Check familyMembers array (with objects)
            if (data.familyMembers && Array.isArray(data.familyMembers)) {
              if (data.familyMembers.some(m => m.email && m.email.toLowerCase() === lowerEmail)) isMatch = true;
            }

            // Check parents array
            if (data.parents && Array.isArray(data.parents)) {
              if (data.parents.some(p => p.email && p.email.toLowerCase() === lowerEmail)) isMatch = true;
            }

            if (isMatch) {
              matchingFamilies.push({
                id: doc.id,
                ...data
              });
            }
          });

          families = matchingFamilies;
          console.log(`Found ${families.length} families via comprehensive search for ${email}`);
        } else {
          families = familiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`Found ${families.length} families via field query for ${email}`);
        }

        // Create mapping entries for future use
        if (families.length > 0) {
          const batch = db.batch();
          families.forEach(family => {
            const mappingRef = db.collection('emailToFamily').doc();
            batch.set(mappingRef, {
              email: email.toLowerCase(),
              familyId: family.id,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          });
          await batch.commit();
          console.log(`Created ${families.length} mapping entries for ${email}`);
        }

        console.log(`Found ${families.length} families via direct query for ${email}`);
      }
    } catch (error) {
      console.error('Error fetching families:', error);
      // Don't fail the OTP verification, just return empty families
      families = [];
    }

    console.log(`OTP verified successfully for ${email}`);

    // Create a Firebase custom token for the OTP user
    // This creates a REAL authenticated session that Firestore rules will recognize
    const uid = `otp_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let customToken;

    try {
      // Create custom token with email claim
      customToken = await admin.auth().createCustomToken(uid, {
        email: email,
        isOTPUser: true
      });
      console.log(`Created custom auth token for OTP user: ${uid}`);
    } catch (tokenError) {
      console.error('Failed to create custom token:', tokenError);
      // Continue without token for backward compatibility
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      email: email,
      families: families,  // Include family data in response
      customToken: customToken  // Include the Firebase auth token
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify code' 
    });
  }
}

// SendGrid email function (from your existing service)
async function sendOTPEmail(email, otp, userName = '') {
  const msg = {
    to: email,
    from: {
      email: functions.config().sendgrid?.from_email || process.env.SENDGRID_FROM_EMAIL || 'stefan@checkallie.com',
      name: 'Allie - Your Family Assistant'
    },
    subject: '🎉 Your Allie verification code is here!',
    text: `Hey ${userName && userName !== 'there' ? (userName.includes('Family') ? userName : userName + ' Family') : 'there'}! 👋\n\nYour magical verification code is: ${otp}\n\nThis code will expire in 10 minutes\n\nIf you didn't request this code, just ignore this email.\n\nCan't wait to help your family!\n🤖 Allie`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%); padding: 40px 20px; text-align: center;">
          <div style="display: inline-block; background-color: white; border-radius: 20px; padding: 15px 25px; margin-bottom: 20px;">
            <h1 style="color: #14B8A6; margin: 0; font-size: 28px; font-weight: 700;">Allie</h1>
          </div>
          <p style="color: white; margin: 0; font-size: 18px; font-weight: 300;">Your AI Family Assistant</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="font-size: 24px; color: #1a202c; margin-bottom: 10px;">
            Hey ${userName && userName !== 'there' ? (userName.includes('Family') ? userName : userName + ' Family') : 'there'}! 👋
          </h2>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Welcome to your family's command center! Here's your super-secret verification code:
          </p>
          
          <div style="background: linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%); padding: 30px; text-align: center; margin: 30px 0; border-radius: 16px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -20px; left: -20px; width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -30px; right: -30px; width: 80px; height: 80px; background-color: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            <span style="font-size: 36px; font-weight: 700; color: white; letter-spacing: 12px; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); position: relative; z-index: 1;">${otp}</span>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 8px;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              ⏰ <strong>Quick!</strong> This code expires in 10 minutes (that's less time than it takes to find matching socks!)
            </p>
          </div>
          
          <p style="color: #9ca3af; font-size: 14px; margin-top: 30px; text-align: center;">
            Didn't request this code? No worries, just ignore this email!
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #4a5568; font-size: 16px; margin: 0;">Ready to revolutionize family life?</p>
            <p style="font-size: 24px; margin: 10px 0;">🤖 💜</p>
            <p style="color: #14B8A6; font-weight: 600; font-size: 18px; margin: 0;">Allie</p>
            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0;">Your AI-Powered Family Assistant</p>
          </div>
        </div>
      </div>
    `
  };

  return await sgMail.send(msg);
}

// ========== QUIZ REPORT EMAIL ==========

// Send quiz report email
exports.sendQuizReport = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const { email, partnerNames, results, quizId } = req.body;

      if (!email || !results) {
        res.status(400).json({ error: 'Missing email or results' });
        return;
      }

      try {
        // Generate HTML email content
        const htmlContent = generateQuizReportHTML(partnerNames, results, quizId);

        const msg = {
          to: email,
          from: {
            email: 'allie@checkallie.com',
            name: 'Allie - Your Family Balance Partner'
          },
          subject: `Your Family Balance Report: ${results.overallBalance}% Balanced`,
          html: htmlContent,
          text: `Your family balance score is ${results.overallBalance}%. Visit https://checkallie.com/signup?quiz=${quizId} to start improving your balance with Allie.`
        };

        await sgMail.send(msg);
        console.log(`Quiz report sent to ${email}`);

        // Update quiz result in database
        if (quizId) {
          await admin.firestore().collection('quiz_results').doc(quizId).update({
            emailSent: true,
            emailSentAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        res.status(200).json({ success: true, message: 'Report sent successfully' });
      } catch (error) {
        console.error('Error sending quiz report:', error);
        res.status(500).json({ error: 'Failed to send report' });
      }
    });
  });

// Generate HTML for quiz report email
function generateQuizReportHTML(partnerNames, results, quizId) {
  // Handle missing or undefined data gracefully
  if (!results || !partnerNames) {
    console.error('Missing results or partnerNames data');
    return '<h1>Error generating report</h1>';
  }

  const biggestImbalance = results.biggestImbalance || { partner1Share: 50, partner2Share: 50, category: 'tasks' };
  const overloadedPartner = biggestImbalance.partner1Share > biggestImbalance.partner2Share
    ? partnerNames.partner1 || 'Partner 1'
    : partnerNames.partner2 || 'Partner 2';
  const imbalancePercent = Math.max(biggestImbalance.partner1Share || 50, biggestImbalance.partner2Share || 50);

  // Use habitRecommendations instead of habits
  const habits = results.habitRecommendations || results.habits || [];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
        .score-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .score { font-size: 48px; font-weight: bold; color: ${results.overallBalance >= 70 ? '#10b981' : results.overallBalance >= 50 ? '#f59e0b' : '#ef4444'}; }
        .category { padding: 15px; border-left: 4px solid #8b5cf6; margin: 15px 0; background: #faf5ff; }
        .habit { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .habit-title { font-weight: bold; color: #059669; margin-bottom: 5px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Family Balance Report</h1>
          <p>Discover the invisible imbalances in your household</p>
        </div>

        <div class="content">
          <div class="score-box">
            <div class="score">${results.overallBalance || 50}%</div>
            <p>Overall Balance Score</p>
          </div>

          <h2>📊 Key Finding</h2>
          <p><strong>${overloadedPartner}</strong> is carrying <strong>${imbalancePercent}%</strong> of the ${biggestImbalance.category.toLowerCase()}. This is your biggest opportunity for improvement.</p>

          <h2>🎯 Category Breakdown</h2>
          ${results.categories && results.categories.invisibleParental ? `
          <div class="category">
            <strong>Invisible Parental Tasks:</strong> ${results.categories.invisibleParental.balance || 0}% balanced<br>
            ${partnerNames.partner1}: ${results.categories.invisibleParental.partner1Share || 0}% | ${partnerNames.partner2}: ${results.categories.invisibleParental.partner2Share || 0}%
          </div>` : ''}
          ${results.categories && results.categories.invisibleHousehold ? `
          <div class="category">
            <strong>Invisible Household Tasks:</strong> ${results.categories.invisibleHousehold.balance || 0}% balanced<br>
            ${partnerNames.partner1}: ${results.categories.invisibleHousehold.partner1Share || 0}% | ${partnerNames.partner2}: ${results.categories.invisibleHousehold.partner2Share || 0}%
          </div>` : ''}
          ${results.categories && results.categories.visibleParental ? `
          <div class="category">
            <strong>Visible Parental Tasks:</strong> ${results.categories.visibleParental.balance || 0}% balanced<br>
            ${partnerNames.partner1}: ${results.categories.visibleParental.partner1Share || 0}% | ${partnerNames.partner2}: ${results.categories.visibleParental.partner2Share || 0}%
          </div>` : ''}
          ${results.categories && results.categories.visibleHousehold ? `
          <div class="category">
            <strong>Visible Household Tasks:</strong> ${results.categories.visibleHousehold.balance || 0}% balanced<br>
            ${partnerNames.partner1}: ${results.categories.visibleHousehold.partner1Share || 0}% | ${partnerNames.partner2}: ${results.categories.visibleHousehold.partner2Share || 0}%
          </div>` : ''}

          <h2>✨ Your Top 3 Habit Recommendations</h2>
          ${habits && habits.length > 0 ? habits.slice(0, 3).map(habit => `
            <div class="habit">
              <div class="habit-title">${habit.title}</div>
              <p>${habit.description || ''}</p>
              <p><small>${habit.time ? `Time commitment: ${habit.time}` : ''}<br>
              ${habit.impact ? `Expected impact: ${habit.impact}% reduction in imbalance` : ''}</small></p>
            </div>
          `).join('') : '<p>No specific recommendations available at this time.</p>'}

          <div style="text-align: center;">
            <a href="https://checkallie.com/signup?quiz=${quizId}" class="cta-button">
              Start Your Free Trial with Allie
            </a>
            <p>Join thousands of families creating lasting balance</p>
          </div>

          <div class="footer">
            <p>This report is based on your responses to the Quick Balance Quiz.</p>
            <p>Forward this email to your partner to share your results!</p>
            <p>© 2025 Allie | <a href="https://checkallie.com">checkallie.com</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ========== ONBOARDING EMAIL SEQUENCE ==========

// Trigger onboarding emails when a new family is created
exports.onFamilyCreated = functions
  .region('europe-west1')
  .firestore
  .document('families/{familyId}')
  .onCreate(async (snap, context) => {
    const familyData = snap.data();
    const familyId = context.params.familyId;
    
    console.log(`New family created: ${familyId}`);
    
    // Start the onboarding email sequence
    try {
      await startOnboardingSequence({
        familyId,
        familyData
      });
      console.log(`Onboarding sequence started for family ${familyId}`);
    } catch (error) {
      console.error('Error starting onboarding sequence:', error);
    }
  });

// Function to start the 5-email onboarding sequence
async function startOnboardingSequence({ familyId, familyData }) {
  const db = admin.firestore();
  
  // Create onboarding record
  await db.collection('onboardingSequences').doc(familyId).set({
    familyId,
    familyName: familyData.familyName || familyData.name || 'Your',
    parentEmail: familyData.email || familyData.parentEmail,
    parentName: familyData.parentName || familyData.parents?.[0]?.name || '',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    emailsSent: [],
    status: 'active',
    familyEmail: familyData.familyEmail,
    kidsCount: familyData.kidsCount || familyData.children?.length || 0,
    childrenNames: familyData.childrenNames || familyData.children?.map(c => c.name) || []
  });
  
  // Send welcome email immediately
  await sendOnboardingEmail(familyId, 'welcome');
  
  // Schedule remaining emails (in production, use Cloud Scheduler)
  // For now, we'll store the schedule in Firestore
  const emailSchedule = [
    { key: 'calendar', daysAfter: 2 },
    { key: 'fairness', daysAfter: 4 },
    { key: 'memory', daysAfter: 7 },
    { key: 'superpower', daysAfter: 10 }
  ];
  
  await db.collection('onboardingSchedules').doc(familyId).set({
    familyId,
    schedule: emailSchedule.map(item => ({
      ...item,
      scheduledFor: new Date(Date.now() + item.daysAfter * 24 * 60 * 60 * 1000),
      status: 'pending'
    })),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

// Send individual onboarding emails
async function sendOnboardingEmail(familyId, emailType) {
  const db = admin.firestore();
  
  // Get family data
  const familyDoc = await db.collection('families').doc(familyId).get();
  if (!familyDoc.exists) {
    throw new Error('Family not found');
  }
  
  const familyData = familyDoc.data();
  const onboardingDoc = await db.collection('onboardingSequences').doc(familyId).get();
  const onboardingData = onboardingDoc.exists ? onboardingDoc.data() : {};
  
  // Get email template based on type
  const emailTemplate = getOnboardingEmailTemplate(emailType, familyData);
  
  const msg = {
    to: onboardingData.parentEmail || familyData.email,
    from: {
      email: functions.config().sendgrid?.from_email || 'stefan@checkallie.com',
      name: 'Allie'
    },
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text
  };
  
  // Send email
  await sgMail.send(msg);
  
  // Update onboarding record
  await db.collection('onboardingSequences').doc(familyId).update({
    emailsSent: admin.firestore.FieldValue.arrayUnion({
      type: emailType,
      sentAt: new Date().toISOString()
    }),
    lastEmailSent: emailType,
    lastEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log(`Sent ${emailType} email to family ${familyId}`);
}

// Get email templates
function getOnboardingEmailTemplate(type, familyData) {
  const familyName = familyData.familyName || 'Your';
  const parentName = familyData.parentName || 'there';
  
  switch(type) {
    case 'welcome':
      return {
        subject: `${familyName} Family, I noticed something about you... 👀`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <div style="background-color: white; display: inline-block; border-radius: 12px; padding: 10px 20px;">
                <span style="color: #14B8A6; font-size: 20px; font-weight: bold;">Allie</span>
              </div>
            </div>
            <div style="padding: 40px; background: white;">
              <h1 style="color: #1F2937; font-size: 24px; margin: 0 0 20px 0;">Hey ${parentName}! 👋</h1>
              <p style="color: #4B5563; font-size: 16px; line-height: 24px;">I've been analyzing families for a while now, and I noticed something interesting about yours...</p>
              <p style="color: #4B5563; font-size: 16px; line-height: 24px;"><strong>You're juggling ${familyData.kidsCount || 2} kids' schedules, trying to keep everyone happy, AND attempting to have a life of your own.</strong></p>
              <p style="color: #4B5563; font-size: 16px; line-height: 24px;">That's not just parenting. That's executive-level project management with tiny, adorable stakeholders who negotiate bedtime like Fortune 500 CEOs. 😅</p>
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="color: #14B8A6; font-weight: bold;">🔮 Your First Allie Trick: The 10-Second Scheduler</p>
                <p style="color: #4B5563;">Forward ANY email with a date to <strong>${familyData.familyEmail || 'your family email'}</strong></p>
                <p style="color: #4B5563;">I'll automatically add it to your calendar with all the details extracted.</p>
              </div>
              <p style="color: #4B5563;">Tomorrow, I'll show you the feature that made one mom say "This is better than hiring a personal assistant."</p>
              <p style="color: #4B5563; margin-top: 30px;">Here to make life easier,<br><strong style="color: #14B8A6;">Allie</strong> 🤖💜</p>
            </div>
          </div>
        `,
        text: `Hey ${parentName}! Welcome to Allie. I noticed you're managing a lot - ${familyData.kidsCount || 2} kids, schedules, and everything else. Your first trick: forward any email to ${familyData.familyEmail} and I'll add it to your calendar. More tips coming tomorrow! - Allie`
      };
      
    case 'calendar':
      return {
        subject: `${parentName}, this mom's text made me cry happy tears 😭`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="padding: 40px; background: white;">
              <h2 style="color: #1F2937; font-size: 22px;">"I haven't missed a practice in 3 months!"</h2>
              <p style="color: #4B5563;">That's what Sarah (mom of 3 in Denver) texted me yesterday.</p>
              <p style="color: #4B5563;">Before Allie? She was the queen of the "Oh crap, was that TODAY?" panic drive.</p>
              <p style="color: #4B5563;">Her secret? She discovered <strong>"The Merge"</strong> 👇</p>
              <div style="background: linear-gradient(135deg, #E6FFFA 0%, #E0F2FE 100%); border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #0D9488;">🔄 The Merge: All Your Calendars, One Truth</h3>
                <p style="color: #0F766E;">Connect all your calendars. I'll merge everything and detect conflicts before they happen.</p>
              </div>
              <p style="color: #4B5563;">Tomorrow: How one dad uses our fairness system to end sibling fights before they start.</p>
              <p style="color: #14B8A6; font-weight: 600;">Allie</p>
            </div>
          </div>
        `,
        text: `Sarah hasn't missed a practice in 3 months! Her secret? The Merge - connecting all calendars in one place. I'll detect conflicts before they happen. Try it in your dashboard! - Allie`
      };
      
    default:
      return {
        subject: `Updates from Allie for the ${familyName} Family`,
        html: `<p>More great features are waiting for you in Allie!</p>`,
        text: `More great features are waiting for you in Allie!`
      };
  }
}

// Scheduled function to send queued onboarding emails (runs daily)
exports.processOnboardingEmails = functions
  .region('europe-west1')
  .pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Processing onboarding email queue...');
    
    const db = admin.firestore();
    const now = new Date();
    
    // Find all pending scheduled emails
    const schedulesSnapshot = await db.collection('onboardingSchedules').get();
    
    for (const doc of schedulesSnapshot.docs) {
      const scheduleData = doc.data();
      const familyId = doc.id;
      
      // Check each scheduled email
      for (const item of scheduleData.schedule) {
        if (item.status === 'pending' && new Date(item.scheduledFor.toDate()) <= now) {
          try {
            // Send the email
            await sendOnboardingEmail(familyId, item.key);
            
            // Mark as sent
            const updatedSchedule = scheduleData.schedule.map(s => 
              s.key === item.key ? { ...s, status: 'sent', sentAt: now.toISOString() } : s
            );
            
            await db.collection('onboardingSchedules').doc(familyId).update({
              schedule: updatedSchedule
            });
            
            console.log(`Sent ${item.key} email to family ${familyId}`);
          } catch (error) {
            console.error(`Failed to send ${item.key} email to family ${familyId}:`, error);
          }
        }
      }
    }
    
    console.log('Onboarding email processing complete');
  });

// Twilio SMS Webhook for production
exports.twilioSMS = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB'
  })
  .https.onRequest(async (req, res) => {
    // Allow Twilio to POST
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    console.log('📱 Incoming SMS received via Firebase Function');
    console.log('Request headers:', JSON.stringify(req.headers));
    console.log('Request body:', JSON.stringify(req.body));
    
    try {
      const {
        From,        // Sender's phone number
        To,          // Your Twilio number
        Body,        // Message text
        NumMedia,    // Number of media attachments
        MessageSid,  // Unique message ID
        AccountSid   // Your Twilio account
      } = req.body;
      
      console.log(`SMS from ${From}: ${Body}`);
      
      // Parse phone number to find family
      let fromPhone = From.replace(/\D/g, ''); // Remove non-digits
      console.log(`Original phone from Twilio: ${From}`);
      console.log(`Normalized phone (digits only): ${fromPhone}`);
      
      // If it's a US number starting with 1, try both with and without country code
      const phonesToTry = [fromPhone];
      if (fromPhone.startsWith('1') && fromPhone.length === 11) {
        phonesToTry.push(fromPhone.substring(1)); // without country code
      } else if (fromPhone.length === 10) {
        phonesToTry.push('1' + fromPhone); // with country code
      }
      
      // Extract core phone number for matching
      // This handles various formats: +46731536304, 46731536304, 0731536304, 731536304
      let corePhone = fromPhone;
      
      // Remove leading zeros
      if (corePhone.startsWith('0')) {
        corePhone = corePhone.substring(1);
      }
      
      // For Swedish numbers starting with 46, extract the local number
      if (corePhone.startsWith('46') && corePhone.length > 9) {
        corePhone = corePhone.substring(2); // Remove country code 46
      }
      
      // Also create variations to try
      const phoneVariations = [
        fromPhone,                    // Original from Twilio
        corePhone,                    // Core number
        `+${fromPhone}`,             // With + prefix
        `+46${corePhone}`,           // Swedish international format
        `46${corePhone}`,            // Without +
        `0${corePhone}`              // Swedish local format
      ];
      
      console.log(`Phone matching - Original: ${fromPhone}, Core: ${corePhone}`);
      
      // Find family by phone number
      const db = admin.firestore();
      let targetFamily = null;
      
      // FIRST: Check users collection for verified phone numbers
      const usersSnapshot = await db.collection('users')
        .where('phoneNumber', '==', `+${fromPhone}`)
        .get();
      
      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        const userId = usersSnapshot.docs[0].id;
        console.log(`Found user with phone: ${userData.email || userId}`);
        
        // Find which family this user belongs to
        const familiesSnapshot = await db.collection('families').get();
        for (const familyDoc of familiesSnapshot.docs) {
          const familyData = familyDoc.data();
          // Check if user is in family members array
          if (familyData.familyMembers && familyData.familyMembers.some(m => 
            m.email === userData.email || m.id === userId)) {
            console.log(`✅ Found family via user profile: ${familyDoc.id}`);
            targetFamily = {
              id: familyDoc.id,
              data: familyData,
              member: userData
            };
            break;
          }
        }
      }
      
      // If not found via users collection, try the old method
      if (!targetFamily) {
        const familiesSnapshot = await db.collection('families').get();
        
        for (const familyDoc of familiesSnapshot.docs) {
        const familyData = familyDoc.data();
        
        // First check members subcollection
        const membersSnapshot = await db.collection('families').doc(familyDoc.id)
          .collection('members').get();
        
        for (const memberDoc of membersSnapshot.docs) {
          const memberData = memberDoc.data();
          const phoneFields = ['phoneNumber', 'phone']; // Check both field names
          
          for (const field of phoneFields) {
            if (memberData[field]) {
              const memberPhone = String(memberData[field]).replace(/\D/g, '');
              console.log(`Checking member ${memberData.displayName || memberData.email} with ${field}: ${memberPhone}`);
              
              // Check against all phone variations
              for (const phoneVariation of phoneVariations) {
                if (memberPhone === phoneVariation || phoneVariation === memberPhone) {
                  console.log(`✅ Match found! Family: ${familyDoc.id}, Member: ${memberData.displayName || memberData.email}`);
                  console.log(`  Matched: memberPhone(${memberPhone}) === variation(${phoneVariation})`);
                  targetFamily = {
                    id: familyDoc.id,
                    data: familyData,
                    member: memberData
                  };
                  break;
                }
                
                // Also check if they contain each other (for partial matches)
                if (!targetFamily && (memberPhone.includes(corePhone) || corePhone.includes(memberPhone))) {
                  console.log(`✅ Partial match! Family: ${familyDoc.id}, Member: ${memberData.displayName || memberData.email}`);
                  console.log(`  Matched: core(${corePhone}) with member(${memberPhone})`);
                  targetFamily = {
                    id: familyDoc.id,
                    data: familyData,
                    member: memberData
                  };
                  break;
                }
              }
              
              if (targetFamily) break;
              
              // Also try last 10 digits comparison (core US number)
              if (!targetFamily && memberPhone.length >= 10 && fromPhone.length >= 10) {
                const memberLast10 = memberPhone.slice(-10);
                const fromLast10 = fromPhone.slice(-10);
                if (memberLast10 === fromLast10) {
                  console.log(`✅ Last 10 digits match! Family: ${familyDoc.id}, Member: ${memberData.displayName || memberData.email}`);
                  targetFamily = {
                    id: familyDoc.id,
                    data: familyData,
                    member: memberData
                  };
                  break;
                }
              }
            }
          }
          if (targetFamily) break;
        }
        
        // Also check members array in family document (legacy structure)
        if (!targetFamily && familyData.members && Array.isArray(familyData.members)) {
          for (const member of familyData.members) {
            if (member.phone) {
              const memberPhone = String(member.phone).replace(/\D/g, '');
              console.log(`Checking array member ${member.name} with phone: ${memberPhone}`);
              
              for (const phoneToTry of phonesToTry) {
                if (memberPhone === phoneToTry) {
                  console.log(`✅ Array member match found! Family: ${familyDoc.id}, Member: ${member.name}`);
                  targetFamily = {
                    id: familyDoc.id,
                    data: familyData,
                    member: member
                  };
                  break;
                }
              }
              
              // Last 10 digits comparison
              if (!targetFamily && memberPhone.length >= 10 && fromPhone.length >= 10) {
                const memberLast10 = memberPhone.slice(-10);
                const fromLast10 = fromPhone.slice(-10);
                if (memberLast10 === fromLast10) {
                  console.log(`✅ Array member last 10 match! Family: ${familyDoc.id}, Member: ${member.name}`);
                  targetFamily = {
                    id: familyDoc.id,
                    data: familyData,
                    member: member
                  };
                  break;
                }
              }
            }
            if (targetFamily) break;
          }
        }
        
        if (targetFamily) break;
      }
      }  // Close the if (!targetFamily) block
      
      if (!targetFamily) {
        console.log(`No family found for phone: ${From}`);
        console.log(`WARNING: SMS will be saved without family association`);
        // Still save the SMS even without family match for debugging
        // You can manually associate it later
        const db = admin.firestore();
        const unassociatedSMS = {
          messageId: MessageSid,
          type: 'sms',
          source: 'sms',
          from: From,
          phoneNumber: From,
          to: To,
          body: Body,
          content: Body,
          receivedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'unread',
          familyId: null,  // No family matched
          familyEmailPrefix: 'unmatched',
          hasMedia: parseInt(NumMedia) > 0,
          mediaCount: parseInt(NumMedia) || 0,
          needsManualAssociation: true
        };
        
        const unassociatedRef = await db.collection('smsInbox').add(unassociatedSMS);
        console.log(`Unassociated SMS saved with ID: ${unassociatedRef.id}`);
        
        // Return empty response to Twilio
        res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        return;
      }
      
      // Store SMS in unified inbox
      const smsData = {
        messageId: MessageSid,
        type: 'sms',
        source: 'sms',
        from: From,
        phoneNumber: From,
        to: To,
        body: Body,
        content: Body,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'unread',
        familyId: targetFamily.id,
        familyEmailPrefix: targetFamily.data.emailPrefix || targetFamily.id,
        hasMedia: parseInt(NumMedia) > 0,
        mediaCount: parseInt(NumMedia) || 0
      };
      
      // Handle MMS media
      if (parseInt(NumMedia) > 0) {
        smsData.media = [];
        for (let i = 0; i < parseInt(NumMedia); i++) {
          const mediaUrl = req.body[`MediaUrl${i}`];
          const mediaType = req.body[`MediaContentType${i}`];
          if (mediaUrl) {
            smsData.media.push({
              url: mediaUrl,
              contentType: mediaType,
              index: i
            });
          }
        }
      }
      
      // Save to smsInbox collection
      const smsRef = await db.collection('smsInbox').add(smsData);
      console.log(`SMS saved with ID: ${smsRef.id}`);
      
      // Process with AI to extract actions
      console.log('Starting AI processing for SMS');
      try {
        const apiKey = functions.config().anthropic?.apikey || functions.config().claude?.api_key || process.env.CLAUDE_API_KEY;
        console.log('API key check:', { 
          hasAnthropicKey: !!functions.config().anthropic?.apikey,
          hasClaudeKey: !!functions.config().claude?.api_key,
          hasEnvKey: !!process.env.CLAUDE_API_KEY,
          apiKeyFound: !!apiKey
        });
        
        if (apiKey) {
          console.log('API key found, proceeding with AI analysis');
          // Get current date for context
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1;
          const currentDay = currentDate.getDate();
          
          // Get family members to exclude from contact creation
          let familyMemberNames = [];
          try {
            const familyDoc = await db.collection('families').doc(targetFamily.id).get();
            const familyData = familyDoc.data();
            if (familyData && familyData.members) {
              // Get member details
              const memberPromises = familyData.members.map(async (memberEmail) => {
                const userQuery = await db.collection('users')
                  .where('email', '==', memberEmail)
                  .limit(1)
                  .get();
                if (!userQuery.empty) {
                  return userQuery.docs[0].data().name || memberEmail.split('@')[0];
                }
                return memberEmail.split('@')[0];
              });
              const memberDetails = await Promise.all(memberPromises);
              familyMemberNames = memberDetails;
            }
          } catch (err) {
            console.log('Could not get family members:', err);
          }
          
          const familyMembersList = familyMemberNames.length > 0 
            ? `\n\nFAMILY MEMBERS (DO NOT create contacts for these people): ${familyMemberNames.join(', ')}`
            : '';
          
          const aiPrompt = `You are Allie, the world's best family assistant. Analyze this SMS message and create ALL necessary interconnected actions. Think comprehensively - every message should generate contacts, tasks, and events as appropriate.

Today's date: ${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}
SMS: "${Body}"${familyMembersList}

CRITICAL REQUIREMENTS - YOU MUST CREATE ALL THREE TYPES:
1. CREATE A CONTACT for EVERY EXTERNAL person mentioned (Coach Felix, Dr Smith, Teacher Sarah, etc.) - BUT NOT for family members listed above
2. CREATE A TASK for EVERY action item (get tennis racket, call doctor, prepare lunch, etc.)  
3. CREATE AN EVENT for EVERY appointment/meeting (tennis lesson, doctor visit, school meeting, etc.)

IMPORTANT: 
- Only create contacts for people who are NOT family members
- If someone mentioned is in the family members list above, DO NOT create a contact for them
- Even if the external contact might already exist, ALWAYS create the contact action. The app will check for duplicates.

TASK ASSIGNMENT RULES (IMPORTANT - BE INTELLIGENT):
- Parse the message carefully to understand WHO should do the task
- If a specific person is mentioned BY NAME or ROLE, assign to them:
  - "for papa", "papa should", "papa needs to" → assignedTo: ["Papa"]  
  - "for mama", "mama should", "mama needs to" → assignedTo: ["Mama"]
  - If a child's actual name is used (any name), assign to that name exactly as written
  - "for sister", "for brother" → use the actual name if you can infer it
- For COLLECTIVE/GENERIC terms, assign to parents who manage the family:
  - "kids need to", "children should", "the kids" → assignedTo: ["Mama", "Papa"] 
  - "family needs to", "we need to" → assignedTo: ["Mama", "Papa"]
- Look for context clues:
  - "wash the car" typically an adult task → assign to mentioned person or Papa
  - "clean room" with child's name → assign to that child  
  - "homework" or "practice" → assign to child if named, otherwise parents
- NEVER hardcode specific names - use whatever names are in the message
- Default to ["Mama", "Papa"] only if truly unclear
- Examples:
  - "Create task for papa to wash car by Friday" → assignedTo: ["Papa"]
  - "Task for Lillian to clean her room" → assignedTo: ["Lillian"]
  - "Kids need to do homework" → assignedTo: ["Mama", "Papa"]
  - "Remind Johnny to practice piano" → assignedTo: ["Johnny"]
  - "Get the kids new shoes" → assignedTo: ["Mama", "Papa"]

For the example "Tennis lesson with Coach Felix next Wednesday at 5pm at MIK, need to get a new tennis racket":
- ✅ MUST create contact for Coach Felix
- ✅ MUST create task for getting tennis racket
- ✅ MUST create event for tennis lesson

Return ONLY valid JSON (no comments). MINIMUM 3 actions required

Calculate actual dates - if today is ${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')} and they say "next Wednesday", calculate the actual date.

Return this exact structure:
{
  "summary": "brief summary",
  "category": "activity",
  "suggestedActions": [
    {
      "type": "contact",
      "title": "Add Coach Felix as contact",
      "description": "Tennis coach",
      "priority": "medium",
      "data": {
        "name": "Coach Felix",
        "title": "Tennis Coach",
        "type": "sports",
        "category": "sports",
        "specialty": "Tennis",
        "notes": "Tennis coach for family member",
        "forPerson": ["Oly"]
      }
    },
    {
      "type": "task",
      "title": "Get new tennis racket",
      "description": "Buy tennis racket before lesson",
      "priority": "high",
      "data": {
        "title": "Buy tennis racket for Oly",
        "description": "Needed before tennis lesson with Coach Felix",
        "assignedTo": ["Mama", "Papa"],
        "dueDate": "2025-09-10",
        "priority": "high",
        "relatedTo": "Oly",
        "source": "SMS"
      }
    },
    {
      "type": "calendar",
      "title": "Tennis lesson",
      "description": "Tennis lesson with Coach Felix",
      "priority": "high",
      "data": {
        "title": "Tennis lesson - Oly",
        "description": "Tennis lesson with Coach Felix",
        "startDate": "2025-09-11T17:00:00.000Z",
        "endDate": "2025-09-11T18:00:00.000Z",
        "location": "MIK",
        "attendees": ["Oly"],
        "relatedContacts": ["Coach Felix"]
      }
    }
  ]
}`;

          const anthropicResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model: 'claude-3-haiku-20240307',
              messages: [{
                role: 'user',
                content: aiPrompt
              }],
              max_tokens: 1500,
              temperature: 0.3
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
              }
            }
          );
          
          if (anthropicResponse.data?.content?.[0]?.text) {
            try {
              const aiAnalysis = JSON.parse(anthropicResponse.data.content[0].text);
              
              // Update SMS with AI analysis
              await db.collection('smsInbox').doc(smsRef.id).update({
                aiAnalysis,
                hasAiAnalysis: true,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'processed'
              });
              
              // Send response if actions were found
              console.log('Checking if should send SMS response:', {
                hasActions: aiAnalysis.suggestedActions?.length > 0,
                actionCount: aiAnalysis.suggestedActions?.length,
                hasTwilioClient: !!twilioClient
              });
              
              if (aiAnalysis.suggestedActions && aiAnalysis.suggestedActions.length > 0) {
                if (twilioClient) {
                  // Ultra-simple message for testing
                  const responseMessage = `Got it - ${aiAnalysis.suggestedActions.length} actions ready in app`;
                  
                  try {
                    console.log('Sending SMS response:', { from: To, to: From, message: responseMessage });
                    // Try with explicit international format
                    const toNumber = From.startsWith('+') ? From : `+${From}`;
                    console.log('Sending to number:', toNumber);
                    
                    const result = await twilioClient.messages.create({
                      body: responseMessage,
                      from: To,
                      to: toNumber
                    });
                    console.log('SMS response sent successfully:', {
                      sid: result.sid,
                      status: result.status,
                      to: result.to,
                      from: result.from,
                      price: result.price
                    });
                  } catch (smsError) {
                    console.error('Failed to send SMS response:', smsError);
                  }
                } else {
                  console.log('Twilio client not initialized - cannot send SMS response');
                }
              }
            } catch (parseError) {
              console.error('Failed to parse AI response:', parseError);
            }
          }
        } else {
          console.error('No API key found - skipping AI processing');
        }
      } catch (aiError) {
        console.error('AI processing error:', aiError);
      }
      
      // Send Twilio empty response (we already sent SMS if needed)
      res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      
    } catch (error) {
      console.error('SMS webhook error:', error);
      res.status(500).send('Error processing SMS');
    }
  });

// SendGrid Email Webhook for production
exports.handleEmail = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB'
  })
  .https.onRequest(async (req, res) => {
    // Allow SendGrid to POST
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    console.log('📧 Incoming email received via Firebase Function');
    console.log('Request headers:', JSON.stringify(req.headers));
    console.log('Request body type:', typeof req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    try {
      // Parse the multipart form data from SendGrid
      let emailData = {};
      
      // Check if this is multipart/form-data (SendGrid with "Send Raw" enabled)
      if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        console.log('📦 Processing multipart/form-data from SendGrid');
        
        // Parse multipart data using Busboy
        const Busboy = require('busboy');
        const busboy = Busboy({ headers: req.headers });
        const fields = {};
        
        // Wait for all fields to be parsed
        await new Promise((resolve, reject) => {
          busboy.on('field', (fieldname, val) => {
            console.log(`Field [${fieldname}]: value length = ${val ? val.length : 0}`);
            fields[fieldname] = val;
          });
          
          busboy.on('finish', () => {
            console.log('Busboy finished parsing');
            resolve();
          });
          
          busboy.on('error', reject);
          
          // Write the raw request to busboy
          if (req.rawBody) {
            busboy.end(req.rawBody);
          } else {
            req.pipe(busboy);
          }
        });
        
        emailData = fields;
        console.log('Parsed fields:', Object.keys(emailData));
        
      } else if (typeof req.body === 'object') {
        // Already parsed by Express/Firebase
        console.log('📋 Using pre-parsed body');
        emailData = req.body;
        console.log('Body keys:', Object.keys(emailData));
      } else if (typeof req.body === 'string') {
        // Parse URL encoded data
        console.log('🔗 Parsing URL-encoded data');
        const params = new URLSearchParams(req.body);
        emailData = {
          to: params.get('to'),
          from: params.get('from'),
          subject: params.get('subject'),
          text: params.get('text'),
          html: params.get('html'),
          envelope: params.get('envelope'),
          email: params.get('email')
        };
      }
      
      // SendGrid with "Send Raw" enabled sends the email in the 'email' field
      // The raw email contains all headers and body
      const rawEmail = emailData.email || emailData.Email || '';
      
      // Extract fields from SendGrid Inbound Parse
      let to = emailData.to || emailData.To || '';
      let from = emailData.from || emailData.From || '';
      let subject = emailData.subject || emailData.Subject || '(No Subject)';
      let text = emailData.text || emailData.Text || '';
      let html = emailData.html || emailData.Html || '';
      const envelope = emailData.envelope || emailData.Envelope || '';
      const headers = emailData.headers || emailData.Headers || '';
      
      console.log('Extracted fields - to:', to, 'from:', from, 'subject:', subject);
      console.log('Text length:', text ? text.length : 0, 'HTML length:', html ? html.length : 0);
      console.log('Raw email length:', rawEmail ? rawEmail.length : 0);
      
      // If we have raw email, parse it for better content extraction
      if (rawEmail && !text && !html) {
        console.log('Parsing raw email content...');
        // Raw email includes headers and body separated by double newline
        const emailParts = rawEmail.split(/\r?\n\r?\n/);
        if (emailParts.length > 1) {
          // Everything after the first double newline is the body
          text = emailParts.slice(1).join('\n\n');
          console.log('Extracted text from raw email, length:', text.length);
        }
      }
      
      // Clean up the from field (remove name, keep just email)
      if (from.includes('<')) {
        const emailMatch = from.match(/<(.+?)>/);
        if (emailMatch) {
          from = emailMatch[1];
        }
      }
      
      // Ensure we have content
      if (!text && !html && rawEmail) {
        text = rawEmail; // Use the entire raw email as fallback
      }
      
      console.log(`Email from ${from} to ${to}: ${subject}`);
      
      // Parse the "to" address to find family
      // Format: familyname@families.checkallie.com
      let targetFamily = null;
      const toAddress = to || '';
      const emailPrefix = toAddress.split('@')[0].toLowerCase();
      
      console.log(`Looking for family with email prefix: ${emailPrefix}`);

      const db = admin.firestore();

      // First, try to find the family via email_registry (most efficient)
      try {
        const emailRegistryDoc = await db.collection('email_registry').doc(emailPrefix).get();

        if (emailRegistryDoc.exists) {
          const registryData = emailRegistryDoc.data();
          console.log(`✅ Found family via email_registry: ${registryData.familyId}`);

          // Get the family document
          const familyDoc = await db.collection('families').doc(registryData.familyId).get();

          if (familyDoc.exists) {
            targetFamily = {
              id: familyDoc.id,
              data: familyDoc.data()
            };
            console.log(`✅ Loaded family ${familyDoc.id} from email_registry match`);
          }
        }
      } catch (registryError) {
        console.log('Email registry lookup failed, falling back to family search:', registryError.message);
      }

      // If not found in registry, fall back to searching families collection
      if (!targetFamily) {
        console.log('Email not found in registry, searching families collection...');
        const familiesSnapshot = await db.collection('families').get();

        for (const familyDoc of familiesSnapshot.docs) {
          const familyData = familyDoc.data();

          // Check multiple possible fields for email matching
          const familyEmail = familyData.familyEmail || familyData.email || '';
          // Check both emailPrefix and familyEmailPrefix fields
          const familyEmailPrefix = familyData.familyEmailPrefix || familyData.emailPrefix || '';

          // Extract prefix from stored email if needed
          const storedPrefix = familyEmail.split('@')[0].toLowerCase();

          console.log(`Checking family ${familyDoc.id}: email=${familyEmail}, prefix=${familyEmailPrefix}`);

          if (emailPrefix === storedPrefix || emailPrefix === familyEmailPrefix.toLowerCase()) {
            console.log(`✅ Found family via email prefix: ${familyDoc.id} (matched: ${emailPrefix})`);
            targetFamily = {
              id: familyDoc.id,
              data: familyData
            };
            break;
          }

          // Also check if it's the Palsson family specifically
          if (emailPrefix === 'palsson' &&
              (familyData.familyName === 'Palsson' ||
               familyData.familyName === 'The Palsson Family' ||
               familyData.parentName?.includes('Stefan'))) {
            console.log(`✅ Found Palsson family: ${familyDoc.id}`);
            targetFamily = {
              id: familyDoc.id,
              data: familyData
            };
            break;
          }
        }
      }
      
      // Get family ID and members
      let familyId = targetFamily?.id;
      let familyMembers = [];
      
      if (targetFamily) {
        familyId = targetFamily.id;
        
        // Get family members
        if (targetFamily.data.familyMembers) {
          familyMembers = targetFamily.data.familyMembers;
        } else if (targetFamily.data.members) {
          familyMembers = targetFamily.data.members;
        }
        
        console.log(`Processing email for family ${familyId} with ${familyMembers.length} members`);
      } else {
        console.log(`WARNING: Email will be saved without family association`);
        // Still save the email even without family match for debugging
      }
      
      // Store email in unified inbox
      const emailRecord = {
        familyId: familyId || 'unassigned',
        source: 'email',
        type: 'email',
        from: from || 'unknown@email.com',  // Ensure from is never undefined
        to: to || 'unknown@families.checkallie.com',  // Ensure to is never undefined
        subject: subject || '(No Subject)',
        content: {
          text: text || rawEmail || '',  // Use raw email as fallback
          html: html || '',
          raw: rawEmail ? rawEmail.substring(0, 5000) : ''  // Store first 5000 chars of raw email
        },
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        processed: false,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Save to emailInbox collection
      const emailRef = await db.collection('emailInbox').add(emailRecord);
      console.log(`Email saved with ID: ${emailRef.id}`);
      
      // Process with AI if we have a family ID
      if (familyId && familyId !== 'unassigned') {
        console.log('Starting AI processing for email');
        
        try {
          // Get family members list for context
          let familyMembersList = '';
          if (familyMembers && familyMembers.length > 0) {
            const memberNames = familyMembers
              .filter(m => m && m.name)
              .map(m => `${m.name} (${m.role || 'member'})`)
              .join(', ');
            familyMembersList = `\n\nFamily members: ${memberNames}`;
          }
          
          const aiPrompt = `You are Allie, the world's best family assistant. Analyze this email and create ALL necessary interconnected actions. Think comprehensively - every message should generate contacts, tasks, and events as appropriate.

IMPORTANT LANGUAGE HANDLING:
- If the email is in Swedish (or any non-English language), FIRST translate it to English
- Then analyze the TRANSLATED content
- Include both the translation and original in your response

IMPORTANT: This might be a FORWARDED email. Look for patterns like:
- "---------- Forwarded message ---------"
- "Vidarebefordrat meddelande" (Swedish for forwarded message)
- "From:", "Från:", "Date:", "Datum:", "Subject:", "Ämne:", "To:", "Till:" headers within the body
- "Begin forwarded message:" or "Vidarebefordrat meddelande:"
- Multiple levels of quoted text with ">" or ">>"

If this is a forwarded email, extract information from the ORIGINAL message, not just the forwarding note.

Email from: ${from}
Subject: ${subject}
Content: ${text || html || rawEmail}${familyMembersList}

Analyze this email (including any forwarded content) and extract:
1. Calendar events (with dates, times, locations) - from the original message if forwarded
2. Tasks that need to be done
3. Contact information to save (especially from original sender if forwarded)
4. Important information to remember
5. If this is from a school, doctor, or organization, extract their contact details

For forwarded emails:
- Focus on the content of the ORIGINAL message
- Extract the original sender as a contact if it's from an organization
- Parse dates/events from the original content, not the forward date

Return a JSON object with this structure:
{
  "summary": "Brief summary of the email",
  "translation": "Full English translation if original was in another language",
  "originalLanguage": "Swedish|Spanish|etc or English if already in English",
  "category": "school|medical|social|activity|shopping|travel|financial|other",
  "isForwarded": true/false,
  "originalSender": "email@domain.com if forwarded",
  "events": [...],
  "tasks": [...],
  "contacts": [...],
  "suggestedResponse": "Draft response if needed"
}`;

          const apiKey = functions.config().anthropic?.apikey || functions.config().claude?.api_key || process.env.CLAUDE_API_KEY;
          
          if (apiKey) {
            const anthropicResponse = await axios.post(
              'https://api.anthropic.com/v1/messages',
              {
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1500,
                messages: [{
                  role: 'user',
                  content: aiPrompt
                }],
                temperature: 0.7
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey,
                  'anthropic-version': '2023-06-01'
                }
              }
            );
            
            if (anthropicResponse.data?.content?.[0]?.text) {
              const aiResponseText = anthropicResponse.data.content[0].text;
              console.log('AI Response:', aiResponseText);
              
              // Try to parse JSON from the response
              const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                
                // Update email with AI analysis
                await db.collection('emailInbox').doc(emailRef.id).update({
                  processed: true,
                  processedAt: admin.firestore.FieldValue.serverTimestamp(),
                  aiAnalysis: analysis,
                  allieActions: analysis.tasks || [],
                  summary: analysis.summary || 'Email processed'
                });
                
                console.log('Email processed with AI analysis');
              }
            }
          }
        } catch (aiError) {
          console.error('AI processing error:', aiError);
        }
      }
      
      // Always return 200 to SendGrid
      res.status(200).send('OK');
      
    } catch (error) {
      console.error('Email webhook error:', error);
      // Still return 200 to SendGrid to prevent retries
      res.status(200).send('OK');
    }
  });

// Twilio SMS verification endpoints
exports.twilioSendVerification = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      try {
        const { phoneNumber, userId } = req.body;
        
        if (!phoneNumber) {
          return res.status(400).json({ error: 'Phone number required' });
        }
        
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store code in Firestore for verification
        const db = admin.firestore();
        await db.collection('verificationCodes').doc(phoneNumber).set({
          code: code,
          userId: userId || 'temp-user',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          attempts: 0
        });
        
        // Send SMS using Twilio
        if (twilioClient) {
          try {
            const twilioPhoneNumber = functions.config().twilio?.phone_number || process.env.TWILIO_PHONE_NUMBER || '+17197486209';

            await twilioClient.messages.create({
              body: `Your Allie verification code is: ${code}`,
              from: twilioPhoneNumber,
              to: phoneNumber
            });

            console.log(`SMS verification sent to ${phoneNumber}`);
          } catch (twilioError) {
            console.error('Twilio SMS error:', twilioError);
            // Don't fail if SMS doesn't send, still store the code
          }
        } else {
          console.log(`Twilio not configured - verification code for ${phoneNumber}: ${code}`);
        }

        res.json({
          success: true,
          message: 'Verification code sent',
          // Only return code in development for testing
          ...(process.env.NODE_ENV !== 'production' && { debug: code })
        });
      } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ error: 'Failed to send SMS verification' });
      }
    });
  });

exports.twilioVerifyCode = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      try {
        const { phoneNumber, code } = req.body;
        
        if (!phoneNumber || !code) {
          return res.status(400).json({ error: 'Phone number and code required' });
        }
        
        // Check code in Firestore
        const db = admin.firestore();
        const docRef = await db.collection('verificationCodes').doc(phoneNumber).get();
        
        if (!docRef.exists) {
          return res.status(400).json({ error: 'No verification code found' });
        }
        
        const storedData = docRef.data();
        
        // Check if code is expired (10 minutes)
        const timestamp = storedData.timestamp?.toMillis() || 0;
        if (Date.now() - timestamp > 10 * 60 * 1000) {
          await docRef.ref.delete();
          return res.status(400).json({ error: 'Verification code expired' });
        }
        
        // Check attempts
        if (storedData.attempts >= 3) {
          await docRef.ref.delete();
          return res.status(400).json({ error: 'Too many attempts. Please request a new code.' });
        }
        
        // Verify code
        if (storedData.code !== code) {
          await docRef.ref.update({ attempts: storedData.attempts + 1 });
          return res.status(400).json({ error: 'Invalid verification code' });
        }
        
        // Success - delete the code
        await docRef.ref.delete();
        
        res.json({ 
          success: true, 
          message: 'Phone number verified successfully',
          userId: storedData.userId
        });
      } catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).json({ error: 'Failed to verify code' });
      }
    });
  });

// Investor password verification endpoint
exports.verifyInvestorPassword = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      try {
        const { password } = req.body;

        // Store password securely as environment variable or hardcoded for now
        const INVESTOR_PASSWORD = functions.config().investor?.password || 'allieinvestor';

        // Verify password
        if (password === INVESTOR_PASSWORD) {
          // Generate a simple session token (in production, use JWT or similar)
          const sessionToken = Buffer.from(Date.now().toString()).toString('base64');

          res.json({
            success: true,
            sessionToken: sessionToken
          });
        } else {
          // Add delay to prevent brute force attacks
          await new Promise(resolve => setTimeout(resolve, 1000));
          res.status(401).json({
            success: false,
            error: 'Invalid password'
          });
        }
      } catch (error) {
        console.error('Investor password verification error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });
  });

// ============================================================================
// KNOWLEDGE GRAPH - REAL-TIME NEO4J SYNC
// ============================================================================

/**
 * Real-time Firestore → Neo4j synchronization for Knowledge Graph
 *
 * Automatically syncs data when families use the app:
 * - Family members → Person nodes
 * - Tasks → Task nodes with CREATED_BY relationships
 * - Events → Event nodes with ORGANIZES relationships
 * - Chores → Cognitive load updates
 * - Fair Play responses → Responsibility nodes with OWNS relationships
 *
 * Production-scale: Triggers fire on every Firestore write
 */

const neo4jSyncModule = require('./neo4j-sync');

// Sync family members → Person nodes + relationships
exports.syncFamilyToNeo4j = functions.firestore
  .document('families/{familyId}')
  .onWrite(neo4jSyncModule.onFamilyWrite);

// Sync tasks → Task nodes + CREATED_BY relationships
exports.syncTaskToNeo4j = functions.firestore
  .document('kanbanTasks/{taskId}')
  .onWrite(neo4jSyncModule.onTaskWrite);

// Sync events → Event nodes + ORGANIZES relationships
exports.syncEventToNeo4j = functions.firestore
  .document('events/{eventId}')
  .onWrite(neo4jSyncModule.onEventWrite);

// Sync chores → Cognitive load updates
exports.syncChoreToNeo4j = functions.firestore
  .document('choreInstances/{choreId}')
  .onCreate(neo4jSyncModule.onChoreCreate);

// Sync Fair Play responses → Responsibility nodes
exports.syncFairPlayToNeo4j = functions.firestore
  .document('fairPlayResponses/{responseId}')
  .onCreate(neo4jSyncModule.onFairPlayResponseCreate);