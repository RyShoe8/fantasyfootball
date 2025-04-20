import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SleeperProvider } from '../contexts/SleeperContext';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SleeperProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SleeperProvider>
  );
} 