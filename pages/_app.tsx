import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ContextProvider } from '../contexts';
import { useAuth } from '../contexts';
import Layout from '../components/Layout';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[App]', ...args);
  }
};

// Custom wrapper component to handle initialization
function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { user, isLoading, error, isAuthenticated } = useAuth();
  
  // Handle routing based on authentication state
  useEffect(() => {
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
        reason: !isAuthenticated ? 'Not authenticated' : 'Error occurred',
        error
      });
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router.pathname, error]);

  // Log state changes for debugging
  useEffect(() => {
    debugLog('App state updated:', {
      isAuthenticated,
      isLoading,
      user: user ? 'Present' : 'Not present',
      currentPath: router.pathname,
      error
    });
  }, [isAuthenticated, isLoading, user, router.pathname, error]);

  // Show loading state only while loading and not on login page
  if (isLoading && router.pathname !== '/login') {
    debugLog('Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error && router.pathname !== '/login') {
    debugLog('Showing error state:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Don't wrap login page in Layout
  if (router.pathname === '/login') {
    debugLog('Rendering login page without layout');
    return <Component {...pageProps} />;
  }
  
  // If there's no user and we're not on a public route, redirect to login
  if (!isAuthenticated) {
    debugLog('Not authenticated, redirecting to login');
    router.replace('/login');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  debugLog('Rendering page with layout');
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

function AppWrapper(props: AppProps) {
  debugLog('Initializing AppWrapper');
  return (
    <ContextProvider>
      <AppContent {...props} />
    </ContextProvider>
  );
}

export default function App(props: AppProps) {
  debugLog('Initializing App');
  return <AppWrapper {...props} />;
} 