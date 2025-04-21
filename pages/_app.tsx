import '../styles/globals.css';
import { ContextProvider } from '../contexts';
import { useAuth } from '../contexts';
import Layout from '../components/Layout';
import React from 'react';
import { useRouter } from 'next/router';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[App]', ...args);
  }
};

type AppProps = {
  Component: React.ComponentType<any>;
  pageProps: any;
};

// Custom wrapper component to handle initialization
function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { user, isLoading, error, isAuthenticated } = useAuth();
  
  // Handle routing based on authentication state
  React.useEffect(() => {
    debugLog('Route change detected:', {
      path: router.pathname,
      isAuthenticated,
      isLoading,
      error
    });

    const publicRoutes = ['/login'];
    const isPublicRoute = publicRoutes.includes(router.pathname);

    // If we're on a public route, don't redirect
    if (isPublicRoute) {
      debugLog('On public route, no redirect needed');
      return;
    }

    // If we're still loading, don't redirect yet
    if (isLoading) {
      debugLog('Still loading, waiting before redirect');
      return;
    }

    // If there's no user or there's an error, redirect to login
    if (!isAuthenticated || error) {
      debugLog('Redirecting to login:', {
        isAuthenticated,
        error
      });
      router.push('/login');
    }
  }, [router.pathname, isAuthenticated, isLoading, error]);

  // Show loading state
  if (isLoading) {
    debugLog('Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    debugLog('Showing error state:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on a public route, show nothing (will redirect)
  if (!isAuthenticated && !['/login'].includes(router.pathname)) {
    debugLog('Not authenticated and not on public route, showing nothing');
    return null;
  }

  debugLog('Rendering app content');
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

// Wrap the app with context providers
function AppWrapper({ Component, pageProps }: AppProps) {
  return (
    <ContextProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </ContextProvider>
  );
}

// Export the wrapped app
export default function App({ Component, pageProps }: AppProps) {
  return <AppWrapper Component={Component} pageProps={pageProps} />;
} 