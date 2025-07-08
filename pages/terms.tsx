import React from 'react';
import PublicLayout from '../components/PublicLayout';

export default function Terms() {
  return (
    <PublicLayout>
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Terms of Service</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        <p className="mb-4">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Welcome to Bizznex. These Terms of Service ("Terms") govern your use of our website, services, and applications 
          (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms. 
          If you do not agree to these Terms, please do not use our Services.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">2. Definitions</h2>
        <p>
          <strong>"Bizznex"</strong> refers to our company, our website, and all services provided by us.<br />
          <strong>"User"</strong> refers to individuals who use our Services, including registered account holders.<br />
          <strong>"Content"</strong> refers to any information, text, graphics, photos, or other materials uploaded, downloaded, or appearing on our Services.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">3. Account Registration</h2>
        <p>
          To access certain features of our Services, you may be required to register for an account. 
          When you register, you agree to provide accurate, current, and complete information about yourself. 
          You are responsible for safeguarding your account password and for all activities that occur under your account.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">4. Use of Services</h2>
        <p>
          You agree to use our Services only for lawful purposes and in accordance with these Terms. 
          You agree not to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Use our Services in any way that violates any applicable law or regulation</li>
          <li>Attempt to interfere with or disrupt our Services or servers</li>
          <li>Attempt to gain unauthorized access to any part of our Services</li>
          <li>Use our Services to transmit any harmful code or malware</li>
          <li>Engage in any activity that could harm or negatively affect other users</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
        <p>
          Our Services and their original content, features, and functionality are owned by Bizznex and are protected by 
          international copyright, trademark, patent, trade secret, and other intellectual property laws.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">6. User Content</h2>
        <p>
          You retain ownership of any content you submit to our Services. By submitting content, you grant us a worldwide, 
          non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute your content 
          in any existing or future media.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">7. Termination</h2>
        <p>
          We may terminate or suspend your account and access to our Services immediately, without prior notice or liability, 
          for any reason, including if you breach these Terms.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
        <p>
          In no event shall Bizznex, its directors, employees, partners, agents, suppliers, or affiliates be liable for any 
          indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, 
          use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Services.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
        <p>
          We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 
          30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at <a href="mailto:legal@bizznex.com" className="text-primary dark:text-primary-light">legal@bizznex.com</a>.
        </p>
      </div>
    </PublicLayout>
  );
} 