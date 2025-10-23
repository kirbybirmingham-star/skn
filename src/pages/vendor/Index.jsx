import React from 'react';
import VendorSidebar from '@/components/VendorSidebar';

const VendorIndex = () => {
  return (
    <div className="p-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <VendorSidebar />
        </div>
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold mb-4">Vendor Dashboard</h1>
          <p className="text-slate-600">Welcome to your vendor dashboard. Use the sidebar to manage products and orders.</p>
        </div>
      </div>
    </div>
  );
};

export default VendorIndex;
