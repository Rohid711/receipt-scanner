/**
 * Email templates for common application emails
 */

/**
 * Generate invoice email template
 * @param {object} invoice - The invoice object
 * @param {string} clientName - The client's name
 * @returns {object} - Contains text and html versions of the email
 */
const invoiceEmail = (invoice, clientName) => {
  const text = `
Hello ${clientName},

Your invoice #${invoice.invoiceNumber} has been generated for ${invoice.service}.

Invoice Details:
- Amount: $${invoice.amount.toFixed(2)}
- Date: ${new Date(invoice.date).toLocaleDateString()}
- Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}

Please log in to your account or contact us if you have any questions.

Thank you for your business!
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .invoice-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { font-size: 12px; text-align: center; margin-top: 30px; color: #777; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Invoice #${invoice.invoiceNumber}</h2>
  </div>
  <div class="content">
    <p>Hello ${clientName},</p>
    <p>Your invoice has been generated for <strong>${invoice.service}</strong>.</p>
    
    <div class="invoice-details">
      <p><strong>Amount:</strong> $${invoice.amount.toFixed(2)}</p>
      <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
      <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
    </div>
    
    <p>Please log in to your account or contact us if you have any questions.</p>
    <p>Thank you for your business!</p>
  </div>
  <div class="footer">
    <p>This is an automated email, please do not reply directly to this message.</p>
  </div>
</body>
</html>
`;

  return { text, html };
};

/**
 * Generate job confirmation email template
 * @param {string} jobId - The job ID
 * @param {string} clientName - The client's name
 * @param {string} service - The service name
 * @param {object} details - Additional job details
 * @param {string} details.date - Job date
 * @param {string} details.time - Job time
 * @param {string} details.address - Job location address
 * @param {string} details.notes - Additional notes
 * @returns {object} - Contains text and html versions of the email
 */
const jobConfirmationEmail = (jobId, clientName, service, details) => {
  const text = `
Hello ${clientName},

Your service appointment has been confirmed:

Service: ${service}
Date: ${new Date(details.date).toLocaleDateString()}
Time: ${details.time}
Location: ${details.address}
${details.notes ? `Notes: ${details.notes}` : ''}

If you need to reschedule or have any questions, please contact us.

Thank you for choosing our services!
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background-color: #f0f7ff; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .job-details { background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { font-size: 12px; text-align: center; margin-top: 30px; color: #777; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Service Appointment Confirmed</h2>
  </div>
  <div class="content">
    <p>Hello ${clientName},</p>
    <p>Your service appointment has been confirmed.</p>
    
    <div class="job-details">
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>Date:</strong> ${new Date(details.date).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${details.time}</p>
      <p><strong>Location:</strong> ${details.address}</p>
      ${details.notes ? `<p><strong>Notes:</strong> ${details.notes}</p>` : ''}
    </div>
    
    <p>If you need to reschedule or have any questions, please contact us.</p>
    <p>Thank you for choosing our services!</p>
  </div>
  <div class="footer">
    <p>This is an automated email, please do not reply directly to this message.</p>
  </div>
</body>
</html>
`;

  return { text, html };
};

module.exports = {
  invoiceEmail,
  jobConfirmationEmail
}; 