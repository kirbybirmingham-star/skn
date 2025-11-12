import React from 'react';
    import { Navigate } from 'react-router-dom';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { Loader2 } from 'lucide-react';

    const ProtectedRoute = ({ children }) => {
      const { user, loading } = useAuth();

      if (loading) {
        return (
          <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
          </div>
        );
      }

      if (!user) {
        return <Navigate to="/" replace />;
      }

      return children;
    };

    export default ProtectedRoute;