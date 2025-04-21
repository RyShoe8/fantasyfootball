import '../styles/globals.css';
import { ContextProvider } from '../contexts';
import Layout from '../components/Layout';
import React from 'react';

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logging utility with timestamps
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [_app]`, ...args);
  }
};

type AppProps = {
  Component: React.ComponentType<any>;
  pageProps: any;
};

function App({ Component, pageProps }: AppProps) {
  debugLog('App component rendering', { Component: Component.name, pageProps });
  
  // Track mount state
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    debugLog('App component mounted');
    setIsMounted(true);
    return () => {
      debugLog('App component unmounting');
      setIsMounted(false);
    };
  }, []);

  debugLog('Rendering App with ContextProvider and Layout');
  return (
    <ContextProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ContextProvider>
  );
}

export default App; 