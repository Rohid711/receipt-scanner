import React, { ReactNode, useState } from 'react';
import Header from './Header';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../utils/AuthContext';
import OfflineNotification from './OfflineNotification';
import { 
  FaList, 
  FaCalendarCheck, 
  FaUsers, 
  FaReceipt, 
  FaBuilding, 
  FaDollarSign,
  FaEnvelope,
  FaCog,
  FaFileInvoiceDollar,
  FaTags,
  FaUserTie
} from 'react-icons/fa';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  const featureLinks = [
    { href: '/dashboard', icon: <FaList className="w-5 h-5" />, label: 'Dashboard' },
    { href: '/jobs', icon: <FaCalendarCheck className="w-5 h-5" />, label: 'Jobs' },
    { href: '/clients', icon: <FaUsers className="w-5 h-5" />, label: 'Clients' },
    { href: '/employees', icon: <FaUserTie className="w-5 h-5" />, label: 'Employees' },
    { href: '/equipment', icon: <FaBuilding className="w-5 h-5" />, label: 'Equipment' },
    { href: '/receipts', icon: <FaReceipt className="w-5 h-5" />, label: 'Receipts' },
    { href: '/invoices', icon: <FaFileInvoiceDollar className="w-5 h-5" />, label: 'Invoices' },
    { href: '/expenses', icon: <FaDollarSign className="w-5 h-5" />, label: 'Expenses' },
    { href: '/payroll', icon: <FaUsers className="w-5 h-5" />, label: 'Payroll' },
    { href: '/emails', icon: <FaEnvelope className="w-5 h-5" />, label: 'Emails' },
    { href: '/settings', icon: <FaCog className="w-5 h-5" />, label: 'Settings' },
  ];

  // Separate array for settings and subscription links
  const settingsLinks = [
    { href: '/pricing', icon: <FaTags className="w-5 h-5" />, label: 'Subscription Plans' },
  ];

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  // Toggle sidebar for mobile view
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if current page is an auth page
  const isAuthPage = router.pathname === '/signin' || 
                     router.pathname === '/signup' || 
                     router.pathname === '/forgot-password' || 
                     router.pathname === '/reset-password';

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      
      <div className="flex flex-1 pt-16">
        {/* Sidebar - only show for authenticated users and not on auth pages */}
        {user && !isAuthPage && (
          <aside className={`w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:inset-auto z-30`}>
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 py-4 pt-16 md:pt-4">
              <nav className="px-3 space-y-1">
                {featureLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive(link.href)
                        ? 'text-primary dark:text-primary-light bg-primary-light/10 dark:bg-primary/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="mr-3 flex-shrink-0">
                      {link.icon}
                    </div>
                    <span>{link.label}</span>
                  </Link>
                ))}

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                {/* Settings Links */}
                {settingsLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive(link.href)
                        ? 'text-primary dark:text-primary-light bg-primary-light/10 dark:bg-primary/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="mr-3 flex-shrink-0">
                      {link.icon}
                    </div>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
        )}
      
        {/* Main Content */}
        <main className={`flex-1 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full transition-all duration-300 ${user && !isAuthPage ? 'md:ml-0' : ''}`}>
          {children}
        </main>
      </div>
      
      {/* Offline Notification */}
      <OfflineNotification />
      
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && user && !isAuthPage && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 md:hidden" 
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
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