import '../styles/globals.css';
import { ContextProvider } from '../contexts';
import Layout from '../components/Layout';
import React from 'react';

type AppProps = {
  Component: React.ComponentType<any>;
  pageProps: any;
};

interface LayoutProps {
  children: React.ReactNode;
}

interface ContextProviderProps {
  children: React.ReactNode;
}

function App({ Component, pageProps }: AppProps) {
  const content = <Component {...pageProps} />;
  
  return (
    <ContextProvider {...({} as ContextProviderProps)}>
      <Layout {...({} as LayoutProps)}>
        {content}
      </Layout>
    </ContextProvider>
  );
}

export default App; 