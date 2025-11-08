import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductsList from '@/components/ProductsList';
import { getCategories } from '@/api/EcommerceApi';

const MarketplacePage = () => {
  // toast available for future notifications
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [priceRange, setPriceRange] = useState('all');
  const priceRanges = ['All', 'Under $50', '$50-$200', '$200-$500', 'Over $500'];

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const cats = await getCategories();
        if (!mounted) return;
        setCategories(cats || []);
      } catch (err) {
        console.warn('Failed to load categories', err);
      }
    };
    fetch();
    return () => { mounted = false };
  }, []);
  const priceRanges = ['All', 'Under $50', '$50-$200', '$200-$500', 'Over $500'];

  

  return (
    <>
      <Helmet>
        <title>Marketplace - Browse Local Listings | SKN Bridge Trade</title>
        <meta name="description" content="Browse thousands of verified listings from local sellers. Find great deals on electronics, furniture, clothing, and more in your community." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Marketplace
            </h1>
            <p className="text-slate-600 text-lg">Discover amazing deals from verified local sellers</p>
          </motion.div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCategory(val);
                    if (val === 'all') {
                      setSelectedCategoryId(null);
                    } else {
                      const cat = categories.find(c => c.slug === val || c.name.toLowerCase() === val);
                      setSelectedCategoryId(cat ? cat.id : null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option key="all" value="all">All</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug || cat.name.toLowerCase()}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Price Range</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priceRanges.map((range) => (
                    <option key={range} value={range.toLowerCase()}>{range}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <ProductsList
              categoryId={selectedCategoryId}
              searchQuery={searchQuery}
              priceRange={priceRange}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MarketplacePage;