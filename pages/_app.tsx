import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SleeperProvider } from '../contexts/SleeperContext';
import Layout from '../components/Layout';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Custom wrapper component to handle initialization
function AppWrapper({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Log route changes for debugging
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      console.log(`App is changing to: ${url}`);
    };
    
    router.events.on('routeChangeStart', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
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
  return <AppWrapper {...props} />;
} 