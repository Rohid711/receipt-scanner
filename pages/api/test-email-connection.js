import { verifyConnection } from '../../utils/emailService';

export default async function handler(req, res) {
  // Set content type to ensure proper JSON response
  res.setHeader('Content-Type', 'application/json');
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Log current configuration for debugging
    console.log(`Testing email connection with: ${process.env.BREVO_SMTP_HOST}:${process.env.BREVO_SMTP_PORT}, User: ${process.env.BREVO_SMTP_USER}`);
    
    // Verify the connection
    const isValid = await verifyConnection();
    
    if (isValid) {
      return res.status(200).json({
        success: true,
        message: 'Email server connection successful'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Email server connection failed'
      });
    }
  } catch (error) {
    console.error('Error testing email connection:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error testing email connection',
      error: error.message || 'Unknown error'
    });
  }
} 