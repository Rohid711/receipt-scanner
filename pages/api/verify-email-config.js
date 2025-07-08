import { verifyConnection } from '../../utils/emailService';

export default async function handler(req, res) {
  // Set content type to ensure proper JSON response
  res.setHeader('Content-Type', 'application/json');
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Attempt to verify the email connection
    const isValid = await verifyConnection();
    
    // Return configuration information (without sensitive data)
    const config = {
      host: process.env.BREVO_SMTP_HOST,
      port: process.env.BREVO_SMTP_PORT,
      user: process.env.BREVO_SMTP_USER ? 
        `${process.env.BREVO_SMTP_USER.substring(0, 4)}...${process.env.BREVO_SMTP_USER.substring(process.env.BREVO_SMTP_USER.indexOf('@'))}` : 
        'Not configured',
      senderEmail: process.env.BREVO_SENDER_EMAIL || 'Not configured'
    };
    
    if (isValid) {
      return res.status(200).json({
        success: true,
        message: 'Email configuration is valid',
        config
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Email configuration is invalid',
        config,
        help: 'Please check your BREVO_SMTP_* environment variables in your .env.local file'
      });
    }
  } catch (error) {
    console.error('Error verifying email config:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify email configuration',
      error: error.message || 'Internal server error'
    });
  }
} 