import React from 'react';

/**
 * Utility functions for network status
 */

/**
 * Check if the user is currently online
 */
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
    ? navigator.onLine 
    : true;
};

/**
 * Add event listener for online status changes
 */
export const onNetworkStatusChange = (callback: (online: boolean) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Create a React hook for network status
 */
export const useNetworkStatus = () => {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return { online: true };
  }
  
  const [online, setOnline] = React.useState(navigator.onLine);
  
  React.useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return { online };
}; 