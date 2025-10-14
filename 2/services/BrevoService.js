// src/services/BrevoService.js

/**
 * Service for Brevo integration to send transactional emails and SMS
 * Note: This is a client-side service that delegates actual API calls to the backend
 */
class BrevoService {
  constructor() {
    // Constants for sender info
    this.DEFAULT_SENDER = { 
      name: 'Allie',  
      email: 'noreply@mail.checkallie.com' 
    };
    
    // Base API URL - this should point to your backend API
    this.API_BASE_URL = '/api/brevo';
  }
  
  /**
   * Send a transactional email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @param {string} [options.text] - Email plain text content
   * @param {Object} [options.sender] - Sender information { name, email }
   * @param {Object} [options.params] - Template parameters
   * @param {number} [options.templateId] - Brevo template ID
   * @returns {Promise<Object>} Result of the send operation
   */
  async sendEmail(options) {
    try {
      const { to, subject, html, text, sender, params, templateId, forceSend } = options;
      
      // Validate required fields
      if (!to) {
        throw new Error('Recipient email is required');
      }
      
      // Handle development vs production environment
      if (process.env.NODE_ENV === 'development' && !forceSend) {
        console.log('DEV MODE: Email would be sent:', { 
          to, 
          subject: subject || 'No subject',
          templateId: templateId || 'none',
          params: params || {}
        });
        return { messageId: 'dev-mode-message-id' };
      }
      
      // If in development but force send is true
      if (process.env.NODE_ENV === 'development' && forceSend) {
        console.log('DEV MODE WITH FORCE SEND: Actually sending email to:', to);
      }
      
      // Send API request to the backend
      const response = await fetch(`${this.API_BASE_URL}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          subject,
          html,
          text,
          sender: sender || this.DEFAULT_SENDER,
          params: params || {},
          templateId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending email via Brevo:', error);
      throw error;
    }
  }
  
  /**
   * Send a transactional SMS
   * @param {Object} options - SMS options
   * @param {string} options.to - Recipient phone number (E.164 format, e.g., +15551234567)
   * @param {string} options.content - SMS content
   * @param {string} [options.sender] - SMS sender name
   * @returns {Promise<Object>} Result of the send operation
   */
  async sendSms(options) {
    try {
      const { to, content, sender } = options;
      
      // Validate required fields
      if (!to || !content) {
        throw new Error('Recipient phone number and content are required');
      }
      
      // Handle development vs production environment
      if (process.env.NODE_ENV === 'development' && !options.forceSend) {
        console.log('DEV MODE: SMS would be sent:', { 
          to, 
          content, 
          sender: sender || 'Allie' 
        });
        return { messageId: 'dev-mode-sms-id' };
      }
      
      // Send API request to the backend
      const response = await fetch(`${this.API_BASE_URL}/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          content,
          sender: sender || 'Allie'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('SMS sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending SMS via Brevo:', error);
      throw error;
    }
  }
  
  /**
   * Send a password reset email
   * @param {string} to - Recipient email
   * @param {string} resetLink - Password reset link
   * @param {string} [firstName] - User's first name
   * @param {boolean} [forceSend=false] - Force sending even in development mode
   * @returns {Promise<Object>} Result of the send operation
   */
  async sendPasswordResetEmail(to, resetLink, firstName = '', forceSend = false) {
    try {
      // Template parameters for personalization
      const params = {
        firstName: firstName || 'there',
        resetLink,
        currentYear: new Date().getFullYear()
      };
      
      // If we have a template ID in Brevo, use that
      const templateId = process.env.REACT_APP_BREVO_PASSWORD_RESET_TEMPLATE_ID;
      
      // In development mode, but we don't want to force send
      if (process.env.NODE_ENV === 'development' && !forceSend) {
        console.log('DEV MODE: Would send password reset email with:', {
          to,
          templateId: templateId || 'none (using fallback template)',
          params
        });
        return { messageId: 'dev-mode-password-reset-id' };
      }
      
      // If we have a template and we're either in production or forcing send
      if (templateId) {
        return this.sendEmail({
          to,
          templateId: parseInt(templateId),
          params,
          forceSend: true // Always force send for this specific call
        });
      }
      
      // Otherwise, use a fallback template
      const subject = 'Reset Your Allie Password';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { max-width: 150px; }
            .button { display: inline-block; background-color: #4dabf7; color: white; 
                      text-decoration: none; padding: 10px 20px; border-radius: 5px; 
                      margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://checkallie.com/logo.png" alt="Allie Logo" class="logo">
            </div>
            <h2>Hello ${params.firstName}!</h2>
            <p>We received a request to reset your password for your Allie account.</p>
            <p>To reset your password, please click the button below:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <div class="footer">
              <p>&copy; ${params.currentYear} Allie Technologies Inc. All rights reserved.</p>
              <p>If you have any questions, contact our support team at support@checkallie.com</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Send email with our custom template
      return this.sendEmail({
        to,
        subject,
        html,
        forceSend: true // Always force send for password reset emails
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
  
  /**
   * Send a welcome email to a new user
   * @param {string} to - Recipient email
   * @param {string} firstName - User's first name
   * @returns {Promise<Object>} Result of the send operation
   */
  async sendWelcomeEmail(to, firstName) {
    try {
      // Template parameters
      const params = {
        firstName: firstName || 'there',
        currentYear: new Date().getFullYear()
      };
      
      // If we have a template ID in Brevo, use that
      const templateId = process.env.REACT_APP_BREVO_WELCOME_TEMPLATE_ID;
      if (templateId) {
        return this.sendEmail({
          to,
          templateId: parseInt(templateId),
          params
        });
      }
      
      // Otherwise, use a fallback template
      const subject = 'Welcome to Allie!';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { max-width: 150px; }
            .button { display: inline-block; background-color: #4dabf7; color: white; 
                      text-decoration: none; padding: 10px 20px; border-radius: 5px; 
                      margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://checkallie.com/logo.png" alt="Allie Logo" class="logo">
            </div>
            <h2>Welcome to Allie, ${params.firstName}!</h2>
            <p>Thank you for joining Allie. We're excited to help you balance your family responsibilities and create more harmony at home.</p>
            <p>To get started, log in to your account and complete your family profile:</p>
            <p style="text-align: center;">
              <a href="https://checkallie.com/dashboard" class="button">Go to Your Dashboard</a>
            </p>
            <p>If you have any questions, our support team is here to help.</p>
            <div class="footer">
              <p>&copy; ${params.currentYear} Allie Technologies Inc. All rights reserved.</p>
              <p>If you have any questions, contact our support team at support@checkallie.com</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      return this.sendEmail({
        to,
        subject,
        html
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }
}

// Export as singleton
export default new BrevoService();