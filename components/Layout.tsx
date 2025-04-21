import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts';
import { useLeague } from '../contexts';
import Login from './auth/Login';
import Spinner from './Spinner';
import Link from 'next/link';
import { SleeperLeague } from '../types/sleeper';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[Layout]', ...args);
  }
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, isLoading: authLoading, error: authError, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [currentLeague, setCurrentLeague] = React.useState<SleeperLeague | null>(null);
  const [isLeagueLoading, setIsLeagueLoading] = React.useState(true);

  // Handle hydration and mobile detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    setIsHydrated(true);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Safely access league context
  React.useEffect(() => {
    try {
      const leagueContext = useLeague();
      setCurrentLeague(leagueContext.currentLeague);
    } catch (error) {
      debugLog('League context not available:', error);
    } finally {
      setIsLeagueLoading(false);
    }
  }, []);

  // Check if current page requires authentication
  const requiresAuth = !['/login'].includes(router.pathname);

  // Handle authentication
  React.useEffect(() => {
    debugLog('Auth state changed', {
      isHydrated,
      authLoading,
      requiresAuth,
      hasUser: !!user,
      hasLeague: !!currentLeague,
      path: router.pathname,
      isMobile
    });

    // Only redirect if we're hydrated and not loading
    if (isHydrated && !authLoading && !isLeagueLoading) {
      if (requiresAuth && !user) {
        debugLog('Redirecting to login - no user');
        router.push('/login');
      } else if (!requiresAuth && user) {
        debugLog('Redirecting to home - user exists');
        router.push('/');
      }
    }
  }, [isHydrated, authLoading, isLeagueLoading, requiresAuth, user, currentLeague, router, isMobile]);

  // Show loading state
  if (!isHydrated || authLoading || isLeagueLoading) {
    debugLog('Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Show error state
  if (authError) {
    debugLog('Showing error state:', authError);
    const errorMessage = typeof authError === 'object' && authError !== null && 'message' in authError 
      ? (authError as { message: string }).message 
      : 'An error occurred';
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Show login page without layout
  if (!requiresAuth) {
    debugLog('Rendering login page without layout');
    return <Login />;
  }

  // Show main layout
  debugLog('Rendering main layout');
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-800">
                  Fantasy Football
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className={`${
                    router.pathname === '/'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Home
                </Link>
                <Link
                  href="/rosters"
                  className={`${
                    router.pathname === '/rosters'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Rosters
                </Link>
                <Link
                  href="/players"
                  className={`${
                    router.pathname === '/players'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Players
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    {user?.display_name || user?.username}
                  </span>
                  <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className={`${
                  router.pathname === '/'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                Home
              </Link>
              <Link
                href="/rosters"
                className={`${
                  router.pathname === '/rosters'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                Rosters
              </Link>
              <Link
                href="/players"
                className={`${
                  router.pathname === '/players'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                Players
              </Link>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <span className="text-sm text-gray-700">
                    {user?.display_name || user?.username}
                  </span>
                </div>
                <div className="ml-3">
                  <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 