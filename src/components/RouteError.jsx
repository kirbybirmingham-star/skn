import React from 'react';
import { useRouteError, Link } from 'react-router-dom';

const RouteError = () => {
  const error = useRouteError();
  console.error('Route error:', error);

  const status = error?.status || (error && error.statusCode) || null;
  const message = error?.statusText || error?.message || 'An unexpected error occurred.';

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="max-w-2xl bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Unexpected Application Error</h1>
        {status && <p className="text-sm text-slate-500 mb-2">Status: {status}</p>}
        <p className="mb-4 text-slate-700">{message}</p>

        <div className="flex justify-center gap-3">
          <Link to="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg">Go to Home</Link>
          <button onClick={() => window.location.reload()} className="inline-block border border-slate-200 px-4 py-2 rounded-lg">Reload</button>
        </div>

        <details className="mt-4 text-left text-xs text-slate-500">
          <summary className="cursor-pointer">Debug info</summary>
          <pre className="whitespace-pre-wrap mt-2">{JSON.stringify(error, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
};

export default RouteError;
