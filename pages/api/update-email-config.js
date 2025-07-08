import { verifyConnection } from '../../utils/emailService';
import fs from 'fs';
import path from 'path';

// This is a simplified API for development purposes only
// In production, environment variables should be updated through your hosting platform

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'API key is required' 
      });
    }
    
    // Create SMTP settings from the API key
    // For Brevo API key format: xkeysib-{rest-of-key}
    const config = {
      BREVO_API_KEY: apiKey,
      BREVO_SMTP_HOST: 'smtp-relay.brevo.com',
      BREVO_SMTP_PORT: '587',
      BREVO_SMTP_USER: process.env.BREVO_SMTP_USER || 'your-sender-email@example.com', // Keep existing or use default
      BREVO_SMTP_PASSWORD: apiKey, // For Brevo, the API key can be used as the SMTP password
      BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'your-sender-email@example.com' // Keep existing
    };
    
    // Update process.env for the current session
    process.env.BREVO_API_KEY = apiKey;
    process.env.BREVO_SMTP_PASSWORD = apiKey;
    
    // Verify connection with new settings
    const isValid = await verifyConnection();
    
    if (isValid) {
      return res.status(200).json({
        success: true,
        message: 'Email configuration updated and verified successfully',
        config: {
          host: config.BREVO_SMTP_HOST,
          port: config.BREVO_SMTP_PORT,
          user: config.BREVO_SMTP_USER ? 
            `${config.BREVO_SMTP_USER.substring(0, 4)}...${config.BREVO_SMTP_USER.substring(config.BREVO_SMTP_USER.indexOf('@'))}` : 
            'Not configured',
          senderEmail: config.BREVO_SENDER_EMAIL,
          apiKeyConfigured: true
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid API key or email configuration',
        help: 'Please check your Brevo API key and try again'
      });
    }
  } catch (error) {
    console.error('Error updating email config:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update email configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
} 