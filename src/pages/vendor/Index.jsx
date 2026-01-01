import React from 'react';
import { Outlet } from 'react-router-dom';
import VendorSidebar from '@/components/VendorSidebar';
import VendorDashboard from './Dashboard';

const VendorIndex = () => {
  return (
    <div className="p-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <VendorSidebar />
        </div>
        <div className="lg:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default VendorIndex;
