import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Tag, MapPin, ShoppingBag, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const VendorCard = ({ vendor, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border"
    >
      <Link to={`/store/${vendor.id}`} className="block">
        {vendor.featured_product?.image ? (
          <div className="relative h-48 overflow-hidden rounded-t-xl">
            <img
              src={vendor.featured_product.image}
              alt={vendor.featured_product.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white text-sm font-medium truncate bg-black/50 px-2 py-1 rounded">
                Featured: {vendor.featured_product.title}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-t-xl flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-blue-300" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <img
                src={vendor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.store_name)}&background=3b82f6&color=fff&size=64`}
                alt={vendor.store_name}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-md"
              />
              {vendor.is_active && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 truncate">
                    {vendor.store_name}
                  </h2>
                  <p className="text-sm text-gray-500 truncate">
                    by {vendor.store_name !== vendor.name ? vendor.name : 'Store Owner'}
                  </p>
                </div>
                {vendor.website && (
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 ml-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {vendor.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {vendor.description}
                </p>
              )}

              {vendor.location && (
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <MapPin className="w-3 h-3 mr-1" />
                  St. Kitts/Nevis
                </div>
              )}

              {vendor.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {vendor.categories.slice(0, 3).map((category) => (
                    <span key={category} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Tag className="w-3 h-3 mr-1" />
                      {category}
                    </span>
                  ))}
                  {vendor.categories.length > 3 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{vendor.categories.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {vendor.rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" />
                      <span className="text-sm font-medium text-gray-900">{vendor.rating.toFixed(1)}</span>
                    </div>
                  )}
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