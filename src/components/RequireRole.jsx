import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const RequireRole = ({ role, children }) => {
  const { profile, loading: authLoading } = useAuth();

  const roleValue = profile?.role ?? null;
  const required = Array.isArray(role) ? role : [role];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (!roleValue || !required.includes(roleValue)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Unauthorized</h2>
        <p className="text-slate-600">You do not have the required permissions to view this page.</p>
      </div>
    );
  }

  return children;
};

export default RequireRole;
