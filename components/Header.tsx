import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaTractor,
  FaUser,
  FaSignOutAlt,
  FaUserCircle,
  FaCaretDown,
  FaReceipt,
  FaBuilding,
  FaTags
} from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../utils/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({ toggleSidebar, sidebarOpen }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setIsUserMenuOpen(false);
  }, [router.pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const userMenu = document.getElementById('user-menu');
      if (userMenu && !userMenu.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = user ? [
    { href: '/', icon: <FaHome className="mr-2" />, label: 'Home' },
  ] : [
    { href: '/', icon: <FaHome className="mr-2" />, label: 'Home' },
    ...(router.pathname !== '/pricing' ? [{ href: '/pricing', icon: <FaTags className="mr-2" />, label: 'Pricing' }] : []),
  ];

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 fixed w-full z-40">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Sidebar Toggle Button (visible only when user is authenticated) */}
            {user && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200 mr-2"
                aria-expanded={sidebarOpen}
              >
                <span className="sr-only">Toggle sidebar</span>
                <FaBars className="block h-6 w-6" aria-hidden="true" />
              </button>
            )}
            
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <FaBuilding className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-gray-900 dark:text-white font-display">Bizznex</span>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:ml-6 md:flex md:space-x-4 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors duration-200 ${
                  isActive(link.href)
                    ? 'text-primary dark:text-primary-light bg-primary-light/10 dark:bg-primary/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            
            <ThemeToggle className="ml-4" />
            
            {/* User menu - shows when logged in */}
            {user ? (
              <div className="ml-4 relative" id="user-menu">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light"
                >
                  <FaUserCircle className="h-7 w-7" />
                  <span className="text-sm font-medium hidden sm:block">
                    {user.displayName || user.email}
                  </span>
                  <FaCaretDown className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center space-x-2">
                          <FaUser className="h-4 w-4" />
                          <span>Your Profile</span>
                        </div>
                      </Link>
                      <button
                        onClick={signOut}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center space-x-2">
                          <FaSignOutAlt className="h-4 w-4" />
                          <span>Sign out</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/signin"
                className="ml-4 px-3 py-2 text-sm font-medium rounded-md text-primary dark:text-primary-light border border-primary dark:border-primary-light hover:bg-primary hover:text-white dark:hover:bg-primary-light dark:hover:text-gray-900 transition-colors duration-200"
              >
                Sign in
              </Link>
            )}
          </nav>

          {/* Mobile Navigation Button */}
          <div className="flex items-center md:hidden">
            <ThemeToggle className="mr-2" />
            
            {/* Mobile sign in button */}
            {!user && (
              <Link
                href="/signin"
                className="mr-2 p-2 text-sm font-medium rounded-md text-primary dark:text-primary-light"
              >
                <FaUser className="h-5 w-5" />
              </Link>
            )}
            
            {/* Mobile user menu button */}
            {user && (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="mr-2 p-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light"
              >
                <FaUserCircle className="h-6 w-6" />
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <FaTimes className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <FaBars className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                  isActive(link.href)
                    ? 'text-primary dark:text-primary-light bg-primary-light/10 dark:bg-primary/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            
            {user && (
              <>
                <Link
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  <FaUser className="mr-3 h-5 w-5" />
                  Your Profile
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    signOut();
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaSignOutAlt className="mr-3 h-5 w-5" />
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Mobile User Menu */}
      {isUserMenuOpen && user && (
        <div className="absolute top-16 right-0 w-full md:hidden z-50">
          <div className="bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 py-2 px-4">
            <div className="flex items-center space-x-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <FaUserCircle className="h-10 w-10 text-primary" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {user.displayName || 'User'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="py-2 space-y-1">
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <FaUser className="mr-3 h-5 w-5" />
                Your Profile
              </Link>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  signOut();
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaSignOutAlt className="mr-3 h-5 w-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 