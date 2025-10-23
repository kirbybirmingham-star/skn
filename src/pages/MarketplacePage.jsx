import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ProductsList from '@/components/ProductsList';

const MarketplacePage = () => {
  // toast available for future notifications
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortOrder, setSortOrder] = useState('featured');
  const [filteredProducts, setFilteredProducts] = useState([]);

  const categories = ['All', 'Electronics', 'Furniture', 'Clothing', 'Sports', 'Books', 'Home & Garden'];
  const priceRanges = ['All', 'Under $50', '$50-$200', '$200-$500', 'Over $500'];
  
  // Mock rating data - in a real app, this would come from your backend
  const productRatings = {
    1: 4.5, 2: 3.8, 3: 4.2, 4: 4.7, 5: 4.0, 6: 4.3
  };

  const products = [
    // Sample product data
    { id: 1, name: 'Laptop', category: 'electronics', price: 899, seller: 'John\'s Electronics', location: 'New York', dateListed: '2023-10-01' },
    { id: 2, name: 'Sofa', category: 'furniture', price: 299, seller: 'Jane\'s Furniture', location: 'Los Angeles', dateListed: '2023-09-15' },
    { id: 3, name: 'T-shirt', category: 'clothing', price: 19.99, seller: 'Fashion Hub', location: 'Chicago', dateListed: '2023-10-05' },
    { id: 4, name: 'Basketball', category: 'sports', price: 29.99, seller: 'Sporty Goods', location: 'Houston', dateListed: '2023-08-20' },
    { id: 5, name: 'Gardening Set', category: 'home & garden', price: 49.99, seller: 'Garden Supplies Co.', location: 'Phoenix', dateListed: '2023-10-10' },
    { id: 6, name: 'Book: The Great Gatsby', category: 'books', price: 10.99, seller: 'Book Nook', location: 'Philadelphia', dateListed: '2023-09-25' },
  ];

  useEffect(() => {
    // Filter and sort products based on selected criteria
    let updatedProducts = [...products];

    // Filter by search query
    if (searchQuery) {
      updatedProducts = updatedProducts.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      updatedProducts = updatedProducts.filter((product) => 
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by price range
    if (priceRange !== 'all') {
      updatedProducts = updatedProducts.filter((product) => {
        if (priceRange === 'under $50') return product.price < 50;
        if (priceRange === '$50-$200') return product.price >= 50 && product.price <= 200;
        if (priceRange === '$200-$500') return product.price > 200 && product.price <= 500;
        if (priceRange === 'over $500') return product.price > 500;
        return true;
      });
    }

    // Sort products
    updatedProducts.sort((a, b) => {
      switch (sortOrder) {
        case 'asc':
          return a.price - b.price;
        case 'desc':
          return b.price - a.price;
        case 'newest':
          return new Date(b.dateListed) - new Date(a.dateListed);
        case 'rating':
          return (productRatings[b.id] || 0) - (productRatings[a.id] || 0);
        case 'featured':
        default:
          // For featured, we'll combine rating and recency
          const aScore = (productRatings[a.id] || 0) * 2 + (new Date(a.dateListed).getTime() / 1000000000);
          const bScore = (productRatings[b.id] || 0) * 2 + (new Date(b.dateListed).getTime() / 1000000000);
          return bScore - aScore;
      }
    });

    setFilteredProducts(updatedProducts);
  }, [searchQuery, selectedCategory, priceRange, sortOrder]);

  return (
    <>
      <Helmet>
        <title>Marketplace - Browse Local Listings | SKN Bridge Trade</title>
        <meta name="description" content="Browse thousands of verified listings from local sellers. Find great deals on electronics, furniture, clothing, and more in your community." />
      </Helmet>

      <div className="min-h-screen bg-gray-100 py-4">
        <div className="container mx-auto px-4">
          {/* Top Search Bar */}
          <div className="bg-blue-600 -mx-4 px-4 py-3 mb-4 sticky top-0 z-10">
            <div className="flex gap-4 items-center max-w-6xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto flex gap-6">
            {/* Left Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h2 className="font-bold text-lg mb-4">Department</h2>
                <ul className="space-y-2">
                  {categories.map((cat) => (
                    <li key={cat}>
                      <button
                        onClick={() => setSelectedCategory(cat.toLowerCase())}
                        className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${
                          selectedCategory === cat.toLowerCase() ? 'text-blue-600 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="border-t my-4"></div>

                <h2 className="font-bold text-lg mb-4">Price</h2>
                <ul className="space-y-2">
                  {priceRanges.map((range) => (
                    <li key={range}>
                      <button
                        onClick={() => setPriceRange(range.toLowerCase())}
                        className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${
                          priceRange === range.toLowerCase() ? 'text-blue-600 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {range}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="border-t my-4"></div>

                <h2 className="font-bold text-lg mb-4">Sort By</h2>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="asc">Price: Low to High</option>
                  <option value="desc">Price: High to Low</option>
                  <option value="rating">Avg. Customer Review</option>
                </select>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                  {selectedCategory === 'all' ? 'All Products' : categories.find(cat => cat.toLowerCase() === selectedCategory)}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredProducts.length} results
                </p>
              </div>
              
              <div>
                <ProductsList products={filteredProducts} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarketplacePage;