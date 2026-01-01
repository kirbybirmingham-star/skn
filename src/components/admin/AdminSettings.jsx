import React, { useState } from 'react';
import { Settings, Save, AlertTriangle } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    platformName: 'SKN Shop',
    allowNewVendors: true,
    requireVendorApproval: true,
    maintenanceMode: false,
    emailNotifications: true,
    maxFileSize: 10,
    supportedCurrencies: ['USD'],
    defaultCurrency: 'USD'
  });

  const handleSave = async () => {
    try {
      // TODO: Implement actual settings persistence to database
      // For now, just show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {/* Platform Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Configuration</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Vendor Settings */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Management</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="allowNewVendors"
                    type="checkbox"
                    checked={settings.allowNewVendors}
                    onChange={(e) => setSettings({...settings, allowNewVendors: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allowNewVendors" className="ml-2 block text-sm text-gray-900">
                    Allow new vendor registrations
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="requireVendorApproval"
                    type="checkbox"
                    checked={settings.requireVendorApproval}
                    onChange={(e) => setSettings({...settings, requireVendorApproval: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireVendorApproval" className="ml-2 block text-sm text-gray-900">
                    Require admin approval for new vendors
                  </label>
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="maintenanceMode"
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                    Enable maintenance mode
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="emailNotifications"
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                    Enable email notifications
                  </label>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-red-200 pt-6">
              <h3 className="text-lg font-medium text-red-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Danger Zone
              </h3>
              <div className="space-y-4">
                <button className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  Reset All Vendor Data
                </button>
                <button className="ml-4 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  Clear All Orders
                </button>
              </div>
              <p className="mt-2 text-sm text-red-600">
                These actions cannot be undone. Please proceed with caution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;