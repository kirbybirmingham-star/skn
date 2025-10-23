import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click the 'Sign Up' button in the top right corner, fill in your details, and verify your email address. You'll then need to complete our verification process before you can start buying or selling.",
        },
        {
          q: "What is the verification process?",
          a: "Our verification process includes email confirmation, identity verification through secure document upload, and a manual review by our team. This typically takes 24-48 hours and ensures all users are authentic and trustworthy.",
        },
        {
          q: "Is SKN Bridge Trade free to use?",
          a: "Creating an account and browsing listings is completely free. Sellers pay a small commission (5-8%) on successful sales, and there are no fees for buyers.",
        },
      ],
    },
    {
      category: "For Buyers",
      questions: [
        {
          q: "How do I search for items?",
          a: "Use the search bar on the Marketplace page to find specific items. You can also filter by category, price range, and location to narrow down your results.",
        },
        {
          q: "Is my payment information secure?",
          a: "Yes! All payment information is encrypted using bank-level SSL security. We never store your full payment details on our servers.",
        },
        {
          q: "What if I receive an item that doesn't match the description?",
          a: "We offer buyer protection on all purchases. If an item doesn't match its description, contact our support team within 48 hours of delivery to initiate a dispute resolution process.",
        },
        {
          q: "Can I meet sellers in person?",
          a: "Yes, for local pickups, you can arrange to meet sellers in person. We recommend meeting in public places and bringing a friend for added safety.",
        },
      ],
    },
    {
      category: "For Sellers",
      questions: [
        {
          q: "How do I create a listing?",
          a: "After your account is verified, go to your dashboard and click 'Create Listing.' Add high-quality photos, write a detailed description, set your price, and publish. Your listing will go live immediately.",
        },
        {
          q: "What are the commission rates?",
          a: "Commission rates range from 5-8% depending on your sales volume. Starter sellers (0-50 sales/month) pay 8%, Professional sellers (51-200 sales/month) pay 6%, and Enterprise sellers (200+ sales/month) pay 5%.",
        },
        {
          q: "When do I receive payment?",
          a: "Payments are released to your account 24 hours after the buyer confirms receipt of the item. You can then transfer funds to your bank account at any time.",
        },
        {
          q: "Can I edit my listings after publishing?",
          a: "Yes, you can edit your listings at any time from your seller dashboard. Changes take effect immediately.",
        },
      ],
    },
    {
      category: "Safety & Security",
      questions: [
        {
          q: "How do you verify users?",
          a: "We verify users through email confirmation, government-issued ID verification, and manual review by our team. This multi-step process ensures all users are authentic.",
        },
        {
          q: "What should I do if I suspect fraud?",
          a: "Report any suspicious activity immediately through your account dashboard or contact our support team. We take fraud very seriously and investigate all reports promptly.",
        },
        {
          q: "How does the dispute resolution process work?",
          a: "If you have an issue with a transaction, contact our support team with details. We'll review evidence from both parties and work to find a fair resolution within 5-7 business days.",
        },
      ],
    },
    {
      category: "Shipping & Delivery",
      questions: [
        {
          q: "Do you offer shipping?",
          a: "Sellers can choose to offer shipping or local pickup only. Shipping costs and methods are determined by individual sellers.",
        },
        {
          q: "How do I track my order?",
          a: "If the seller provides a tracking number, you'll receive it via email and can track your order through your account dashboard.",
        },
      ],
    },
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Helmet>
        <title>FAQ - Frequently Asked Questions | SKN Bridge Trade</title>
        <meta name="description" content="Find answers to common questions about buying, selling, verification, payments, and safety on SKN Bridge Trade marketplace." />
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
                Frequently Asked Questions
              </h1>
              <p className="text-xl md:text-2xl text-blue-100">
                Find answers to common questions about using SKN Bridge Trade
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-12">
              {faqs.map((category, categoryIndex) => (
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                >
                  <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {category.category}
                  </h2>
                  <div className="space-y-4">
                    {category.questions.map((faq, questionIndex) => {
                      const index = `${categoryIndex}-${questionIndex}`;
                      const isOpen = openIndex === index;

                      return (
                        <div
                          key={questionIndex}
                          className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden"
                        >
                          <button
                            onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                          >
                            <span className="text-lg font-semibold text-slate-800 pr-4">
                              {faq.q}
                            </span>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ChevronDown className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            </motion.div>
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="px-6 pb-4 text-slate-600 leading-relaxed">
                                  {faq.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto mt-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 border-2 border-blue-200 text-center"
            >
              <h2 className="text-3xl font-bold mb-4 text-slate-800">
                Still Have Questions?
              </h2>
              <p className="text-slate-700 text-lg mb-6">
                Can't find the answer you're looking for? Our support team is here to help!
              </p>
              <p className="text-slate-600">
                Contact us at <span className="font-semibold text-blue-600">support@sknbridgetrade.com</span>
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default FAQPage;