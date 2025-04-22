import React from 'react';
import { useRouter } from 'next/router';
import { useAuth, useLeague } from '../contexts';
import Login from './auth/Login';
import Spinner from './Spinner';
import Link from 'next/link';
import { SleeperLeague } from '../types/sleeper';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility with timestamps
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Layout]`, ...args);
  }
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  debugLog('Layout component rendering');
  
  const { user, isLoading: authLoading, error: authError, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  
  // Get league context safely with detailed error tracking
  let leagueContext;
  try {
    debugLog('Attempting to access league context');
    leagueContext = useLeague();
    debugLog('League context accessed successfully:', leagueContext);
  } catch (error) {
    debugLog('Error accessing league context:', error);
    leagueContext = { currentLeague: null, isLoading: false };
  }

  const { leagues, currentLeague, setCurrentLeague, selectedYear, setSelectedYear } = leagueContext || {};

  // Sort leagues alphabetically
  const sortedLeagues = React.useMemo(() => {
    if (!leagues) return [];
    return [...leagues].sort((a: SleeperLeague, b: SleeperLeague) => a.name.localeCompare(b.name));
  }, [leagues]);

  // Generate year options (current year and previous 5 years)
  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i: number) => (currentYear - i).toString());
  }, []);

  // Handle league change
  const handleLeagueChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLeague = leagues?.find((league: SleeperLeague) => league.league_id === event.target.value);
    if (selectedLeague) {
      setCurrentLeague(selectedLeague);
    }
  };

  // Handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    setSelectedYear(year);
  };

  // Handle hydration and mobile detection
  React.useEffect(() => {
    debugLog('Setting up hydration and mobile detection');
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

  // Check if current page requires authentication
  const requiresAuth = !['/login'].includes(router.pathname);
  debugLog('Auth requirements:', { requiresAuth, path: router.pathname });

  // Handle authentication
  React.useEffect(() => {
    debugLog('Auth state changed', {
      isHydrated,
      authLoading,
      requiresAuth,
      hasUser: !!user,
      hasLeague: !!leagueContext?.currentLeague,
      path: router.pathname,
      isMobile
    });

    // Only redirect if we're hydrated and not loading
    if (isHydrated && !authLoading) {
      if (requiresAuth && !user) {
        debugLog('Redirecting to login - no user');
        router.push('/login');
      } else if (!requiresAuth && user) {
        debugLog('Redirecting to home - user exists');
        router.push('/');
      }
    }
  }, [isHydrated, authLoading, requiresAuth, user, leagueContext, router, isMobile]);

  // Show loading state
  if (!isHydrated || authLoading) {
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
  debugLog('Rendering main layout with children');
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-800">
                  Fantasy OS
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
                <Link
                  href="/trades"
                  className={`${
                    router.pathname === '/trades'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Trades
                </Link>
              </div>
            </div>
            
            {/* League and Year Selectors */}
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="league-select" className="text-sm font-medium text-gray-700">
                  League:
                </label>
                <select
                  id="league-select"
                  value={currentLeague?.league_id || ''}
                  onChange={handleLeagueChange}
                  className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select League</option>
                  {sortedLeagues.map((league: SleeperLeague) => (
                    <option key={league.league_id} value={league.league_id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
                  Year:
                </label>
                <select
                  id="year-select"
                  value={selectedYear || ''}
                  onChange={handleYearChange}
                  className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  {yearOptions.map((year: string) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2">
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
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
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
              <Link
                href="/trades"
                className={`${
                  router.pathname === '/trades'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                Trades
              </Link>
            </div>
            
            {/* Mobile League and Year Selectors */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-4 space-y-3">
                <div>
                  <label htmlFor="mobile-league-select" className="block text-sm font-medium text-gray-700">
                    League
                  </label>
                  <select
                    id="mobile-league-select"
                    value={currentLeague?.league_id || ''}
                    onChange={handleLeagueChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select League</option>
                    {sortedLeagues.map((league: SleeperLeague) => (
                      <option key={league.league_id} value={league.league_id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="mobile-year-select" className="block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <select
                    id="mobile-year-select"
                    value={selectedYear || ''}
                    onChange={handleYearChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {yearOptions.map((year: string) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-3 px-4 flex items-center justify-between">
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