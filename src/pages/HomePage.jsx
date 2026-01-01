import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, DollarSign, Users, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getProducts, formatCurrency } from '@/api/EcommerceApi';

const HomePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const { products } = await getProducts({ page: 1, perPage: 6 });

        // Transform products to match the expected format for the UI
        const transformedListings = products.slice(0, 3).map(product => ({
          id: product.id,
          title: product.title,
          price: formatCurrency(product.base_price || (product.product_variants?.[0]?.price || 0)),
          seller: "Verified Seller", // Since we don't have direct seller info, use generic
          rating: 4.5, // Default rating since we might not have ratings in the view
          image: product.image_url || (product.product_variants?.[0]?.images?.[0] || product.images?.[0] || product.gallery_images?.[0])
        }));

        setFeaturedListings(transformedListings);
      } catch (err) {
        console.error('Failed to fetch featured listings:', err);
        setError('Failed to load featured listings');
        // Fallback to static data if API fails
        setFeaturedListings([
          {
            id: 1,
            title: "Vintage Leather Sofa",
            price: "$450",
            seller: "John D.",
            rating: 4.8,
          },
          {
            id: 2,
            title: "Professional Camera Kit",
            price: "$1,200",
            seller: "Sarah M.",
            rating: 5.0,
          },
          {
            id: 3,
            title: "Mountain Bike",
            price: "$680",
            seller: "Mike R.",
            rating: 4.9,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedListings();
  }, []);

  const handleExploreClick = () => {
    navigate('/store');
  };

  const handleSignUpClick = () => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>SKN Bridge Trade - The Trusted Local Marketplace</title>
        <meta name="description" content="Connect with verified local buyers and sellers. SKN Bridge Trade is your trusted marketplace for secure transactions with low commissions and community support." />
      </Helmet>

      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white dark:bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300 dark:bg-pink-500/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              The Trusted Local Marketplace
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Connect with verified buyers and sellers in your community. Safe, secure, and simple.
            </p>
            <Button
              size="lg"
              onClick={handleExploreClick}
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 rounded-full shadow-2xl"
            >
              Start Exploring <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(248, 250, 252)"/>
          </svg>
        </div>
      </section>

      <section className="py-20 bg-muted/30 dark:bg-muted/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg">Three simple steps to start buying or selling</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Sign Up & Get Verified",
                description: "Create your account and complete our quick verification process to join our trusted community.",
                icon: Users,
              },
              {
                step: "2",
                title: "List or Find Items",
                description: "Browse thousands of listings or create your own. Our platform makes it easy to connect.",
                icon: Shield,
              },
              {
                step: "3",
                title: "Transact Securely",
                description: "Complete transactions with confidence using our secure payment system and buyer protection.",
                icon: CheckCircle,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow border border-slate-200"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold mb-3 text-card-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Featured Listings
            </h2>
            <p className="text-muted-foreground text-lg">Discover amazing deals from verified sellers</p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[...Array(3)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl overflow-hidden shadow-lg border border-slate-200"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-indigo-500 animate-pulse"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-300 rounded animate-pulse"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 w-20 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {featuredListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-slate-200 cursor-pointer"
                  onClick={() => navigate(`/product/${listing.id}`)}
                >
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    {listing.image ? (
                      <img alt={listing.title} className="w-full h-full object-cover" src={listing.image} />
                    ) : (
                      <img alt={listing.title} className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1635870224272-77fcf1f3dd1f" />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-card-foreground">{listing.title}</h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-primary">{listing.price}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-muted-foreground">{listing.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {listing.seller.charAt(0)}
                      </div>
                      <span>Sold by {listing.seller}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">No featured listings available at the moment.</p>
              <Button onClick={handleExploreClick}>
                Browse All Listings <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={handleExploreClick}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              View All Listings <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-background to-accent/20 dark:from-background dark:to-accent/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Why Choose Us?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Verified Users",
                description: "Every buyer and seller goes through our rigorous verification process to ensure a safe community.",
                icon: Shield,
                gradient: "from-green-400 to-emerald-600",
              },
              {
                title: "Low Commissions",
                description: "Keep more of your earnings with our competitive commission rates that support local commerce.",
                icon: DollarSign,
                gradient: "from-blue-400 to-indigo-600",
              },
              {
                title: "Support Local",
                description: "Connect with your neighbors and strengthen your local economy by buying and selling locally.",
                icon: Users,
                gradient: "from-purple-400 to-pink-600",
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${benefit.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-card-foreground">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white dark:bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-300 dark:bg-pink-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-white max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of verified buyers and sellers in your local community today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleSignUpClick}
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 rounded-full shadow-2xl"
              >
                Sign Up as Buyer
              </Button>
              <Button
                size="lg"
                onClick={() => navigate('/become-seller')}
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full"
              >
                Become a Seller
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;