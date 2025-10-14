const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send notification email to family when Allie processes an email
 */
async function notifyFamilyOfProcessedEmail(familyData, emailData, allieActions) {
  try {
    // Don't send notification if no actions were taken
    if (!allieActions || allieActions.length === 0) {
      return;
    }
    
    // Get family members with notification enabled
    const notificationEmails = familyData.members
      ?.filter(member => member.emailNotifications !== false && member.email)
      ?.map(member => member.email) || [];
    
    if (notificationEmails.length === 0) {
      console.log('No family members to notify');
      return;
    }
    
    // Create action summary
    const actionSummary = allieActions.map(action => {
      let icon = '';
      switch (action.type) {
        case 'calendar': icon = '📅'; break;
        case 'contact': icon = '👤'; break;
        case 'document': icon = '📄'; break;
        case 'task': icon = '✅'; break;
        default: icon = '•';
      }
      return `${icon} ${action.title}${action.status === 'error' ? ' (Failed)' : ''}`;
    }).join('\n');
    
    // Create email content
    const msg = {
      to: notificationEmails,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'stefan@checkallie.com',
        name: 'Allie - Your Family Assistant'
      },
      subject: `Allie processed: ${emailData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f0f9ff; padding: 20px; text-align: center;">
            <h1 style="color: #1e40af; margin: 0;">Allie Processed Your Email</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px;">
              I've processed an email sent to <strong>${emailData.to}</strong>
            </p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #6b7280;">
                <strong>From:</strong> ${emailData.from}<br>
                <strong>Subject:</strong> ${emailData.subject}
              </p>
            </div>
            
            <h2 style="color: #1f2937; font-size: 20px; margin-top: 30px;">
              What I Did:
            </h2>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 15px 0;">
              <pre style="margin: 0; font-family: Arial, sans-serif; white-space: pre-wrap;">${actionSummary}</pre>
            </div>
            
            ${emailData.summary ? `
              <h3 style="color: #1f2937; font-size: 18px; margin-top: 25px;">
                Email Summary:
              </h3>
              <p style="color: #4b5563; line-height: 1.6;">
                ${emailData.summary}
              </p>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/inbox" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View in Inbox
              </a>
            </div>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>
              You're receiving this because you have email notifications enabled.<br>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings" style="color: #3b82f6;">
                Manage notification preferences
              </a>
            </p>
          </div>
        </div>
      `,
      text: `
Allie processed an email sent to ${emailData.to}

From: ${emailData.from}
Subject: ${emailData.subject}

What I did:
${actionSummary}

${emailData.summary ? `\nEmail Summary:\n${emailData.summary}` : ''}

View in inbox: ${process.env.FRONTEND_URL || 'http://localhost:3001'}/inbox
      `
    };
    
    // Send email
    await sgMail.send(msg);
    console.log('✅ Notification sent to family members:', notificationEmails.join(', '));
    
  } catch (error) {
    console.error('Error sending notification email:', error);
    // Don't throw - notifications are not critical
  }
}

/**
 * Send weekly summary of processed items
 */
async function sendWeeklySummary(familyId, summary) {
  // TODO: Implement weekly summary
  console.log('Weekly summary not yet implemented');
}

module.exports = {
  notifyFamilyOfProcessedEmail,
  sendWeeklySummary
};