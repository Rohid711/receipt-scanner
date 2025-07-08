import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaKey, FaServer, FaUserAlt, FaPlug, FaCheck, FaTimes, FaSave, FaSpinner, FaExchangeAlt } from 'react-icons/fa';

export default function EmailSettings() {
  const [config, setConfig] = useState({
    host: '',
    port: '',
    user: '',
    password: '',
    senderEmail: '',
    apiKey: ''
  });
  
  const [testEmail, setTestEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{success?: boolean; message?: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success?: boolean; message?: string} | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  // Fetch current configuration
  useEffect(() => {
    fetchConfig();
  }, []);
  
  async function fetchConfig() {
    try {
      setIsVerifying(true);
      const response = await fetch('/api/verify-email-config');
      const data = await response.json();
      
      if (data.config) {
        setConfig(prevConfig => ({
          ...prevConfig,
          host: data.config.host || '',
          port: data.config.port || '',
          user: data.config.user || '',
          senderEmail: data.config.senderEmail || ''
        }));
      }
      
      setVerifyResult({
        success: data.success,
        message: data.message
      });
    } catch (error) {
      setVerifyResult({
        success: false,
        message: 'Failed to load configuration'
      });
    } finally {
      setIsVerifying(false);
    }
  }
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle test email recipient change
  const handleTestEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestEmail(e.target.value);
  };
  
  // Save configuration to server
  const handleSave = async () => {
    setIsSaving(true);
    setVerifyResult(null);
    
    try {
      if (config.apiKey) {
        // Use the API key to update configuration
        const response = await fetch('/api/update-email-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: config.apiKey
          }),
        });
        
        const data = await response.json();
        
        setVerifyResult({
          success: data.success,
          message: data.message
        });
        
        if (data.success) {
          // Update config with new values
          if (data.config) {
            setConfig(prevConfig => ({
              ...prevConfig,
              host: data.config.host || prevConfig.host,
              port: data.config.port || prevConfig.port,
              user: data.config.user || prevConfig.user,
              senderEmail: data.config.senderEmail || prevConfig.senderEmail,
              password: '' // Clear password for security
            }));
          }
        }
      } else {
        alert('Please enter your Brevo API key.');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setVerifyResult({
        success: false,
        message: 'Failed to update configuration'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Test email sending
  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testEmail,
          subject: 'Test Email from Bizznex',
          message: `
            <h1>Test Email</h1>
            <p>This is a test email from your Bizznex application.</p>
            <p>If you received this email, your email configuration is working correctly.</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          `,
          isHtml: true
        }),
      });
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Server responded with an error');
      }
      
      setTestResult({
        success: data.success,
        message: data.success ? 'Test email sent successfully!' : (data.message || 'Failed to send test email')
      });
    } catch (error) {
      console.error('Test email error:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  // Test just the email connection without sending an email
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setVerifyResult(null);
    
    try {
      const response = await fetch('/api/test-email-connection');
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${await response.text().catch(() => 'Could not read response')}`);
      }
      
      const data = await response.json();
      
      setVerifyResult({
        success: data.success,
        message: data.message || (data.success ? 'Connection successful' : 'Connection failed')
      });
    } catch (error) {
      console.error('Connection test error:', error);
      setVerifyResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Email Server Settings</h1>
      
      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold flex items-center">
            <FaPlug className="mr-2" /> 
            Connection Status
          </h2>
          <button
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm flex items-center"
          >
            {isTestingConnection ? <FaSpinner className="animate-spin mr-1" /> : <FaExchangeAlt className="mr-1" />}
            Test Connection
          </button>
        </div>
        
        {isVerifying || isTestingConnection ? (
          <div className="flex items-center text-gray-500">
            <FaSpinner className="animate-spin mr-2" />
            {isVerifying ? 'Verifying connection...' : 'Testing connection...'}
          </div>
        ) : verifyResult ? (
          <div className={`p-4 border rounded-md ${verifyResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <div className="flex items-center">
              {verifyResult.success ? (
                <FaCheck className="text-green-500 mr-2" />
              ) : (
                <FaTimes className="text-red-500 mr-2" />
              )}
              <span className={verifyResult.success ? 'text-green-700' : 'text-red-700'}>
                {verifyResult.message}
              </span>
            </div>
          </div>
        ) : null}
      </div>
      
      {/* API Key Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Brevo API Key</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your Brevo API key to configure email settings
          </p>
        </div>
        
        <div className="p-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaKey className="text-gray-400" />
              </div>
              <input
                type="text"
                id="apiKey"
                name="apiKey"
                value={config.apiKey}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="xkeysib-..."
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              You can find your API key in your Brevo account under SMTP & API section.
            </p>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center justify-center"
            >
              {isSaving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
              Apply API Key
            </button>
          </div>
        </div>
      </div>
      
      {/* SMTP Configuration Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">SMTP Server Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">
            Current email server settings
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Host
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaServer className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="host"
                  name="host"
                  value={config.host}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Port
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaServer className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="port"
                  name="port"
                  value={config.port}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUserAlt className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="user"
                  name="user"
                  value={config.user}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="senderEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Sender Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="senderEmail"
                  name="senderEmail"
                  value={config.senderEmail}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Test Email Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Test Email Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">
            Send a test email to verify your configuration
          </p>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                id="testEmail"
                value={testEmail}
                onChange={handleTestEmailChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="your@email.com"
              />
            </div>
          </div>
          
          <button
            onClick={handleTestEmail}
            disabled={isTesting}
            className="btn-primary flex items-center justify-center"
          >
            {isTesting ? <FaSpinner className="animate-spin mr-2" /> : <FaEnvelope className="mr-2" />}
            Send Test Email
          </button>
          
          {testResult && (
            <div className={`mt-4 p-4 border rounded-md ${testResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <div className="flex items-center">
                {testResult.success ? (
                  <FaCheck className="text-green-500 mr-2" />
                ) : (
                  <FaTimes className="text-red-500 mr-2" />
                )}
                <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                  {testResult.message}
                </span>
              </div>
            </div>
          )}
          
          {!verifyResult?.success && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
              <p className="text-sm text-yellow-700">
                <strong>Tip:</strong> If you're having trouble with email authentication, try applying your Brevo API key at the top of this page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 