import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const RequireRole = ({ role, children }) => {
  const { profile, loading: authLoading } = useAuth();

  const roleValue = profile?.role ?? null;
  const required = Array.isArray(role) ? role : [role];

  console.log('[REQUIRE_ROLE] Component rendered for role requirement:', required);
  console.log('[REQUIRE_ROLE] User profile:', profile);
  console.log('[REQUIRE_ROLE] Auth loading:', authLoading);
  console.log('[REQUIRE_ROLE] Current role value:', roleValue);

  if (authLoading) {
    console.log('[REQUIRE_ROLE] Showing loading spinner');
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  console.log('[REQUIRE_ROLE] Checking access - required:', required, 'has:', roleValue);
  if (!roleValue || !required.includes(roleValue)) {
    console.log('[REQUIRE_ROLE] Access denied - showing unauthorized message');
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Unauthorized</h2>
        <p className="text-slate-600">You do not have the required permissions to view this page.</p>
      </div>
    );
  }

  console.log('[REQUIRE_ROLE] Access granted - rendering children');
  return children;
};

export default RequireRole;
