const nodemailer = require('nodemailer');

// Log the SMTP configuration (without password)
console.log(`SMTP Config: ${process.env.BREVO_SMTP_HOST}:${process.env.BREVO_SMTP_PORT}, User: ${process.env.BREVO_SMTP_USER}`);

// Create transporter with Brevo SMTP credentials
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASSWORD
    },
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  });
};

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>} - Whether the connection is valid
 */
const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    const result = await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection verification failed:', error);
    if (error.message.includes('Invalid login')) {
      console.error('Authentication failed - please check your SMTP username and password');
    } else if (error.message.includes('connect')) {
      console.error('Connection failed - please check your SMTP host and port');
    }
    return false;
  }
};

/**
 * Send email using Brevo SMTP
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text email content (can be null if html is provided)
 * @param {string} html - HTML email content (can be null if text is provided)
 * @returns {Promise<object>} - Nodemailer response
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    // Validate that at least one of text or html is provided
    if (!text && !html) {
      throw new Error('Either text or html content must be provided');
    }

    // Verify connection first
    const isConnValid = await verifyConnection();
    if (!isConnValid) {
      throw new Error('Email server connection failed. Please check your SMTP credentials.');
    }

    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: process.env.BREVO_SENDER_EMAIL || 'noreply@yourcompany.com',
      to,
      subject
    };

    // Add text content if provided
    if (text) {
      mailOptions.text = text;
    }

    // Add HTML content if provided
    if (html) {
      mailOptions.html = html;
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Provide more specific error messages
    if (error.message.includes('Invalid login') || error.message.includes('535 5.7.8')) {
      throw new Error('Email authentication failed. Please check your SMTP username and password.');
    } else if (error.message.includes('No recipients defined')) {
      throw new Error('Invalid recipient email address.');
    } else {
      throw error;
    }
  }
};

module.exports = { 
  sendEmail,
  verifyConnection
}; 