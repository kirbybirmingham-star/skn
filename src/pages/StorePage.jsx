import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import ProductsList from '@/components/ProductsList';
import VendorCard from '@/components/VendorCard';
import { getProducts, getVendors, getVendorById } from '@/api/EcommerceApi';

const StorePage = () => {
  const { sellerId } = useParams();
  const [sellerName, setSellerName] = useState(null);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchSeller = async () => {
      if (!sellerId) return;
      try {
        const seller = await getVendorById(sellerId);
        if (mounted && seller) {
          setSellerName(seller.name || 'Seller');
        }
      } catch (err) {
        // ignore — ProductsList will handle empty state
        console.warn('Failed to fetch seller info', err);
      }
    };
    fetchSeller();
    return () => { mounted = false };
  }, [sellerId]);

  useEffect(() => {
    // When no sellerId we want to list all stores (vendors)
    let mounted = true;
    const fetchVendors = async () => {
      if (sellerId) return;
      try {
        const data = await getVendors();
        if (mounted) setVendors(data || []);
      } catch (err) {
        console.warn('Failed to fetch vendors', err);
      }
    };
    fetchVendors();
    return () => { mounted = false };
  }, [sellerId]);
  return (
    <>
      <Helmet>
        <title>{sellerId ? `${sellerName ? sellerName  : 'Store'} | SKN Bridge Trade` : 'Stores | SKN Bridge Trade'}</title>
        <meta name="description" content={sellerId ? 'Explore this seller store on SKN Bridge Trade.' : 'Browse all stores on SKN Bridge Trade.'} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              {sellerId ? (sellerName ? sellerName : 'Our Store') : 'Stores'}
            </h1>
            <p className="text-slate-600 text-lg sm:text-xl leading-relaxed">
              {sellerId ? 'Discover amazing products from our trusted sellers' : 'Browse all stores and discover sellers near you.'}
            </p>
          </motion.div>
          
          {!sellerId ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.length ? vendors.map((v, idx) => (
                  <VendorCard key={v.id} vendor={v} index={idx} />
                )) : (
                  <div className="col-span-full text-center text-slate-600 py-12">No stores found</div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <ProductsList sellerId={sellerId} />
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default StorePage;