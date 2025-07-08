import React from 'react';
import PublicLayout from '../components/PublicLayout';

export default function Privacy() {
  return (
    <PublicLayout>
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Privacy Policy</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        <p className="mb-4">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          At Bizznex, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, 
          disclose, and safeguard your information when you use our website, services, and applications (collectively, the "Services").
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
        <p>
          We may collect several types of information from and about users of our Services, including:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Personal Information:</strong> Name, email address, postal address, phone number, and other identifiers by which you may be contacted online or offline.</li>
          <li><strong>Account Information:</strong> Login credentials, account preferences, and settings.</li>
          <li><strong>Transaction Information:</strong> Details about payments to and from you, and other details of services you have purchased from us.</li>
          <li><strong>Usage Information:</strong> Information about how you use our Services, including browsing actions and patterns.</li>
          <li><strong>Technical Information:</strong> Internet protocol (IP) address, browser type and version, time zone setting, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access our Services.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">3. How We Collect Your Information</h2>
        <p>
          We collect information through:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Direct interactions when you create an account, subscribe to our services, or contact us.</li>
          <li>Automated technologies or interactions, such as cookies and similar tracking technologies.</li>
          <li>Third parties or publicly available sources, such as analytics providers and search engines.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">4. How We Use Your Information</h2>
        <p>
          We may use the information we collect about you for various purposes, including to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide, maintain, and improve our Services.</li>
          <li>Process transactions and send related information.</li>
          <li>Send administrative information, such as updates, security alerts, and support messages.</li>
          <li>Respond to your comments, questions, and requests.</li>
          <li>Personalize your experience and deliver content relevant to your interests.</li>
          <li>Monitor and analyze trends, usage, and activities in connection with our Services.</li>
          <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities.</li>
          <li>Comply with legal obligations.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">5. Disclosure of Your Information</h2>
        <p>
          We may disclose your personal information to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Our subsidiaries and affiliates.</li>
          <li>Contractors, service providers, and other third parties we use to support our business.</li>
          <li>A buyer or other successor in the event of a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of our assets.</li>
          <li>Fulfill the purpose for which you provide it.</li>
          <li>Comply with any court order, law, or legal process, including responding to any government or regulatory request.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">6. Data Security</h2>
        <p>
          We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. 
          However, the transmission of information via the internet is not completely secure. Although we do our best to protect your personal information, 
          we cannot guarantee the security of your personal information transmitted to our Services.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">7. Your Rights</h2>
        <p>
          Depending on your location, you may have certain rights regarding your personal information, such as:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Access to your personal information.</li>
          <li>Correction of inaccurate or incomplete personal information.</li>
          <li>Deletion of your personal information.</li>
          <li>Restriction of processing of your personal information.</li>
          <li>Data portability.</li>
          <li>Objection to processing of your personal information.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
        <p>
          Our Services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. 
          If we learn we have collected or received personal information from a child under 13 without verification of parental consent, 
          we will delete that information.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">9. Changes to Our Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. If we make material changes to how we treat our users' personal information, 
          we will notify you through a notice on our website or by other means.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">10. Contact Information</h2>
        <p>
          If you have any questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
        </p>
        <p>
          <a href="mailto:privacy@bizznex.com" className="text-primary dark:text-primary-light">privacy@bizznex.com</a>
        </p>
      </div>
    </PublicLayout>
  );
} 