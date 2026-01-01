import React, { useState } from 'react';
    import { Outlet, useLocation } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { PayPalScriptProvider } from '@paypal/react-paypal-js';
    import ErrorBoundary from './ErrorBoundary';
    import { CartProvider } from '@/hooks/useCart';
    import { ThemeProvider } from '@/contexts/ThemeContext';
    import Header from '@/components/Header';
    import Footer from '@/components/Footer';
    import ShoppingCart from '@/components/ShoppingCart';

    function App() {
      const [isCartOpen, setIsCartOpen] = useState(false);
      const location = useLocation();

      const paypalOptions = {
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "AYN6jrGvJkzSYVtGAz_-k5ZhL7zRSEQPLp_qVcvJ_RBs8YqXQCWTXEQMX1xVW4gYSHMvq_IzF0WvKg9g",
        currency: "USD",
        intent: "capture",
        components: "buttons",
        // Enable only PayPal funding source
        "enable-funding": "paypal",
        "disable-funding": "paylater,card,credit",
        // Additional configuration for better integration
        "data-sdk-integration-source": "react-paypal-js",
      };

      return (
        <ErrorBoundary>
          <ThemeProvider>
            <PayPalScriptProvider options={paypalOptions}>
              <CartProvider>
                <div className="min-h-screen flex flex-col bg-slate-50">
              <Helmet>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
              </Helmet>
              
              <Header onCartClick={() => setIsCartOpen(true)} />
              <ShoppingCart isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />

              <main className="flex-grow">
                <Outlet />
              </main>

              <Footer />
                </div>
              </CartProvider>
            </PayPalScriptProvider>
          </ThemeProvider>
        </ErrorBoundary>
      );
    }

    export default App;