import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { DollarSign, Users, Shield, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const BecomeSellerPage = () => {
  const { toast } = useToast();

  const handleSignUpClick = () => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>Become a Seller - Start Selling Today | SKN Bridge Trade</title>
        <meta name="description" content="Join SKN Bridge Trade as a verified seller. Low commissions, verified buyers, and a supportive local community. Start selling today!" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl"></div>
            </div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center text-white max-w-4xl mx-auto"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Start Selling on SKN Bridge Trade
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Join our community of verified sellers and reach thousands of local buyers
              </p>
              <Button
                size="lg"
                onClick={handleSignUpClick}
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 rounded-full shadow-2xl"
              >
                Sign Up to Sell <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Why Sell With Us?
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                {
                  title: "Low Commissions",
                  description: "Keep more of your earnings with our competitive commission rates starting at just 5%.",
                  icon: DollarSign,
                  gradient: "from-green-400 to-emerald-600",
                },
                {
                  title: "Verified Buyers",
                  description: "All buyers go through our verification process, ensuring safe and reliable transactions.",
                  icon: Shield,
                  gradient: "from-blue-400 to-indigo-600",
                },
                {
                  title: "Local Community",
                  description: "Connect with buyers in your area and build lasting relationships in your community.",
                  icon: Users,
                  gradient: "from-purple-400 to-pink-600",
                },
                {
                  title: "Grow Your Business",
                  description: "Access tools and insights to help you optimize listings and increase sales.",
                  icon: TrendingUp,
                  gradient: "from-orange-400 to-red-600",
                },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${benefit.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800 text-center">{benefit.title}</h3>
                  <p className="text-slate-600 text-center">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Commission Structure
              </h2>
              <p className="text-slate-600 text-lg">Transparent pricing that grows with you</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  tier: "Starter",
                  commission: "8%",
                  sales: "0-50 sales/month",
                  features: ["Basic seller dashboard", "Standard support", "Payment processing"],
                },
                {
                  tier: "Professional",
                  commission: "6%",
                  sales: "51-200 sales/month",
                  features: ["Advanced analytics", "Priority support", "Featured listings", "Promotional tools"],
                  popular: true,
                },
                {
                  tier: "Enterprise",
                  commission: "5%",
                  sales: "200+ sales/month",
                  features: ["Dedicated account manager", "Custom integrations", "API access", "Premium placement"],
                },
              ].map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`bg-gradient-to-br ${plan.popular ? 'from-blue-50 to-indigo-50 border-2 border-blue-500' : 'from-slate-50 to-blue-50 border border-slate-200'} rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all relative`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2 text-slate-800">{plan.tier}</h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-blue-600">{plan.commission}</span>
                    <span className="text-slate-600 ml-2">commission</span>
                  </div>
                  <p className="text-slate-600 mb-6">{plan.sales}</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Getting Started is Easy
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-6">
              {[
                {
                  step: "1",
                  title: "Complete Verification",
                  description: "Sign up and verify your identity through our secure process. This typically takes 24-48 hours.",
                },
                {
                  step: "2",
                  title: "Create Your First Listing",
                  description: "Add high-quality photos, write detailed descriptions, and set competitive prices for your items.",
                },
                {
                  step: "3",
                  title: "Start Selling",
                  description: "Once approved, your listings go live and you can start connecting with verified buyers in your area.",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 flex gap-6"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-bold text-white">{step.step}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-slate-800">{step.title}</h3>
                    <p className="text-slate-600">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl"></div>
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
                Ready to Start Selling?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Join our community of successful sellers and start earning today
              </p>
              <Button
                size="lg"
                onClick={handleSignUpClick}
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 rounded-full shadow-2xl"
              >
                Create Seller Account <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default BecomeSellerPage;