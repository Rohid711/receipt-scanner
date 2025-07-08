import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../utils/network';

const OfflineNotification: React.FC = () => {
  const { online } = useNetworkStatus();
  const [showNotification, setShowNotification] = useState(false);
  
  useEffect(() => {
    if (!online) {
      setShowNotification(true);
    } else {
      // Add a small delay before hiding to ensure user sees it
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [online]);
  
  if (!showNotification) return null;
  
  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 shadow-lg z-50 flex items-center transition-all duration-300 ${online ? 'opacity-0' : 'opacity-100'}`}>
      <div className="mr-3 text-xl">
        {online ? '🟢' : '🔴'}
      </div>
      <div>
        <p className="font-medium text-yellow-800">
          {online ? 'You are back online!' : 'You are currently offline'}
        </p>
        <p className="text-sm text-yellow-700">
          {online 
            ? 'Your changes will now be synchronized.' 
            : 'Some features may be limited. Changes will sync when you reconnect.'}
        </p>
      </div>
    </div>
  );
};

export default OfflineNotification; 