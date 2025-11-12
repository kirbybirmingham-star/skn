import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/SupabaseAuthContext';
import ErrorBoundary from './ErrorBoundary';
import { router } from './lib/routerConfig';

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