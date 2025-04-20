import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SleeperProvider } from '../contexts/SleeperContext';
import Layout from '../components/Layout';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Custom wrapper component to handle initialization
function AppWrapper({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Log route changes and initialization for debugging
  useEffect(() => {
    console.log('AppWrapper mounted');
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
    
    // Check for stored user data
    const storedUser = localStorage.getItem('sleeperUser');
    console.log('Initial stored user data:', storedUser ? JSON.parse(storedUser) : null);
    
    return () => {
      console.log('AppWrapper unmounting');
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);
  
  return (
    <SleeperProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
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