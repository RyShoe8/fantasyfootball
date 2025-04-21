import '../styles/globals.css';
import { ContextProvider } from '../contexts';
import Layout from '../components/Layout';
import type { AppProps } from 'next/app';

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