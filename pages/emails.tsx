import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaSpinner, FaEnvelope, FaHistory, FaFileAlt, FaCalendarAlt, FaTrash } from 'react-icons/fa';

// Email types for templates
type EmailType = 'custom' | 'invoice' | 'job_confirmation' | 'quote';

interface EmailHistory {
  id: string;
  to: string;
  subject: string;
  type: EmailType;
  sentAt: string;
  status: 'success' | 'sent' | 'failed';
  error?: string;
}

export default function EmailsPage() {
  // Email form state
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [emailType, setEmailType] = useState<EmailType>('custom');
  const [message, setMessage] = useState('');
  const [isHtml, setIsHtml] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Email history
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [deletingEmailId, setDeletingEmailId] = useState<string | null>(null);
  
  // Load email history
  useEffect(() => {
    loadEmailHistory();
  }, []);
  
  async function loadEmailHistory() {
    setHistoryLoading(true);
    try {
      // Fetch email history from the API
      const response = await fetch('/api/emails');
      if (!response.ok) {
        throw new Error('Failed to load email history');
      }
      const history = await response.json();
      setEmailHistory(history || []);
    } catch (err) {
      console.error('Error loading email history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }
  
  // Handle template selection
  const handleTemplateChange = (type: EmailType) => {
    setEmailType(type);
    
    // Set default subject based on template
    switch (type) {
      case 'invoice':
        setSubject('Your Invoice');
        setMessage(`Dear customer,

Thank you for choosing our services. Please find attached your invoice.

Please let us know if you have any questions.

Best regards,
Bizznex`);
        break;
      case 'job_confirmation':
        setSubject('Job Confirmation');
        setMessage(`Dear customer,

We're writing to confirm your upcoming service appointment.

Our team will arrive at the scheduled time to complete the work.

Best regards,
Bizznex`);
        break;
      case 'quote':
        setSubject('Quote for Services');
        setMessage(`Dear customer,

Thank you for your interest in our services. We're pleased to provide you with a quote.

Please review the details and let us know if you have any questions.

Best regards,
Bizznex`);
        break;
      default:
        // Reset for custom emails
        setSubject('');
        setMessage('');
    }
  };
  
  // Handle email submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!to || !subject || !message) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Send the email
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          message,
          emailType,
          isHtml
        }),
      });
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${await response.text().catch(() => 'Could not read response')}`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send email');
      }
      
      setSuccess('Email sent successfully!');
      
      // Clear form
      setTo('');
      setSubject('');
      setMessage('');
      
      // Save successful email to history
      const successEmail: EmailHistory = {
        id: Date.now().toString(),
        to,
        subject,
        type: emailType,
        sentAt: new Date().toISOString(),
        status: 'success'
      };
      
      // Save to database via API
      try {
        await fetch('/api/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(successEmail),
        });
      } catch (saveError) {
        console.error('Error saving email history:', saveError);
        // Continue even if history saving fails
      }
      
      // Update local state
      setEmailHistory([successEmail, ...emailHistory]);
      
    } catch (err) {
      console.error('Error sending email:', err);
      setError(`Failed to send email: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Save failed email to history
      const failedEmail: EmailHistory = {
        id: Date.now().toString(),
        to,
        subject,
        type: emailType,
        sentAt: new Date().toISOString(),
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error'
      };
      
      // Save to database via API
      try {
        await fetch('/api/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(failedEmail),
        });
      } catch (saveError) {
        console.error('Error saving email history:', saveError);
        // Continue even if history saving fails
      }
      
      // Update local state
      setEmailHistory([failedEmail, ...emailHistory]);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete email from history
  const handleDeleteEmail = async (id: string) => {
    if (deletingEmailId) return; // Prevent multiple deletes at once
    
    setDeletingEmailId(id);
    try {
      const response = await fetch(`/api/emails?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete email');
      }
      
      // Remove from local state
      setEmailHistory(prev => prev.filter(email => email.id !== id));
    } catch (err) {
      console.error('Error deleting email:', err);
    } finally {
      setDeletingEmailId(null);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Email Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Send Email</h2>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaEnvelope className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaEnvelope className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Template
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('custom')}
                    className={`px-4 py-2 rounded-full text-sm ${
                      emailType === 'custom'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Custom Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('invoice')}
                    className={`px-4 py-2 rounded-full text-sm ${
                      emailType === 'invoice'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <FaFileAlt className="inline mr-1" /> Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('job_confirmation')}
                    className={`px-4 py-2 rounded-full text-sm ${
                      emailType === 'job_confirmation'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <FaCalendarAlt className="inline mr-1" /> Job Confirmation
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('quote')}
                    className={`px-4 py-2 rounded-full text-sm ${
                      emailType === 'quote'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Quote
                  </button>
                </div>
              </div>
              
              {/* To Email */}
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-2">
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="input"
                  placeholder="client@example.com"
                  required
                />
              </div>
              
              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input"
                  placeholder="Email subject"
                  required
                />
              </div>
              
              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <div className="mb-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={isHtml}
                      onChange={() => setIsHtml(!isHtml)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Send as HTML</span>
                  </label>
                </div>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="input"
                  placeholder={isHtml ? "<p>Your HTML message here</p>" : "Your plain text message here"}
                  required
                />
              </div>
              
              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex justify-center"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Email History */}
        <div>
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaHistory className="mr-2" />
              Recent Emails
            </h2>
            
            {historyLoading ? (
              <div className="flex justify-center my-6">
                <FaSpinner className="animate-spin text-gray-500 text-xl" />
              </div>
            ) : emailHistory.length === 0 ? (
              <p className="text-gray-500 text-center my-6">No emails sent yet</p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {emailHistory.map((email) => (
                  <div 
                    key={email.id}
                    className={`border-l-4 p-3 text-sm ${
                      email.status === 'success' || email.status === 'sent' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="font-medium">{email.subject}</div>
                    <div className="text-gray-600">To: {email.to}</div>
                    <div className="text-gray-500 text-xs mt-1">
                      {new Date(email.sentAt).toLocaleString()}
                    </div>
                    {email.status === 'failed' && email.error && (
                      <div className="text-red-600 text-xs mt-1">{email.error}</div>
                    )}
                    {(email.status === 'success' || email.status === 'sent') && (
                      <div className="text-green-600 text-xs mt-1">Email sent successfully</div>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{email.type}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEmail(email.id)}
                        disabled={deletingEmailId === email.id}
                        className="text-xs flex items-center text-red-500 hover:text-red-700 transition-colors"
                      >
                        {deletingEmailId === email.id ? (
                          <FaSpinner className="animate-spin mr-1" />
                        ) : (
                          <FaTrash className="mr-1" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 