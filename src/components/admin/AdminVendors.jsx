import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Store, CheckCircle, Clock, AlertCircle, Eye, Trash2, Edit } from 'lucide-react';

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVendorStatus = async (vendorId, status) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ onboarding_status: status, is_active: status === 'completed' })
        .eq('id', vendorId);

      if (error) throw error;
      fetchVendors();
    } catch (error) {
      console.error('Error updating vendor status:', error);
      alert('Failed to update vendor status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</span>;
      case 'kyc_in_progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />KYC Pending</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" />Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
        <div className="text-sm text-gray-500">
          {vendors.length} total vendors
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Store className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{vendor.name}</h3>
                  <p className="text-sm text-gray-500">@{vendor.slug}</p>
                </div>
              </div>
              {getStatusBadge(vendor.onboarding_status)}
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600 line-clamp-2">{vendor.description}</p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Created {new Date(vendor.created_at).toLocaleDateString()}
              </div>
              <div className="flex space-x-2">
                <Link
                  to={`/store/${vendor.id}`}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors inline-flex items-center"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Link>
                {vendor.onboarding_status !== 'completed' && (
                  <button
                    onClick={() => updateVendorStatus(vendor.id, 'completed')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {vendors.length === 0 && (
        <div className="text-center py-12">
          <Store className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors yet</h3>
          <p className="mt-1 text-sm text-gray-500">Vendors will appear here once they complete onboarding.</p>
        </div>
      )}
    </div>
  );
};

export default AdminVendors;