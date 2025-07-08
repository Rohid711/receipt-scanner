import { sendEmail } from '../../utils/emailService';

export default async function handler(req, res) {
  // Set CORS headers to ensure proper JSON response
  res.setHeader('Content-Type', 'application/json');

  // Only allow POST requests for email sending
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    const { to, subject, message, isHtml = false, emailType } = req.body;
    
    // Validate required email fields
    if (!to || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields. Please provide to, subject, and message body'
      });
    }
    
    // Debug logging
    console.log(`Attempting to send email to ${to} with subject "${subject}"`);
    console.log(`Using SMTP: ${process.env.BREVO_SMTP_HOST}:${process.env.BREVO_SMTP_PORT}, User: ${process.env.BREVO_SMTP_USER}`);
    
    // Determine if we should send as HTML based on isHtml flag or emailType
    const useHtml = isHtml || emailType !== 'custom';
    
    // Send the email using appropriate format (text or html)
    if (useHtml) {
      await sendEmail(to, subject, null, message);
    } else {
      await sendEmail(to, subject, message, null);
    }
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('API Error: Failed to send email:', error);
    
    // Return error response with proper JSON formatting
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send email',
      error: error.message || 'Unknown error occurred'
    });
  }
} 