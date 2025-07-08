import React, { useState, useEffect, useRef } from 'react';
import { 
  FaCog, 
  FaBuilding, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaGlobe,
  FaPalette,
  FaBell,
  FaLock,
  FaSave,
  FaMobile,
  FaCalendarAlt,
  FaCheckCircle,
  FaSpinner,
  FaShieldAlt,
  FaHistory,
  FaTimes,
  FaMobileAlt,
  FaSun,
  FaMoon,
  FaDesktop,
  FaFont,
  FaCheck,
  FaUpload,
  FaImage
} from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Define types for notification settings
type NotificationSetting = {
  invoices: boolean;
  payments: boolean;
  appointments: boolean;
  reminders: boolean;
  marketing: boolean;
};

type NotificationSettings = {
  emailNotifications: NotificationSetting;
  pushNotifications: NotificationSetting;
  smsNotifications: NotificationSetting;
  frequency: 'immediately' | 'daily' | 'weekly';
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
};

// Profile data type
type ProfileData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  website: string;
  taxId: string;
  profileImage?: string;
  logo?: string; // Company logo for invoices
};

// Appearance settings
type AppearanceSettings = {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'teal';
  compactMode: boolean;
  animationsEnabled: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    website: '',
    taxId: '',
    profileImage: '',
    logo: ''
  });
  
  // App preferences state
  const [appPreferences, setAppPreferences] = useState({
    darkMode: false,
    emailNotifications: true,
    smsNotifications: false,
    defaultCurrency: 'USD',
    dateFormat: 'MM/DD/YYYY'
  });
  
  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    senderName: '',
    senderEmail: '',
    smtpHost: '',
    smtpPort: '',
    smtpUsername: '',
    smtpPassword: '',
    enableSSL: true
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: {
      invoices: true,
      payments: true,
      appointments: true,
      reminders: true,
      marketing: false
    },
    pushNotifications: {
      invoices: false,
      payments: true,
      appointments: true,
      reminders: true,
      marketing: false
    },
    smsNotifications: {
      invoices: false,
      payments: false,
      appointments: true,
      reminders: true,
      marketing: false
    },
    frequency: 'immediately',
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    }
  });
  
  // Security state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSessionsTable, setShowSessionsTable] = useState(false);
  
  // Mock active sessions data
  const activeSessions = [
    { id: 1, device: 'Chrome on Windows', location: 'New York, USA', lastActive: 'Just now', current: true },
    { id: 2, device: 'Safari on iPhone', location: 'Boston, USA', lastActive: '2 hours ago', current: false },
    { id: 3, device: 'Firefox on Mac', location: 'Toronto, Canada', lastActive: '3 days ago', current: false }
  ];
  
  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'system',
    fontSize: 'medium',
    colorScheme: 'blue',
    compactMode: false,
    animationsEnabled: true
  });

  // Color scheme options
  const colorSchemes = [
    { id: 'blue', name: 'Blue', bgClass: 'bg-blue-500' },
    { id: 'green', name: 'Green', bgClass: 'bg-green-500' },
    { id: 'purple', name: 'Purple', bgClass: 'bg-purple-500' },
    { id: 'orange', name: 'Orange', bgClass: 'bg-orange-500' },
    { id: 'teal', name: 'Teal', bgClass: 'bg-teal-500' }
  ];
  
  // File input ref
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load saved settings on component mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('appPreferences');
      if (savedPreferences) {
        setAppPreferences(JSON.parse(savedPreferences));
      }
      
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }

      const savedNotificationSettings = localStorage.getItem('notificationSettings');
      if (savedNotificationSettings) {
        setNotificationSettings(JSON.parse(savedNotificationSettings));
      }

      const savedAppearanceSettings = localStorage.getItem('appearanceSettings');
      if (savedAppearanceSettings) {
        setAppearanceSettings(JSON.parse(savedAppearanceSettings));
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
  }, []);
  
  // Handle profile input changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle app preferences changes
  const handleToggleChange = (setting: string) => {
    setAppPreferences(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAppPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle email settings form submission
  const handleEmailSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveMessage(null);
    
    try {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailSettings),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveMessage({
          type: 'success',
          text: 'Email settings saved successfully!'
        });
      } else {
        setSaveMessage({
          type: 'error',
          text: 'Failed to save email settings'
        });
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'An error occurred while saving email settings'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle notification settings
  const handleEmailNotificationChange = (setting: keyof NotificationSetting) => {
    setNotificationSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [setting]: !prev.emailNotifications[setting]
      }
    }));
  };

  const handlePushNotificationChange = (setting: keyof NotificationSetting) => {
    setNotificationSettings(prev => ({
      ...prev,
      pushNotifications: {
        ...prev.pushNotifications,
        [setting]: !prev.pushNotifications[setting]
      }
    }));
  };

  const handleSmsNotificationChange = (setting: keyof NotificationSetting) => {
    setNotificationSettings(prev => ({
      ...prev,
      smsNotifications: {
        ...prev.smsNotifications,
        [setting]: !prev.smsNotifications[setting]
      }
    }));
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNotificationSettings(prev => ({
      ...prev,
      frequency: e.target.value as 'immediately' | 'daily' | 'weekly'
    }));
  };

  const handleQuietHoursToggle = () => {
    setNotificationSettings(prev => ({
      ...prev,
      quiet_hours: {
        ...prev.quiet_hours,
        enabled: !prev.quiet_hours.enabled
      }
    }));
  };

  const handleQuietHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      quiet_hours: {
        ...prev.quiet_hours,
        [name]: value
      }
    }));
  };

  const handleNotificationSettingsSave = async () => {
    setIsSubmitting(true);
    setSaveMessage(null);

    try {
      // In a real app, you would send this to your API
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSaveMessage({
        type: 'success',
        text: 'Notification settings saved successfully!'
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to save notification settings'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setSaveMessage(null);
  };
  
  const tabs = [
    { id: 'email', label: 'Email Settings', icon: <FaEnvelope /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'profile', label: 'Profile', icon: <FaUser /> },
    { id: 'security', label: 'Security', icon: <FaLock /> },
    { id: 'appearance', label: 'Appearance', icon: <FaPalette /> },
  ];
  
  // Save profile
  const handleProfileSave = async () => {
    setIsSubmitting(true);
    setSaveMessage(null);
    
    try {
      console.log('Saving profile:', profile);
      
      // Save to localStorage for client-side persistence
      localStorage.setItem('profile', JSON.stringify(profile));
      
      // Save to server for server-side access (e.g. invoice generation)
      const response = await fetch('/api/save-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save profile to server');
      }
      
      console.log('Profile saved successfully:', result);
      
      setSaveMessage({
        type: 'success',
        text: 'Profile saved successfully!'
      });
      
      // Update userProfile in localStorage too to ensure consistency
      localStorage.setItem('userProfile', JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save profile'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle 2FA toggle
  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      setSaveMessage({
        type: 'error',
        text: 'New passwords do not match'
      });
      return;
    }
    
    if (passwords.new.length < 8) {
      setSaveMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long'
      });
      return;
    }
    
    setIsSubmitting(true);
    setSaveMessage(null);

    try {
      // In a real app, you would send this to your API
      // For now, we'll just simulate an API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSaveMessage({
        type: 'success',
        text: 'Password updated successfully!'
      });
      
      // Clear password fields
      setPasswords({
        current: '',
        new: '',
        confirm: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to update password'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle session termination
  const handleTerminateSession = (sessionId: number) => {
    // In a real app, you would send this to your API
    console.log(`Terminating session ${sessionId}`);
  };

  // Handle theme change
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setAppearanceSettings(prev => ({
      ...prev,
      theme
    }));
  };

  // Handle font size change
  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    setAppearanceSettings(prev => ({
      ...prev,
      fontSize
    }));
  };

  // Handle color scheme change
  const handleColorSchemeChange = (colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'teal') => {
    setAppearanceSettings(prev => ({
      ...prev,
      colorScheme
    }));
  };

  // Handle toggle changes for appearance
  const handleAppearanceToggle = (setting: 'compactMode' | 'animationsEnabled') => {
    setAppearanceSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Save appearance settings
  const handleAppearanceSave = async () => {
    setIsSubmitting(true);
    setSaveMessage(null);

    try {
      localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSaveMessage({
        type: 'success',
        text: 'Appearance settings saved successfully!'
      });
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to save appearance settings'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage({
        type: 'error',
        text: 'Logo image must be less than 2MB'
      });
      return;
    }
    
    // Check file type
    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
      setSaveMessage({
        type: 'error',
        text: 'Logo must be a JPG, PNG, or SVG file'
      });
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result) {
        setProfile(prev => ({
          ...prev,
          logo: result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your application preferences and configurations.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {/* Show save message if present */}
          {saveMessage && (
            <div className={`mb-6 p-4 rounded-md ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {saveMessage.type === 'success' ? <FaCheckCircle className="inline mr-2" /> : null}
              {saveMessage.text}
            </div>
          )}

          {/* Email Settings Tab */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailSettingsSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={emailSettings.senderName}
                    onChange={(e) => setEmailSettings({...emailSettings, senderName: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="Company Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sender Email
                  </label>
                  <input
                    type="email"
                    value={emailSettings.senderEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, senderEmail: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="noreply@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="smtp.company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    SMTP Port
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="587"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    SMTP Password
                  </label>
                  <input
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.enableSSL}
                  onChange={(e) => setEmailSettings({...emailSettings, enableSSL: e.target.checked})}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable SSL/TLS
                </label>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaEnvelope className="mr-2 text-primary-600" /> 
                    Email Notifications
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Configure which email notifications you want to receive</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Invoice Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications about new invoices</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notificationSettings.emailNotifications.invoices}
                        onChange={() => handleEmailNotificationChange('invoices')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 after:duration-300 ease-in-out"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Payment Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications about payments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notificationSettings.emailNotifications.payments}
                        onChange={() => handleEmailNotificationChange('payments')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 after:duration-300 ease-in-out"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Appointment Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications about appointments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notificationSettings.emailNotifications.appointments}
                        onChange={() => handleEmailNotificationChange('appointments')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 after:duration-300 ease-in-out"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Reminder Notifications</h3>
                      <p className="text-sm text-gray-500">Receive reminder notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notificationSettings.emailNotifications.reminders}
                        onChange={() => handleEmailNotificationChange('reminders')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 after:duration-300 ease-in-out"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Marketing Notifications</h3>
                      <p className="text-sm text-gray-500">Receive marketing and promotional emails</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notificationSettings.emailNotifications.marketing}
                        onChange={() => handleEmailNotificationChange('marketing')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 after:duration-300 ease-in-out"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaBell className="mr-2 text-primary-600" /> 
                    Push Notifications
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Configure which push notifications you want to receive</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Invoice Notifications</h3>
                      <p className="text-sm text-gray-500">Receive push notifications about new invoices</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notificationSettings.pushNotifications.invoices}
                        onChange={() => handlePushNotificationChange('invoices')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 after:duration-300 ease-in-out"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Payment Notifications</h3>
                      <p className="text-sm text-gray-500">Receive push notifications about payments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notificationSettings.pushNotifications.payments}
                        onChange={() => handlePushNotificationChange('payments')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 after:duration-300 ease-in-out"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Appointment Notifications</h3>
                      <p className="text-sm text-gray-500">Receive push notifications about appointments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notificationSettings.pushNotifications.appointments}
                        onChange={() => handlePushNotificationChange('appointments')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 after:duration-300 ease-in-out"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNotificationSettingsSave}
                  disabled={isSubmitting}
                  className="btn-primary flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaUser className="mr-2 text-primary-600" /> 
                    Personal Information
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Update your personal contact information</p>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profile.name}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaBuilding className="mr-2 text-primary-600" /> 
                    Business Information
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Update your business details</p>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={profile.company}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="Acme Inc."
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business Address</label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={profile.address}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="123 Business St, City, State, ZIP"
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={profile.website}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="https://www.example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tax ID / EIN</label>
                    <input
                      type="text"
                      id="taxId"
                      name="taxId"
                      value={profile.taxId}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="12-3456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Logo</label>
                    <p className="text-xs text-gray-500 mb-2">Upload your company logo for invoices (JPG, PNG or SVG, max 2MB)</p>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-24 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        {profile.logo ? (
                          <img 
                            src={profile.logo} 
                            alt="Company Logo" 
                            className="max-w-full max-h-full object-contain" 
                          />
                        ) : (
                          <FaImage className="text-gray-400 text-2xl" />
                        )}
                      </div>
                      
                      <div>
                        <input
                          type="file"
                          ref={logoInputRef}
                          onChange={handleLogoUpload}
                          accept="image/jpeg,image/png,image/svg+xml"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                          <FaUpload className="mr-2" />
                          {profile.logo ? 'Change Logo' : 'Upload Logo'}
                        </button>
                        
                        {profile.logo && (
                          <button
                            type="button"
                            onClick={() => setProfile(prev => ({ ...prev, logo: '' }))}
                            className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-gray-700 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600"
                          >
                            <FaTimes className="mr-2" />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={isSubmitting}
                  className="btn-primary flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaLock className="mr-2 text-primary-600" /> 
                    Password
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Update your password</p>
                </div>

                <div className="p-6">
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label htmlFor="current" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                      <input
                        type="password"
                        id="current"
                        name="current"
                        value={passwords.current}
                        onChange={handlePasswordChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="new" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                      <input
                        type="password"
                        id="new"
                        name="new"
                        value={passwords.new}
                        onChange={handlePasswordChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
                    </div>

                    <div>
                      <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirm"
                        name="confirm"
                        value={passwords.confirm}
                        onChange={handlePasswordChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
                            Updating...
                          </>
                        ) : (
                          <>
                            <FaSave className="mr-2" />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaShieldAlt className="mr-2 text-primary-600" /> 
                    Two-Factor Authentication
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Enable Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Require a verification code when you sign in</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={twoFactorEnabled}
                        onChange={handleTwoFactorToggle}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 after:duration-300 ease-in-out"></div>
                    </label>
                  </div>

                  {twoFactorEnabled && (
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Setup Instructions</h4>
                      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                        <li>Download an authenticator app like Google Authenticator or Authy</li>
                        <li>Scan the QR code below with your authenticator app</li>
                        <li>Enter the verification code from your app to complete setup</li>
                      </ol>
                      
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md flex flex-col items-center">
                        <div className="w-40 h-40 bg-gray-200 flex items-center justify-center mb-3">
                          <span className="text-gray-500 text-xs">QR Code Placeholder</span>
                        </div>
                        
                        <div className="mt-3 w-full">
                          <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                          <div className="flex">
                            <input
                              type="text"
                              id="verificationCode"
                              className="block w-full rounded-l-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white sm:text-sm"
                              placeholder="Enter 6-digit code"
                            />
                            <button
                              type="button"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                              Verify
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold flex items-center">
                        <FaHistory className="mr-2 text-primary-600" /> 
                        Active Sessions
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">Manage your active sessions across devices</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSessionsTable(!showSessionsTable)}
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      {showSessionsTable ? 'Hide' : 'Show'} Sessions
                    </button>
                  </div>
                </div>

                {showSessionsTable && (
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {activeSessions.map(session => (
                            <tr key={session.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {session.device}
                                {session.current && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Current</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.location}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.lastActive}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {!session.current && (
                                  <button
                                    onClick={() => handleTerminateSession(session.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Terminate
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaPalette className="mr-2 text-primary-600" /> 
                    Theme
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Choose your preferred theme</p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div 
                      onClick={() => handleThemeChange('light')}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        appearanceSettings.theme === 'light' 
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' 
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <FaSun className="text-yellow-500 mr-2" />
                          <h3 className="font-medium">Light Mode</h3>
                        </div>
                        {appearanceSettings.theme === 'light' && <FaCheck className="text-primary-600" />}
                      </div>
                      <div className="h-16 bg-gray-100 rounded-md border border-gray-300"></div>
                    </div>
                    
                    <div 
                      onClick={() => handleThemeChange('dark')}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        appearanceSettings.theme === 'dark' 
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' 
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <FaMoon className="text-indigo-500 mr-2" />
                          <h3 className="font-medium">Dark Mode</h3>
                        </div>
                        {appearanceSettings.theme === 'dark' && <FaCheck className="text-primary-600" />}
                      </div>
                      <div className="h-16 bg-gray-800 rounded-md border border-gray-700"></div>
                    </div>
                    
                    <div 
                      onClick={() => handleThemeChange('system')}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        appearanceSettings.theme === 'system' 
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' 
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <FaDesktop className="text-gray-500 mr-2" />
                          <h3 className="font-medium">System Default</h3>
                        </div>
                        {appearanceSettings.theme === 'system' && <FaCheck className="text-primary-600" />}
                      </div>
                      <div className="h-16 bg-gradient-to-r from-gray-100 to-gray-800 rounded-md border border-gray-300"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaFont className="mr-2 text-primary-600" /> 
                    Text Size
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Adjust the size of text throughout the application</p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div 
                      onClick={() => handleFontSizeChange('small')}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        appearanceSettings.fontSize === 'small' 
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' 
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-sm">Small</h3>
                        {appearanceSettings.fontSize === 'small' && <FaCheck className="text-primary-600" />}
                      </div>
                      <p className="text-xs text-gray-600">Compact text size for more content</p>
                    </div>
                    
                    <div 
                      onClick={() => handleFontSizeChange('medium')}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        appearanceSettings.fontSize === 'medium' 
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' 
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Medium</h3>
                        {appearanceSettings.fontSize === 'medium' && <FaCheck className="text-primary-600" />}
                      </div>
                      <p className="text-sm text-gray-600">Default text size</p>
                    </div>
                    
                    <div 
                      onClick={() => handleFontSizeChange('large')}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        appearanceSettings.fontSize === 'large' 
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' 
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-lg">Large</h3>
                        {appearanceSettings.fontSize === 'large' && <FaCheck className="text-primary-600" />}
                      </div>
                      <p className="text-base text-gray-600">Larger text for better readability</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaPalette className="mr-2 text-primary-600" /> 
                    Color Scheme
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Choose your preferred accent color</p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    {colorSchemes.map(scheme => (
                      <div
                        key={scheme.id}
                        onClick={() => handleColorSchemeChange(scheme.id as any)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          appearanceSettings.colorScheme === scheme.id 
                            ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' 
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full mb-2 ${scheme.bgClass}`}></div>
                          <span className="text-sm font-medium">{scheme.name}</span>
                          {appearanceSettings.colorScheme === scheme.id && (
                            <FaCheck className="text-primary-600 mt-2" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Additional Options</h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Compact Mode</h3>
                      <p className="text-sm text-gray-500">Reduce spacing to fit more content on screen</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={appearanceSettings.compactMode}
                        onChange={() => handleAppearanceToggle('compactMode')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 after:duration-300 ease-in-out"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Enable Animations</h3>
                      <p className="text-sm text-gray-500">Show animations and transitions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={appearanceSettings.animationsEnabled}
                        onChange={() => handleAppearanceToggle('animationsEnabled')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 after:duration-300 ease-in-out"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAppearanceSave}
                  disabled={isSubmitting}
                  className="btn-primary flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 