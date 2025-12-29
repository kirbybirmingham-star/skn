import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/SupabaseAuthContext';
import ErrorBoundary from './ErrorBoundary';
import { router } from './lib/routerConfig';

// Suppress known third-party warnings in development
if (process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  console.warn = function(...args) {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React Router Future Flag Warning') ||
       args[0].includes('startTransition'))
    ) {
      return; // Suppress informational warnings we've already addressed
    }
    originalWarn.call(console, ...args);
  };

  const originalError = console.error;
  console.error = function(...args) {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('UNSAFE_componentWillMount') ||
       args[0].includes('aria-describedby') ||
       args[0].includes('Missing `Description`'))
    ) {
      return; // Suppress known third-party warnings
    }
    originalError.call(console, ...args);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster />
      </ErrorBoundary>
    </AuthProvider>
  </React.StrictMode>
);