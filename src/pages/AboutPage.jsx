import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Heart, Users, TrendingUp, Award } from 'lucide-react';

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us - Our Mission & Story | SKN Bridge Trade</title>
        <meta name="description" content="Learn about SKN Bridge Trade's mission to empower local businesses and create a secure, reliable marketplace for our community." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700">
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
                About SKN Bridge Trade
              </h1>
              <p className="text-xl md:text-2xl text-blue-100">
                Empowering local communities through trusted commerce
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-slate-200 mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Our Mission
                </h2>
                <p className="text-slate-700 text-lg leading-relaxed mb-6">
                  At SKN Bridge Trade, we believe in the power of local communities. Our mission is to create a secure and reliable marketplace that connects verified buyers and sellers, fostering trust and enabling economic growth within neighborhoods.
                </p>
                <p className="text-slate-700 text-lg leading-relaxed mb-6">
                  We started with a simple observation: traditional online marketplaces often lack the personal touch and security that local commerce deserves. Too many people were hesitant to buy or sell locally due to concerns about safety, authenticity, and reliability.
                </p>
                <p className="text-slate-700 text-lg leading-relaxed">
                  That's why we built SKN Bridge Trade—a platform where every user is verified, every transaction is secure, and every interaction strengthens our local community. We're not just a marketplace; we're a movement to bring back the trust and connection that makes local commerce special.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
              >
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-200">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Our Vision</h3>
                  <p className="text-slate-700">
                    To become the most trusted local marketplace, where communities thrive through safe, transparent, and meaningful commerce.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg border border-purple-200">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Our Values</h3>
                  <p className="text-slate-700">
                    Trust, transparency, community, and security are at the heart of everything we do. We're committed to these principles in every decision we make.
                  </p>
                </div>
              </motion.div>
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
                Our Impact
              </h2>
              <p className="text-slate-600 text-lg">Making a difference in our community</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  number: "10,000+",
                  label: "Verified Users",
                  description: "Trusted community members",
                  icon: Users,
                  gradient: "from-blue-400 to-indigo-600",
                },
                {
                  number: "50,000+",
                  label: "Successful Transactions",
                  description: "Safe and secure deals",
                  icon: TrendingUp,
                  gradient: "from-green-400 to-emerald-600",
                },
                {
                  number: "98%",
                  label: "Satisfaction Rate",
                  description: "Happy buyers and sellers",
                  icon: Award,
                  gradient: "from-purple-400 to-pink-600",
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 shadow-lg border border-slate-200 text-center"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                  <h3 className="text-xl font-bold mb-2 text-slate-800">{stat.label}</h3>
                  <p className="text-slate-600">{stat.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-slate-200"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Join Our Journey
                </h2>
                <p className="text-slate-700 text-lg leading-relaxed mb-6">
                  We're just getting started, and we'd love for you to be part of our story. Whether you're a buyer looking for great local deals or a seller wanting to reach your community, SKN Bridge Trade is here to support you.
                </p>
                <p className="text-slate-700 text-lg leading-relaxed">
                  Together, we're building more than a marketplace—we're building a community where trust, safety, and local commerce thrive. Thank you for being part of this journey with us.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutPage;