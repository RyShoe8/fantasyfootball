import '../styles/globals.css';
import { ContextProvider } from '../contexts';
import Layout from '../components/Layout';
import React from 'react';

type AppProps = {
  Component: React.ComponentType<any>;
  pageProps: any;
};

function App({ Component, pageProps }: AppProps) {
  return (
    <ContextProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ContextProvider>
  );
}

export default App; 