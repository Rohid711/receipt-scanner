import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthProvider } from '../utils/AuthContext';
import { SubscriptionProvider } from '../utils/SubscriptionContext';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);
  
  // Pages that don't use the standard layout (landing page, auth pages)
  const noLayoutPages = [
    '/',
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password'
  ];
  
  // Check if the current route should use layout
  const useStandardLayout = !noLayoutPages.includes(router.pathname);
  
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Head>
          <title>Bizznex</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <meta name="format-detection" content="telephone=no" />
          
          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          
          {/* PWA Meta Tags */}
          <meta name="application-name" content="Bizznex" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Bizznex" />
          <meta name="description" content="Business management application" />
          <meta name="theme-color" content="#000000" />
          
          {/* PWA Icons */}
          <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.svg" />
          <link rel="apple-touch-icon" sizes="96x96" href="/icons/icon-96x96.svg" />
          <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.svg" />
          <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.svg" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
          <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.svg" />
          <link rel="icon" type="image/svg+xml" sizes="192x192" href="/icons/icon-192x192.svg" />
          <link rel="icon" type="image/svg+xml" sizes="512x512" href="/icons/icon-512x512.svg" />
          
          {/* Manifest */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* PWA Check Script */}
          <script src="/pwa-check.js" defer></script>
        </Head>
        
        {useStandardLayout ? (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        ) : (
          <Component {...pageProps} />
        )}
      </SubscriptionProvider>
    </AuthProvider>
  );
} 