import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const VendorCard = ({ vendor, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      <Link to={`/store/${vendor.id}`} className="block p-6">
        <div className="flex items-start space-x-4">
          <img
            src={vendor.avatar}
            alt={vendor.name}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {vendor.store_name}
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              by {vendor.name}
            </p>
            <p className="text-gray-600 line-clamp-2 mb-4">
              {vendor.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" />
                <span className="text-sm font-medium text-gray-900">{vendor.rating.toFixed(1)}</span>
              </div>
              <div className="text-sm text-gray-500">
                {vendor.total_products} products
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default VendorCard;