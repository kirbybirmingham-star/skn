import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductsList from '@/components/ProductsList';
import ProductCard from '@/components/ProductCard';
import { getCategories, getProducts } from '@/api/EcommerceApi';

const MarketplacePage = () => {
  // toast available for future notifications
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [priceRange, setPriceRange] = useState('all');
  const priceRanges = ['All', 'Under $50', '$50-$200', '$200-$500', 'Over $500'];
  const [featured, setFeatured] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showFloatingAd, setShowFloatingAd] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    const loadFeatured = async () => {
      try {
        const resp = await getProducts();
        if (!mounted) return;
        const items = (resp.products || []).slice(0, 3);
        setFeatured(items);
      } catch (err) {
        console.warn('Failed to load featured products', err);
      }
    };
    loadFeatured();
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    // Only show popup/floating ad once per user (per browser) to avoid spamming.
    try {
      const popupShown = localStorage.getItem('marketplace_popup_shown');
      const floatingShown = localStorage.getItem('marketplace_floating_shown');

      let popupTimer, floatingTimer;
      if (!popupShown) popupTimer = setTimeout(() => setShowPopup(true), 5000);
      if (!floatingShown) floatingTimer = setTimeout(() => setShowFloatingAd(true), 8000);

      return () => {
        if (popupTimer) clearTimeout(popupTimer);
        if (floatingTimer) clearTimeout(floatingTimer);
      };
    } catch (e) {
      // If localStorage is unavailable, fall back to showing them once per page load
      const popupTimer = setTimeout(() => setShowPopup(true), 5000);
      const floatingTimer = setTimeout(() => setShowFloatingAd(true), 8000);
      return () => {
        clearTimeout(popupTimer);
        clearTimeout(floatingTimer);
      };
    }
  }, []);
  

  

  return (
    <>
      <Helmet>
        <title>Marketplace - Browse Local Listings | SKN Bridge Trade</title>
        <meta name="description" content="Browse thousands of verified listings from local sellers. Find great deals on electronics, furniture, clothing, and more in your community." />
      </Helmet>

      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
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

          {/* Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 max-w-7xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold">New Seller Weekend Sale!</h2>
                <p className="mt-2 text-lg opacity-90">Get up to 50% off on electronics, fashion & more</p>
                <div className="mt-4">
                  <button className="bg-white text-indigo-600 font-bold px-5 py-3 rounded-lg shadow">Shop Now →</button>
                </div>
              </div>
              <div className="hidden md:block w-1/3">
                {/* Decorative area or image */}
                <div className="w-full h-40 bg-white bg-opacity-10 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Search + Filters + Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Search bar */}
            <div className="lg:col-span-12">
              <div className="bg-white rounded-lg p-4 shadow sm:flex sm:items-center sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="mt-3 sm:mt-0">
                  <Button onClick={() => {}} className="bg-indigo-600">Search</Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-3 sticky top-28 self-start">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Filters</h3>
                  <button className="text-indigo-600 text-sm" onClick={() => { setSelectedCategory('all'); setSelectedCategoryId(null); setPriceRange('all'); setSearchQuery(''); }}>Clear</button>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCategory(val);
                      if (val === 'all') setSelectedCategoryId(null);
                      else {
                        const cat = categories.find(c => c.slug === val || c.name.toLowerCase() === val);
                        setSelectedCategoryId(cat ? cat.id : null);
                      }
                    }}
                    className="mt-2 w-full border rounded px-3 py-2"
                  >
                    <option value="all">All</option>
                    {categories.map(cat => <option key={cat.id} value={cat.slug || cat.name.toLowerCase()}>{cat.name}</option>)}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium">Price Range</label>
                  <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="mt-2 w-full border rounded px-3 py-2">
                    {priceRanges.map(range => <option key={range} value={range.toLowerCase()}>{range}</option>)}
                  </select>
                </div>

                <button className="apply-filters-btn w-full mt-2 bg-indigo-600 text-white py-2 rounded" onClick={() => { /* no-op, filters are live */ }}>Apply Filters</button>
              </div>
            </aside>

            {/* Main products column */}
            <main className="lg:col-span-9">
              {/* Featured items */}
              {featured && featured.length > 0 && (
                <section className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">⭐ Featured Items</h2>
                    <a className="text-indigo-600 font-medium" href="#">View All →</a>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featured.map((p, i) => (
                      <ProductCard key={p.id} product={{ ...p, variants: p.variants || p.product_variants || [] }} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* All items list */}
              <section>
                <h3 className="text-xl font-semibold mb-4">All Items</h3>
                <ProductsList categoryId={selectedCategoryId} searchQuery={searchQuery} priceRange={priceRange} />
              </section>
            </main>
          </div>
        </div>
      </div>
      {showFloatingAd && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg p-4 w-80 z-50">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold">🎁 Flash Deal!</h4>
              <p className="text-sm text-slate-600">Limited time: 30% off electronics</p>
            </div>
            <button className="ml-4 text-slate-400" onClick={() => { setShowFloatingAd(false); try { localStorage.setItem('marketplace_floating_shown', '1'); } catch (e) {} }}>✕</button>
          </div>
          <div className="mt-3 text-right">
            <button className="bg-indigo-600 text-white px-3 py-2 rounded" onClick={() => { try { localStorage.setItem('marketplace_floating_shown', '1'); } catch (e) {} /* navigate to promos */ window.location.href = '/promos'; }}>Claim</button>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button className="absolute top-3 right-3 text-slate-500" onClick={() => { setShowPopup(false); try { localStorage.setItem('marketplace_popup_shown', '1'); } catch (e) {} }}>✕</button>
            <h3 className="text-xl font-bold">🔥 Limited Time Offer!</h3>
            <p className="mt-2 text-slate-600">Sign up today and get $20 off your first purchase.</p>
            <div className="mt-4">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded" onClick={() => { try { localStorage.setItem('marketplace_popup_shown', '1'); } catch (e) {} window.location.href = '/signup'; setShowPopup(false); }}>Claim My Discount</button>
              <button className="ml-3 text-slate-500" onClick={() => { setShowPopup(false); try { localStorage.setItem('marketplace_popup_shown', '1'); } catch (e) {} }}>No thanks</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MarketplacePage;