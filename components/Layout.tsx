import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSleeper } from '../contexts/SleeperContext';
import Login from './Login';
import Spinner from './Spinner';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isLoading } = useSleeper();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if current page requires authentication
  const requiresAuth = !['/login'].includes(router.pathname);

  useEffect(() => {
    // Log current path and auth state for debugging
    console.log('Current path:', router.pathname);
    console.log('User authenticated:', !!user);
    console.log('Requires auth:', requiresAuth);

    // Redirect to login if not authenticated and trying to access protected page
    if (requiresAuth && !user && !isLoading) {
      console.log('Redirecting to login page - not authenticated');
      router.push('/login');
    }
  }, [router.pathname, user, isLoading, requiresAuth]);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Show login page if not authenticated and on login page
  if (!user && router.pathname === '/login') {
    return <Login />;
  }

  // Show nothing while redirecting
  if (!user && requiresAuth) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">🏈 Fantasy OS</span>
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Desktop menu */}
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium ${router.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}>
                Dashboard
              </Link>
              <Link href="/roster" className={`px-3 py-2 rounded-md text-sm font-medium ${router.pathname === '/roster' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}>
                Roster
              </Link>
              <Link href="/trade-evaluator" className={`px-3 py-2 rounded-md text-sm font-medium ${router.pathname === '/trade-evaluator' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}>
                Trade Evaluator
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{user?.display_name}</span>
                {user?.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.display_name}
                    className="h-8 w-8 rounded-full"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className={`block px-3 py-2 rounded-md text-base font-medium ${router.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}>
              Dashboard
            </Link>
            <Link href="/roster" className={`block px-3 py-2 rounded-md text-base font-medium ${router.pathname === '/roster' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}>
              Roster
            </Link>
            <Link href="/trade-evaluator" className={`block px-3 py-2 rounded-md text-base font-medium ${router.pathname === '/trade-evaluator' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}>
              Trade Evaluator
            </Link>
            <div className="flex items-center space-x-2 px-3 py-2">
              <span className="text-sm text-gray-600">{user?.display_name}</span>
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user.display_name}
                  className="h-8 w-8 rounded-full"
                />
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout; 