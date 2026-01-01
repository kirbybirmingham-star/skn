import React from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const DashboardDebug = () => {
  const { user, session, profile } = useAuth();

  if (!user) {
    return (
      <Card className="p-4">
        <CardTitle>Dashboard Debug: No User</CardTitle>
        <CardContent>Please log in to see debug info.</CardContent>
      </Card>
    );
  }

  // Simulate the dashboard logic
  const userRoles = user.user_metadata?.roles || [];
  const primaryRole = user.user_metadata?.role;
  const profileRole = profile?.role;

  const showAdminButtons = primaryRole === 'admin' || userRoles.includes('admin') || profileRole === 'admin';
  const showVendorButtons = profileRole === 'vendor' || userRoles.includes('vendor') || profileRole === 'admin';

  return (
    <Card className="p-4 border-red-500">
      <CardHeader>
        <CardTitle className="text-red-600">🔧 Dashboard Debug Component</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-bold">User Data:</h3>
          <div className="text-sm space-y-1 ml-4">
            <div>ID: {user.id}</div>
            <div>Email: {user.email}</div>
          </div>
        </div>

        <div>
          <h3 className="font-bold">User Metadata:</h3>
          <div className="text-sm space-y-1 ml-4">
            <div>role: "{primaryRole}"</div>
            <div>roles: {JSON.stringify(userRoles)}</div>
          </div>
        </div>

        <div>
          <h3 className="font-bold">Profile Data:</h3>
          <div className="text-sm space-y-1 ml-4">
            <div>role: "{profileRole}"</div>
          </div>
        </div>

        <div>
          <h3 className="font-bold">Dashboard Logic:</h3>
          <div className="text-sm space-y-1 ml-4">
            <div>showAdminButtons: <Badge variant={showAdminButtons ? "default" : "secondary"}>{showAdminButtons.toString()}</Badge></div>
            <div>showVendorButtons: <Badge variant={showVendorButtons ? "default" : "secondary"}>{showVendorButtons.toString()}</Badge></div>
          </div>
        </div>

        <div>
          <h3 className="font-bold">Expected Buttons:</h3>
          <div className="text-sm space-y-1 ml-4">
            {showAdminButtons && (
              <>
                <div>✅ ⚙️ Admin Dashboard</div>
                <div>✅ 📊 Admin Analytics</div>
              </>
            )}
            {showVendorButtons && (
              <>
                <div>✅ 🏪 Manage Store</div>
                <div>✅ 📦 Inventory Management</div>
                <div>✅ 📊 Vendor Analytics</div>
              </>
            )}
            {!showAdminButtons && !showVendorButtons && (
              <div className="text-red-600">❌ Basic customer interface (wrong!)</div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          If you see "Basic customer interface" above, there's a bug in the dashboard logic.
          The user should have admin/vendor buttons visible.
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardDebug;