import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import ProductsList from '@/components/ProductsList';

const StorePage = () => {
  const { sellerId } = useParams();
  return (
    <>
      <Helmet>
        <title>Store - Browse All Products | SKN Bridge Trade</title>
        <meta name="description" content="Explore the full collection of products available on SKN Bridge Trade. Find great deals from verified local sellers." />
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
              Our Store
            </h1>
            <p className="text-slate-600 text-lg sm:text-xl leading-relaxed">
              Discover amazing products from our trusted sellers
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <ProductsList sellerId={sellerId} />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default StorePage;