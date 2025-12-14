import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import VendorSidebar from '@/components/VendorSidebar';

const VendorIndex = () => {
  return (
    <>
      <Helmet>
        <title>Vendor Dashboard | SKN Bridge Trade</title>
        <meta name="description" content="Manage your store, products, and orders on SKN Bridge Trade." />
      </Helmet>
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <VendorSidebar />
              </div>
            </div>
            <div className="lg:col-span-3">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorIndex;
