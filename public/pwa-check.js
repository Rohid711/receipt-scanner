// This script will run in the browser to check if the PWA is working correctly

// Check if the browser supports service workers
// Use window scope to avoid duplicate declarations
if (!window.checkServiceWorkerSupport) {
  window.checkServiceWorkerSupport = () => {
    return 'serviceWorker' in navigator;
  };
}

// Check if the app is running in standalone mode (installed as PWA)
if (!window.checkStandaloneMode) {
  window.checkStandaloneMode = () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  };
}

// Check if the manifest is loaded correctly
if (!window.checkManifest) {
  window.checkManifest = async () => {
    try {
      const response = await fetch('/manifest.json');
      return response.ok;
    } catch (error) {
      return false;
    }
  };
}

// Check if the service worker is registered
if (!window.checkServiceWorkerRegistration) {
  window.checkServiceWorkerRegistration = async () => {
    if (!window.checkServiceWorkerSupport()) return false;
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    } catch (error) {
      return false;
    }
  };
}

// Run all checks and log results
if (!window.runPWAChecks) {
  window.runPWAChecks = async () => {
    console.log('PWA Checks:');
    console.log('-------------------');
    console.log(`Service Worker Support: ${window.checkServiceWorkerSupport() ? '✅' : '❌'}`);
    console.log(`Running as Standalone: ${window.checkStandaloneMode() ? '✅' : '❌'}`);
    console.log(`Manifest Loaded: ${await window.checkManifest() ? '✅' : '❌'}`);
    console.log(`Service Worker Registered: ${await window.checkServiceWorkerRegistration() ? '✅' : '❌'}`);
    console.log('-------------------');
    
    if (window.checkServiceWorkerSupport() && await window.checkManifest() && await window.checkServiceWorkerRegistration()) {
      console.log('✅ PWA is set up correctly!');
    } else {
      console.log('❌ PWA setup has issues. Check the details above.');
    }
  };
}

// Run checks when the page loads
window.addEventListener('load', window.runPWAChecks); 