import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './components/FirebaseProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <FirebaseProvider>
        <App />
      </FirebaseProvider>
    </HelmetProvider>
  </StrictMode>,
);
