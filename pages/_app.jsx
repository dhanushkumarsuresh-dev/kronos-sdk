import '../styles/globals.css';
import { NetworkLogProvider } from '../hooks/useNetworkLog';

export default function App({ Component, pageProps }) {
  return (
    <NetworkLogProvider>
      <Component {...pageProps} />
    </NetworkLogProvider>
  );
}
