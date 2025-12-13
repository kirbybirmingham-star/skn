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
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const priceRanges = [
    { label: 'All', value: 'all' },
    { label: 'Under $50', value: 'under-50' },
    { label: '$50-$200', value: '50-200' },
    { label: '$200-$500', value: '200-500' },
    { label: 'Over $500', value: 'over-500' },
  ];
  const [featured, setFeatured] = useState([]);
  // Live filters (no apply button) — we pass these directly to ProductsList
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
        let items = (resp.products || []).slice(0, 3);
        
        // Compute __effective_price for featured products (same normalization as ProductsList)
        const normalizeToCents = (val) => {
          if (val == null) return 0;
          const n = Number(val);
          if (!Number.isFinite(n)) return 0;
          return Number.isInteger(n) ? Math.round(n) : Math.round(n * 100);
        };
        items = items.map(p => {
          const base = normalizeToCents(p.base_price ?? p.base_price_in_cents ?? 0);
          let minVariant = null;
          if (Array.isArray(p.product_variants) && p.product_variants.length > 0) {
            for (const v of p.product_variants) {
              if (!v) continue;
              const vpRaw = v?.price_in_cents ?? v?.price ?? v?.price_cents ?? 0;
              const vPrice = normalizeToCents(vpRaw);
              if (vPrice > 0 && (minVariant === null || vPrice < minVariant)) minVariant = vPrice;
            }
          }
          const effective = (minVariant !== null && minVariant > 0) ? minVariant : base;
          return { ...p, __effective_price: Number(effective || 0) };
        });
        
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
                  <Button onClick={() => { /* filters are live; Search button is a convenience */ }} className="bg-indigo-600">Search</Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-3 sticky top-28 self-start">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Filters</h3>
                  <button className="text-indigo-600 text-sm" onClick={() => { setSelectedCategory('all'); setSelectedCategoryId(null); setPriceRange('all'); setSearchQuery(''); setSortBy('newest'); }}>Clear</button>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCategory(val);
                      if (val === 'all') {
                        setSelectedCategoryId(null);
                        setSelectedCategorySlug(null);
                      } else {
                        // If the option value is an id (UUID), set the category id
                        const catById = categories.find(c => String(c.id) === String(val));
                        if (catById) {
                          // If the returned id looks like a UUID, treat it as a DB id; otherwise it's likely a slug
                          const idStr = String(catById.id);
                          const looksLikeUUID = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(idStr);
                          if (looksLikeUUID) {
                            setSelectedCategoryId(catById.id);
                            setSelectedCategorySlug(catById.slug || String(catById.name).toLowerCase());
                          } else {
                            setSelectedCategoryId(null);
                            setSelectedCategorySlug(idStr);
                          }
                        } else {
                          const cat = categories.find(c => c.slug === val || String(c.name).toLowerCase() === String(val));
                          if (cat) {
                            const idStr = String(cat.id);
                            const looksLikeUUID = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(idStr);
                            if (looksLikeUUID) {
                              setSelectedCategoryId(cat.id);
                              setSelectedCategorySlug(cat.slug || String(cat.name).toLowerCase());
                            } else {
                              setSelectedCategoryId(null);
                              setSelectedCategorySlug(idStr);
                            }
                          } else {
                            setSelectedCategoryId(null);
                            setSelectedCategorySlug(val);
                          }
                        }
                      }
                    }}
                    className="mt-2 w-full border rounded px-3 py-2"
                  >
                    <option value="all">All</option>
                    {categories.map(cat => <option key={cat.id || cat.slug} value={(cat.id) ? String(cat.id) : (cat.slug || String(cat.name).toLowerCase())}>{cat.name}</option>)}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium">Price Range</label>
                  <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="mt-2 w-full border rounded px-3 py-2">
                    {priceRanges.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium">Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="mt-2 w-full border rounded px-3 py-2">
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price_asc">Price: Low → High</option>
                    <option value="price_desc">Price: High → Low</option>
                    <option value="rating_desc">Rating: High → Low</option>
                    <option value="rating_asc">Rating: Low → High</option>
                    <option value="title_asc">Title A → Z</option>
                    <option value="title_desc">Title Z → A</option>
                  </select>
                </div>
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
                      <ProductCard key={p.id} product={p} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* All items list */}
              <section>
                <h3 className="text-xl font-semibold mb-4">All Items</h3>
                <ProductsList categoryId={selectedCategoryId} categorySlug={selectedCategorySlug} searchQuery={searchQuery} priceRange={priceRange} sortBy={sortBy} />
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