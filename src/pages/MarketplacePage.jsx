import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { QuickLinks } from '@/components/ui/quick-links';
import { Carousel, CarouselItem } from '@/components/ui/carousel';
import ProductsList from '@/components/ProductsList';
import ProductCard from '@/components/ProductCard';
import VendorCard from '@/components/VendorCard';
import { getCategories, getProducts, getVendors } from '@/api/EcommerceApi';

const MarketplacePage = () => {
   // Filter configuration
   const priceRanges = [
     { label: 'All', value: 'all' },
     { label: 'Under $50', value: 'under-50' },
     { label: '$50-$200', value: '50-200' },
     { label: '$200-$500', value: '200-500' },
     { label: 'Over $500', value: 'over-500' }
   ];
   
   const sortOptions = [
     { value: 'newest', label: 'Newest First' },
     { value: 'price-low', label: 'Price: Low to High' },
     { value: 'price-high', label: 'Price: High to Low' },
     { value: 'rating', label: 'Highest Rated' },
     { value: 'popular', label: 'Most Popular' }
   ];

   // Icon mapping for categories
   const categoryIcons = {
     'electronics': '🔌',
     'gadgets': '🔌',
     'tech': '🔌',
     'clothing': '👕',
     'fashion': '👗',
     'apparel': '👔',
     'home': '🏠',
     'garden': '🌿',
     'home-garden': '🏠',
     'furniture': '🪑',
     'books': '📚',
     'toys': '🧸',
     'sports': '⚽',
     'beauty': '💄',
     'groceries': '🛒',
     'default': '🛍️'
   };

   // Helper to get icon for category
   const getCategoryIcon = (categoryName) => {
     if (!categoryName) return categoryIcons.default;
     const normalized = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '');
     for (const [key, icon] of Object.entries(categoryIcons)) {
       if (normalized.includes(key)) return icon;
     }
     return categoryIcons.default;
   };

   // Helper to generate quick links from categories and filters
   const generateQuickLinks = (cats) => {
     if (!Array.isArray(cats) || cats.length === 0) return [];
     
     const categoryLinks = cats.map(cat => ({
       href: `/marketplace?category=${cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}`,
       icon: getCategoryIcon(cat.name),
       label: cat.name,
       description: cat.description || 'Browse category'
     }));

     // Add special filter links
     const specialLinks = [
       { 
         href: '/marketplace?sort=rating', 
         icon: '⭐', 
         label: 'Top Rated', 
         description: 'Highest Reviews' 
       },
       { 
         href: '/marketplace?sort=newest', 
         icon: '🆕', 
         label: 'New Arrivals', 
         description: 'Latest Products' 
       },
       { 
         href: '/marketplace?price=under-50', 
         icon: '💰', 
         label: 'Under $50', 
         description: 'Budget Friendly' 
       }
     ];

     // Combine and limit total links to 8 for sidebar display
     return [...categoryLinks.slice(0, 5), ...specialLinks];
   };

   // State management
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedCategory, setSelectedCategory] = useState('all');
   const [categories, setCategories] = useState([]);
   const [selectedCategoryId, setSelectedCategoryId] = useState(null);
   const [priceRange, setPriceRange] = useState('all');
   const [sortBy, setSortBy] = useState('newest');
   const [viewMode, setViewMode] = useState('grid');
   const [showFilters, setShowFilters] = useState(false);
   const [featured, setFeatured] = useState([]);
   const [vendors, setVendors] = useState([]);
   const [showPopup, setShowPopup] = useState(false);
   const [showFloatingAd, setShowFloatingAd] = useState(false);
   const [suggestedSearches, setSuggestedSearches] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const cats = await getCategories();
        if (!mounted) return;
        console.log('📦 MarketplacePage: Categories loaded:', cats?.length, 'items', cats);
        setCategories(cats || []);
        // Generate comprehensive suggested searches from categories, brands, and popular terms
        const categorySuggestions = (cats || []).map(cat => ({
          label: cat.name,
          value: cat.name.toLowerCase(),
          type: 'category'
        }));

        // Add popular search terms
        const popularSuggestions = [
          { label: 'Electronics', value: 'electronics', type: 'popular' },
          { label: 'Clothing', value: 'clothing', type: 'popular' },
          { label: 'Home & Garden', value: 'home-garden', type: 'popular' },
          { label: 'Under $50', value: 'under-50', type: 'price' },
          { label: 'Free Shipping', value: 'free-shipping', type: 'feature' },
        ];

        // Combine and limit suggestions
        const suggestions = [...popularSuggestions, ...categorySuggestions].slice(0, 10);
        setSuggestedSearches(suggestions);
      } catch (err) {
        console.warn('Failed to load categories', err);
        // Fallback suggestions
        setSuggestedSearches([
          { label: 'Electronics', value: 'electronics', type: 'popular' },
          { label: 'Clothing', value: 'clothing', type: 'popular' },
          { label: 'Home & Garden', value: 'home-garden', type: 'popular' },
        ]);
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
    let mounted = true;
    const loadVendors = async () => {
      try {
        console.log('Loading vendors for marketplace...');
        const data = await getVendors();
        console.log('Vendors loaded:', data);
        console.log('Vendors array length:', data && data.length);
        console.log('Vendors data type:', typeof data);
        if (mounted) {
          setVendors(data || []);
          console.log('Vendors state set:', data || []);
        }
      } catch (err) {
        console.error('Failed to load vendors:', err);
        console.error('Error details:', err.message, err.stack);
      }
    };
    loadVendors();
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

      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Breadcrumb items={[{ label: 'Marketplace', href: '/marketplace' }]} />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Marketplace
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">Discover amazing deals from verified local sellers</p>
          </motion.div>

          {/* Featured Items Carousel */}
          {featured && featured.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold">⭐ Featured Items</h2>
                <a className="text-primary font-medium text-sm sm:text-base hover:underline" href="#all-items">View All →</a>
              </div>
              <Carousel
                itemsPerView={3}
                autoPlay={true}
                autoPlayInterval={6000}
                className="gap-4"
                showDots={true}
                showArrows={true}
                infinite={true}
              >
                {featured.map((product, i) => (
                  <CarouselItem key={product.id}>
                    <ProductCard product={product} index={i} />
                  </CarouselItem>
                ))}
              </Carousel>
            </section>
          )}

          {/* Featured Vendors Carousel */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">🏪 Featured Vendors</h2>
              <a className="text-primary font-medium text-sm sm:text-base hover:underline" href="/store">View All Stores →</a>
            </div>
            {vendors && vendors.length > 0 ? (
              <Carousel
                itemsPerView={1}
                autoPlay={true}
                autoPlayInterval={4000}
                showDots={false}
                showArrows={true}
                infinite={true}
              >
                {vendors.slice(0, 4).map((vendor, i) => (
                  <CarouselItem key={vendor.id}>
                    <div className="flex justify-center max-w-md mx-auto">
                      <VendorCard vendor={vendor} index={i} />
                    </div>
                  </CarouselItem>
                ))}
              </Carousel>
            ) : (
              <div className="text-center py-8 bg-muted rounded-lg">
                <p className="text-muted-foreground">Loading vendors...</p>
              </div>
            )}
          </section>

          {/* Banner */}
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-4 sm:p-6 lg:p-8 text-white mb-8 shadow-lg">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 max-w-7xl mx-auto">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold">New Seller Weekend Sale!</h2>
                <p className="mt-2 text-base sm:text-lg opacity-90">Get up to 50% off on electronics, fashion & more</p>
                <div className="mt-4">
                  <button className="bg-white text-primary font-bold px-4 py-2 sm:px-5 sm:py-3 rounded-lg shadow hover:bg-gray-50 transition-colors">
                    Shop Now →
                  </button>
                </div>
              </div>
              <div className="hidden lg:block w-1/3">
                {/* Decorative area or image */}
                <div className="w-full h-32 sm:h-40 bg-white bg-opacity-10 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Enhanced Search + Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Search bar */}
            <div className="lg:col-span-12">
              <div className="bg-card rounded-lg p-6 shadow border space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <label htmlFor="search-input" className="sr-only">Search products</label>
                    <Autocomplete
                      id="search-input"
                      options={suggestedSearches}
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSelect={(option) => {
                        if (option.type === 'category') {
                          const cat = categories.find(c => c.name.toLowerCase() === option.value);
                          if (cat) {
                            setSelectedCategory(cat.slug || cat.name.toLowerCase());
                            setSelectedCategoryId(cat.id);
                            setPriceRange('all'); // Reset price when selecting category
                          }
                        } else if (option.type === 'price') {
                          setPriceRange(option.value);
                        }
                        setSearchQuery(option.label);
                      }}
                      placeholder="Search for items, categories, or brands..."
                      className="w-full"
                      loading={false}
                      showSuggestions={true}
                      maxSuggestions={10}
                      highlightMatches={true}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 relative"
                      aria-expanded={showFilters}
                      aria-controls="advanced-filters"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span className="hidden sm:inline">Filters</span>
                      <span className="sm:hidden">Filter</span>
                      {(selectedCategory !== 'all' || priceRange !== 'all' || sortBy !== 'newest') && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          !
                        </span>
                      )}
                    </Button>
                    <div className="flex border rounded-lg">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-r-none"
                        title="Grid View"
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-l-none"
                        title="List View"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t pt-4 mt-4"
                    id="advanced-filters"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Sort by</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        >
                          {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Category</label>
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
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        >
                          <option value="all">All Categories</option>
                          {categories.map(cat => <option key={cat.id} value={cat.slug || cat.name.toLowerCase()}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Price Range</label>
                        <select
                          value={priceRange}
                          onChange={(e) => setPriceRange(e.target.value)}
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        >
                          {priceRanges.map(range => (
                            <option key={range.value} value={range.value}>{range.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Sidebar - Hidden on mobile, shown as drawer */}
            <aside className="hidden lg:block lg:col-span-3 sticky top-28 self-start space-y-4">
              <div className="bg-card rounded-lg p-4 shadow border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Active Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedCategoryId(null);
                      setPriceRange('all');
                      setSearchQuery('');
                      setSortBy('newest');
                    }}
                    className="text-primary text-sm h-auto p-1"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="sidebar-sort" className="text-sm font-medium text-foreground">Sort by</label>
                      <select
                        id="sidebar-sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="mt-2 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      >
                        {sortOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="sidebar-category" className="text-sm font-medium text-foreground">Category</label>
                      <select
                        id="sidebar-category"
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
                        className="mt-2 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      >
                        <option value="all">All Categories</option>
                        {categories.map(cat => <option key={cat.id} value={cat.slug || cat.name.toLowerCase()}>{cat.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="sidebar-price" className="text-sm font-medium text-foreground">Price Range</label>
                      <select
                        id="sidebar-price"
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                        className="mt-2 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      >
                        {priceRanges.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <QuickLinks
                links={generateQuickLinks(categories)}
              />
            </aside>

            {/* Mobile Filter Drawer */}
            <div className="lg:hidden">
              {/* Mobile filter trigger button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full mb-4"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters & Quick Links
                {(selectedCategory !== 'all' || priceRange !== 'all' || sortBy !== 'newest') && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </Button>

              {/* Mobile drawer */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-card rounded-lg p-4 shadow border mb-4"
                >
                  <div className="space-y-6">
                    {/* Active Filters Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Active Filters</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory('all');
                            setSelectedCategoryId(null);
                            setPriceRange('all');
                            setSearchQuery('');
                            setSortBy('newest');
                          }}
                          className="text-primary text-sm h-auto p-1"
                        >
                          Clear All
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="mobile-sort" className="text-sm font-medium text-foreground">Sort by</label>
                          <select
                            id="mobile-sort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                          className="mt-2 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          >
                            {sortOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="mobile-category" className="text-sm font-medium text-foreground">Category</label>
                          <select
                            id="mobile-category"
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
                          className="mt-2 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          >
                            <option value="all">All Categories</option>
                            {categories.map(cat => <option key={cat.id} value={cat.slug || cat.name.toLowerCase()}>{cat.name}</option>)}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="mobile-price" className="text-sm font-medium text-foreground">Price Range</label>
                          <select
                            id="mobile-price"
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                          className="mt-2 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          >
                            {priceRanges.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Quick Links Section */}
                    <QuickLinks
                      links={generateQuickLinks(categories)}
                      title="Quick Links"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Main products column */}
            <main className="lg:col-span-9 w-full">
              {/* All items list */}
              <section id="all-items">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    All Items
                    {selectedCategory !== 'all' && (
                      <span className="text-muted-foreground ml-2">
                        in {categories.find(c => (c.slug || c.name.toLowerCase()) === selectedCategory)?.name}
                      </span>
                    )}
                  </h3>
                  {sortBy !== 'newest' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <SortAsc className="w-4 h-4" />
                      Sorted by {sortOptions.find(s => s.value === sortBy)?.label}
                    </div>
                  )}
                </div>
                <ProductsList
                  categoryId={selectedCategoryId}
                  searchQuery={searchQuery}
                  priceRange={priceRange}
                  sortBy={sortBy}
                  viewMode={viewMode}
                />
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
              <p className="text-sm text-muted-foreground">Limited time: 30% off electronics</p>
            </div>
            <button className="ml-4 text-muted-foreground" onClick={() => { setShowFloatingAd(false); try { localStorage.setItem('marketplace_floating_shown', '1'); } catch (e) {} }}>✕</button>
          </div>
          <div className="mt-3 text-right">
            <button className="bg-primary text-white px-3 py-2 rounded" onClick={() => { try { localStorage.setItem('marketplace_floating_shown', '1'); } catch (e) {} /* navigate to promos */ window.location.href = '/promos'; }}>Claim</button>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-card rounded-xl p-6 max-w-md w-full relative">
            <button className="absolute top-3 right-3 text-muted-foreground" onClick={() => { setShowPopup(false); try { localStorage.setItem('marketplace_popup_shown', '1'); } catch (e) {} }}>✕</button>
            <h3 className="text-xl font-bold">🔥 Limited Time Offer!</h3>
            <p className="mt-2 text-muted-foreground">Sign up today and get $20 off your first purchase.</p>
            <div className="mt-4">
              <button className="bg-primary text-white px-4 py-2 rounded" onClick={() => { try { localStorage.setItem('marketplace_popup_shown', '1'); } catch (e) {} window.location.href = '/signup'; setShowPopup(false); }}>Claim My Discount</button>
              <button className="ml-3 text-muted-foreground" onClick={() => { setShowPopup(false); try { localStorage.setItem('marketplace_popup_shown', '1'); } catch (e) {} }}>No thanks</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MarketplacePage;