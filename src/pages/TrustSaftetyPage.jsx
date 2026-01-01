import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Lock, UserCheck, AlertCircle, FileText } from 'lucide-react';

const TrustSafetyPage = () => {
  return (
    <>
      <Helmet>
        <title>Trust & Safety - Our Commitment to You | SKN Bridge Trade</title>
        <meta name="description" content="Learn about SKN Bridge Trade's comprehensive verification process, secure payment processing, and dispute resolution policies that keep our community safe." />
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
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Trust & Safety
              </h1>
              <p className="text-xl md:text-2xl text-blue-100">
                Your security is our top priority. Learn how we keep our community safe.
              </p>
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
                Our Verification Process
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                Every user on SKN Bridge Trade goes through a comprehensive verification process to ensure a safe and trustworthy community.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  title: "Email Verification",
                  description: "All users must verify their email address to activate their account and start using the platform.",
                  icon: CheckCircle,
                  gradient: "from-green-400 to-emerald-600",
                },
                {
                  title: "Identity Confirmation",
                  description: "We verify user identities through secure document verification to prevent fraud and ensure authenticity.",
                  icon: UserCheck,
                  gradient: "from-blue-400 to-indigo-600",
                },
                {
                  title: "Manual Review",
                  description: "Our team manually reviews each application to ensure compliance with our community standards.",
                  icon: FileText,
                  gradient: "from-purple-400 to-pink-600",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
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
                Secure Payment Processing
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                All transactions are processed through our secure payment system with industry-leading encryption.
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    title: "Encrypted Transactions",
                    description: "All payment information is encrypted using bank-level SSL security to protect your financial data.",
                    icon: Lock,
                  },
                  {
                    title: "Buyer Protection",
                    description: "Our buyer protection program ensures you receive your items as described or get your money back.",
                    icon: Shield,
                  },
                  {
                    title: "Secure Escrow",
                    description: "Payments are held in secure escrow until the buyer confirms receipt and satisfaction with the item.",
                    icon: CheckCircle,
                  },
                  {
                    title: "Fraud Prevention",
                    description: "Advanced fraud detection systems monitor all transactions to identify and prevent suspicious activity.",
                    icon: AlertCircle,
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 shadow-lg border border-slate-200"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-800">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
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
                Dispute Resolution
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                If issues arise, our dedicated support team is here to help resolve disputes fairly and quickly.
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-slate-200">
              <div className="space-y-8">
                {[
                  {
                    step: "1",
                    title: "Report the Issue",
                    description: "Contact our support team through your account dashboard with details about the dispute.",
                  },
                  {
                    step: "2",
                    title: "Investigation",
                    description: "Our team reviews all evidence, communications, and transaction details from both parties.",
                  },
                  {
                    step: "3",
                    title: "Mediation",
                    description: "We work with both parties to find a fair resolution that satisfies everyone involved.",
                  },
                  {
                    step: "4",
                    title: "Resolution",
                    description: "A final decision is made based on our policies and the evidence provided, typically within 5-7 business days.",
                  },
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-white">{step.step}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-slate-800">{step.title}</h3>
                      <p className="text-slate-600">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
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
              className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 border-2 border-blue-200"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800">
                  Your Safety is Our Mission
                </h2>
                <p className="text-slate-600 text-lg mb-6">
                  We continuously update our security measures and policies to ensure SKN Bridge Trade remains the safest marketplace for local commerce.
                </p>
                <p className="text-slate-700 font-semibold">
                  Questions about our safety policies? Contact our support team anytime.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default TrustSafetyPage;