import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const VendorCard = ({ vendor, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      <Link to={`/store/${vendor.id}`} className="block">
        {vendor.featured_product?.image && (
          <div className="relative h-48 overflow-hidden rounded-t-xl">
            <img
              src={vendor.featured_product.image}
              alt={vendor.featured_product.title}
              className="w-full h-full object-cover"
            />
            {vendor.featured_product.price && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                From {vendor.featured_product.price}
              </div>
            )}
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <img
              src={vendor.avatar}
              alt={vendor.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-md"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {vendor.store_name}
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                by {vendor.name}
              </p>
              <p className="text-gray-600 line-clamp-2 mb-3">
                {vendor.description}
              </p>
              {vendor.categories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {vendor.categories.slice(0, 3).map((category) => (
                    <span key={category} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Tag className="w-3 h-3 mr-1" />
                      {category}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" />
                  <span className="text-sm font-medium text-gray-900">{vendor.rating ? vendor.rating.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {vendor.total_products} products
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default VendorCard;