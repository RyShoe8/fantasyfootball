import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SleeperProvider, useSleeper } from '../contexts/SleeperContext';
import Layout from '../components/Layout';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Custom wrapper component to handle initialization
function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { user, isLoading, hasInitialized, error } = useSleeper();
  
  // Handle routing based on authentication state
  useEffect(() => {
    if (!hasInitialized) return;

    const publicRoutes = ['/login'];
    const isPublicRoute = publicRoutes.includes(router.pathname);

    // If we're on a public route, don't redirect
    if (isPublicRoute) return;

    // If we're still loading, don't redirect yet
    if (isLoading) return;

    // If there's no user and we're not on a public route, redirect to login
    if (!user) {
      console.log('No user found, redirecting to login');
      router.replace('/login');
    }
  }, [user, isLoading, hasInitialized, router.pathname]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('App state:', {
      hasInitialized,
      isLoading,
      user: user ? 'Present' : 'Not present',
      currentPath: router.pathname,
      error
    });
  }, [hasInitialized, isLoading, user, router.pathname, error]);

  // Show loading state only while initializing and not on login page
  if (!hasInitialized && router.pathname !== '/login') {
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
    return <Component {...pageProps} />;
  }
  
  // If there's no user and we're not on a public route, redirect to login
  if (!user) {
    console.log('No user found, redirecting to login');
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
  
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

function AppWrapper(props: AppProps) {
  return (
    <SleeperProvider>
      <AppContent {...props} />
    </SleeperProvider>
  );
}

export default function App(props: AppProps) {
  return <AppWrapper {...props} />;
} 