import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './components/FirebaseProvider.tsx';
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(HelmetProvider, { children: _jsx(FirebaseProvider, { children: _jsx(App, {}) }) }) }));
