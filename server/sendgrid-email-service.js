const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class SendGridEmailService {
  /**
   * Send OTP verification email
   */
  async sendOTPEmail(email, otp, userName = '') {
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'hello@allie.family',
        name: 'Allie - Your Family Assistant'
      },
      subject: '🎉 Your Allie verification code is here!',
      text: `Hey ${userName && userName !== 'there' ? (userName.includes('Family') ? userName : userName + ' Family') : 'there'}! 👋\n\nYour magical verification code is: ${otp}\n\nThis code will expire in 10 minutes (plenty of time!)\n\nIf you didn't request this code, just ignore this email.\n\nCan't wait to help your family!\n🤖 Allie`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <!--[if mso]>
          <style type="text/css">
            table { border-collapse: collapse; }
          </style>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%); padding: 40px 20px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="display: inline-block; background-color: white; border-radius: 16px; padding: 12px 24px;">
                              <span style="color: #14B8A6; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Allie</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 12px;">
                            <p style="color: white; margin: 0; font-size: 16px; opacity: 0.95;">Your AI Family Assistant</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 40px 30px 40px;">
                      <h1 style="font-size: 24px; color: #1F2937; margin: 0 0 8px 0; font-weight: 600;">
                        Hey ${userName && userName !== 'there' ? (userName.includes('Family') ? userName : userName + ' Family') : 'there'}! 👋
                      </h1>
                      
                      <p style="color: #6B7280; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                        Welcome to your family's command center! Here's your verification code:
                      </p>
                      
                      <!-- Code Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <table cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%); border-radius: 12px; padding: 2px;">
                              <tr>
                                <td>
                                  <table cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px;">
                                    <tr>
                                      <td style="padding: 24px 40px; text-align: center;">
                                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${otp}</span>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Timer Warning -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #FEF3C7; border-radius: 8px; padding: 12px 16px; border-left: 4px solid #F59E0B;">
                            <p style="color: #92400E; font-size: 14px; margin: 0;">
                              ⏰ <strong>Quick!</strong> This code expires in 10 minutes
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Features -->
                      <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #E5E7EB;">
                        <p style="color: #6B7280; font-size: 14px; margin: 0 0 16px 0; text-align: center;">
                          <strong>What Allie can do for your family:</strong>
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <table cellpadding="5" cellspacing="0">
                                <tr>
                                  <td style="padding: 4px;">
                                    <span style="display: inline-block; background-color: #E6FFFA; color: #14B8A6; padding: 6px 12px; border-radius: 16px; font-size: 13px;">📅 Smart Calendar</span>
                                  </td>
                                  <td style="padding: 4px;">
                                    <span style="display: inline-block; background-color: #F0FDFA; color: #0D9488; padding: 6px 12px; border-radius: 16px; font-size: 13px;">✅ Task Balance</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 4px;">
                                    <span style="display: inline-block; background-color: #E0F2FE; color: #0EA5E9; padding: 6px 12px; border-radius: 16px; font-size: 13px;">💬 Family Chat</span>
                                  </td>
                                  <td style="padding: 4px;">
                                    <span style="display: inline-block; background-color: #CCFBF1; color: #0F766E; padding: 6px 12px; border-radius: 16px; font-size: 13px;">🎯 Habits</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      <p style="color: #9CA3AF; font-size: 13px; margin: 32px 0 0 0; text-align: center;">
                        Didn't request this? Just ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
                      <p style="color: #6B7280; font-size: 14px; margin: 0 0 8px 0;">
                        Ready to transform family life?
                      </p>
                      <p style="margin: 8px 0;">
                        <span style="font-size: 20px;">🤖 💜</span>
                      </p>
                      <p style="color: #14B8A6; font-weight: 600; font-size: 16px; margin: 8px 0 4px 0;">
                        Team Allie
                      </p>
                      <p style="color: #9CA3AF; font-size: 12px; margin: 16px 0 0 0;">
                        © 2024 Allie by Parentload • <a href="https://checkallie.com" style="color: #14B8A6; text-decoration: none;">checkallie.com</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('OTP email sent to:', email);
      return { success: true };
    } catch (error) {
      console.error('SendGrid error:', error);
      if (error.response) {
        console.error(error.response.body);
      }
      throw error;
    }
  }

  /**
   * Send magic link email (alternative to OTP)
   */
  async sendMagicLinkEmail(email, magicLink, userName = '') {
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'hello@allie.family',
        name: 'Allie - Your Family Assistant'
      },
      subject: '✨ Your magic link to Allie is ready!',
      text: `Hey ${userName} Family! 👋\n\nClick this magical link to jump into Allie:\n${magicLink}\n\nThis link expires in 15 minutes (plenty of time for a coffee break! ☕)\n\nIf you didn't request this, just ignore this email.\n\nSee you inside!\n🤖 Allie`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f0f9ff; padding: 20px; text-align: center;">
            <h1 style="color: #1e40af; margin: 0;">Parentload</h1>
            <p style="color: #64748b; margin: 5px 0;">Your AI Family Assistant</p>
          </div>
          
          <div style="padding: 30px;">
            <p>Hi ${userName || 'there'},</p>
            
            <p>Click the button below to sign in to Parentload:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background-color: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Sign In to Parentload
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">Or copy and paste this link:<br>
            <a href="${magicLink}" style="color: #1e40af;">${magicLink}</a></p>
            
            <p style="color: #64748b; font-size: 14px;">This link will expire in 15 minutes.</p>
            
            <p>If you didn't request this, please ignore this email.</p>
            
            <p>Best,<br>Allie</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
            <p>© 2024 Parentload. All rights reserved.</p>
          </div>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('Magic link email sent to:', email);
      return { success: true };
    } catch (error) {
      console.error('SendGrid error:', error);
      if (error.response) {
        console.error(error.response.body);
      }
      throw error;
    }
  }

  /**
   * Send welcome email after signup
   */
  async sendWelcomeEmail(email, familyName, familyEmail) {
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'hello@allie.family',
        name: 'Allie - Your Family Assistant'
      },
      subject: 'Welcome to Parentload! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f0f9ff; padding: 20px; text-align: center;">
            <h1 style="color: #1e40af; margin: 0;">Welcome to Parentload!</h1>
          </div>
          
          <div style="padding: 30px;">
            <p>Hi ${familyName} Family,</p>
            
            <p>I'm Allie, your AI family assistant, and I'm thrilled to help your family find better balance!</p>
            
            <h2 style="color: #1e40af;">Your Family Email Address</h2>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>${familyEmail}</strong></p>
            </div>
            
            <p>Forward any schedules, flyers, or important emails to this address, and I'll automatically add events to your family calendar!</p>
            
            <h2 style="color: #1e40af;">Quick Start Tips:</h2>
            <ul>
              <li>📅 Forward school schedules to your family email</li>
              <li>📱 Text photos of flyers to your Allie SMS number</li>
              <li>💬 Ask me anything in the chat - I'm here to help!</li>
              <li>✅ Set up your family habits and routines</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://parentload.com/dashboard" style="background-color: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            
            <p>Looking forward to helping your family thrive!</p>
            
            <p>Best,<br>Allie</p>
          </div>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('Welcome email sent to:', email);
      return { success: true };
    } catch (error) {
      console.error('SendGrid error:', error);
      throw error;
    }
  }
}

module.exports = new SendGridEmailService();