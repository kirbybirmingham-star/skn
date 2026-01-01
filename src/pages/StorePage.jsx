import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, Star, ShoppingBag, MapPin, ExternalLink } from 'lucide-react';
import ProductsList from '@/components/ProductsList';
import VendorCard from '@/components/VendorCard';
import { getProducts, getVendors, getVendorById } from '@/api/EcommerceApi';

const StorePage = () => {
  const { sellerId } = useParams();
  const [seller, setSeller] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter vendors based on search query
  const filteredVendors = vendors.filter(vendor =>
    vendor.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.categories?.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    let mounted = true;
    const fetchSeller = async () => {
      if (!sellerId) return;
      try {
        setLoading(true);
        const sellerData = await getVendorById(sellerId);
        if (mounted && sellerData) {
          setSeller(sellerData);
        }
      } catch (err) {
        console.warn('Failed to fetch seller info', err);
      } finally {
        if (mounted) setLoading(false);
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
        setLoading(true);
        const data = await getVendors();
        if (mounted) setVendors(data || []);
      } catch (err) {
        console.warn('Failed to fetch vendors', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchVendors();
    return () => { mounted = false };
  }, [sellerId]);
  return (
    <>
      <Helmet>
        <title>{sellerId ? `${seller?.business_name || seller?.name || 'Store'} | SKN Bridge Trade` : 'Stores | SKN Bridge Trade'}</title>
        <meta name="description" content={sellerId ? `Explore ${seller?.business_name || 'this seller'}'s store on SKN Bridge Trade.` : 'Browse all stores on SKN Bridge Trade.'} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <nav className="flex items-center space-x-2 text-sm text-slate-600">
              <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <span>/</span>
              {sellerId ? (
                <>
                  <Link to="/store" className="hover:text-blue-600 transition-colors">Stores</Link>
                  <span>/</span>
                  <span className="text-slate-900 font-medium">{seller?.business_name || seller?.name || 'Store'}</span>
                </>
              ) : (
                <span className="text-slate-900 font-medium">Stores</span>
              )}
            </nav>
          </motion.div>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            {sellerId ? (
              <>
                {/* Back to Stores Link */}
                <Link
                  to="/store"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to All Stores</span>
                </Link>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  {seller?.business_name || seller?.name || 'Our Store'}
                </h1>
                <p className="text-slate-600 text-lg sm:text-xl leading-relaxed">
                  Discover amazing products from our trusted sellers
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Stores
                </h1>
                <p className="text-slate-600 text-lg sm:text-xl leading-relaxed mb-8">
                  Browse all stores and discover sellers near you.
                </p>

                {/* Search Bar for Multi-Vendor View */}
                <div className="max-w-md mx-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search stores..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* Vendor Details Section for Individual Store */}
          {sellerId && seller && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-8 mb-12"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="flex-shrink-0">
                  <img
                    src={seller.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.business_name || seller.name)}&background=3b82f6&color=fff&size=120`}
                    alt={seller.business_name || seller.name}
                    className="w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                        {seller.business_name || seller.name}
                      </h2>
                      {seller.slug && (
                        <p className="text-slate-600">@{seller.slug}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-6 mt-4 sm:mt-0">
                      {seller.average_rating && (
                        <div className="flex items-center">
                          <Star className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" />
                          <span className="text-lg font-semibold text-gray-900">
                            {seller.average_rating.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {/* Removed product count display */}
                    </div>
                  </div>

                  {seller.description && (
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {seller.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    {seller.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        St. Kitts/Nevis
                      </div>
                    )}

                    {seller.website && (
                      <a
                        href={seller.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Visit Website
                      </a>
                    )}

                    {seller.categories && seller.categories.length > 0 && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Categories:</span>
                        <div className="flex flex-wrap gap-1">
                          {seller.categories.map((category, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Content Section */}
          {!sellerId ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-600">Loading stores...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVendors.length ? filteredVendors.map((v, idx) => (
                    <VendorCard key={v.id} vendor={v} index={idx} />
                  )) : (
                    <div className="col-span-full text-center text-slate-600 py-12">
                      {searchQuery ? 'No stores match your search.' : 'No stores found.'}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-600">Loading store...</p>
                  </div>
                </div>
              ) : (
                <ProductsList sellerId={sellerId} />
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default StorePage;