import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaBuilding } from 'react-icons/fa';
import OfflineNotification from './OfflineNotification';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* Simple header for public pages */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 fixed w-full z-40">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <FaBuilding className="h-8 w-8 text-primary" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white font-display">Bizznex</span>
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light">
                Home
              </Link>
              <Link href="/contact" className={`text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light ${router.pathname === '/contact' ? 'text-primary dark:text-primary-light' : ''}`}>
                Contact
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 pt-16 px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto w-full">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Offline Notification */}
      <OfflineNotification />
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 transition-colors duration-200">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 dark:text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Bizznex. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">
                Privacy
              </Link>
              <Link href="/contact" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 