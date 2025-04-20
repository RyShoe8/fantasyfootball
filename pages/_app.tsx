import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SleeperProvider, useSleeper } from '../contexts/SleeperContext';
import Layout from '../components/Layout';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Custom wrapper component to handle initialization
function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { user, isLoading, hasInitialized } = useSleeper();
  
  // Handle routing based on authentication state
  useEffect(() => {
    if (!hasInitialized || isLoading) return;

    const publicRoutes = ['/login'];
    const isPublicRoute = publicRoutes.includes(router.pathname);

    if (!user && !isPublicRoute) {
      console.log('No user found, redirecting to login');
      router.replace('/login');
    }
  }, [user, isLoading, hasInitialized, router]);

  // Log route changes and initialization for debugging
  useEffect(() => {
    console.log('AppContent mounted');
    console.log('Initial route:', router.pathname);
    console.log('Initial query:', router.query);
    
    const handleRouteChange = (url: string) => {
      console.log('Route change started:', {
        from: router.pathname,
        to: url,
        query: router.query
      });
    };
    
    const handleRouteChangeComplete = (url: string) => {
      console.log('Route change completed:', {
        currentPath: router.pathname,
        url,
        query: router.query
      });
    };
    
    const handleRouteChangeError = (err: Error, url: string) => {
      console.error('Route change failed:', {
        error: err.message,
        from: router.pathname,
        to: url,
        query: router.query
      });
    };
    
    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);
    
    return () => {
      console.log('AppContent unmounting');
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);
  
  // Show loading state while initializing
  if (!hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't wrap login page in Layout
  if (router.pathname === '/login') {
    return <Component {...pageProps} />;
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
  console.log('App rendering with props:', {
    pathname: props.router.pathname,
    query: props.router.query
  });
  return <AppWrapper {...props} />;
} 