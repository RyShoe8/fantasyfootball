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

const Layout = React.memo(({ children }: LayoutProps) => {
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
    leagueContext = { 
      currentLeague: null, 
      isLoading: false, 
      setCurrentLeague: () => {},
      setSelectedYear: () => {}
    };
  }

  const { leagues, currentLeague, setCurrentLeague, selectedYear, setSelectedYear, availableYears } = leagueContext || {};

  // Memoize sorted leagues to prevent unnecessary recalculations
  const sortedLeagues = React.useMemo(() => {
    if (!leagues) return [];
    const uniqueLeagues = new Map();
    leagues.forEach((league: SleeperLeague) => {
      if (!uniqueLeagues.has(league.name)) {
        uniqueLeagues.set(league.name, league);
      }
    });
    return Array.from(uniqueLeagues.values()).sort((a: SleeperLeague, b: SleeperLeague) => 
      a.name.localeCompare(b.name)
    );
  }, [leagues]);

  // Memoize event handlers
  const handleLeagueChange = React.useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLeague = leagues?.find((league: SleeperLeague) => league.league_id === event.target.value);
    if (selectedLeague && setCurrentLeague) {
      setCurrentLeague(selectedLeague);
    }
  }, [leagues, setCurrentLeague]);

  const handleYearChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    if (setSelectedYear) {
      setSelectedYear(year);
    }
  }, [setSelectedYear]);

  const handleMobileMenuToggle = React.useCallback(() => {
    setIsMobileMenuOpen((prev: boolean) => !prev);
  }, []);

  // Handle hydration
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Handle mobile detection with debounce
  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 100);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      clearTimeout(timeoutId);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600">🏈 Fantasy OS</span>
          </div>
          <Spinner />
        </div>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600">🏈 Fantasy OS</span>
          </div>
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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900">
                  Fantasy OS
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/" className={`${router.pathname === '/' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Dashboard
                </Link>
                <Link href="/roster" className={`${router.pathname === '/roster' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Roster
                </Link>
                <Link href="/players" className={`${router.pathname === '/players' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Players
                </Link>
                <Link href="/trades" className={`${router.pathname === '/trades' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Trades
                </Link>
              </div>
            </div>

            {/* League and Year Selection */}
            <div className="hidden sm:flex sm:items-center sm:ml-6 space-x-4">
              <div className="flex items-center space-x-4">
                {/* League Selection */}
                <select
                  id="league-select"
                  value={currentLeague?.league_id || ''}
                  onChange={handleLeagueChange}
                  className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  disabled={authLoading}
                >
                  <option value="">Select League</option>
                  {sortedLeagues.map((league: SleeperLeague) => (
                    <option key={league.league_id} value={league.league_id}>
                      {league.name}
                    </option>
                  ))}
                </select>

                {/* Year Selection */}
                <select
                  id="year-select"
                  value={selectedYear || ''}
                  onChange={handleYearChange}
                  className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  disabled={!currentLeague || authLoading}
                >
                  {availableYears?.map((year: string) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* User section */}
              <div className="flex items-center space-x-2">
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

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={handleMobileMenuToggle}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/" className={`${router.pathname === '/' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Dashboard
            </Link>
            <Link href="/roster" className={`${router.pathname === '/roster' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Roster
            </Link>
            <Link href="/players" className={`${router.pathname === '/players' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Players
            </Link>
            <Link href="/trades" className={`${router.pathname === '/trades' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
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
                  disabled={authLoading}
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
                  disabled={!currentLeague || authLoading}
                >
                  {availableYears?.map((year: string) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile user section */}
            <div className="mt-3 px-4 pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {user?.display_name || user?.username}
                </div>
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
      </nav>

      {/* Main content */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout; 