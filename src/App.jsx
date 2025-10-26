import React, { useState } from 'react';
    import { Outlet, useLocation } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { PayPalScriptProvider } from '@paypal/react-paypal-js';
    import ErrorBoundary from './ErrorBoundary';
    import { CartProvider } from '@/hooks/useCart';
    import Header from '@/components/Header';
    import Footer from '@/components/Footer';
    import ShoppingCart from '@/components/ShoppingCart';

    function App() {
      const [isCartOpen, setIsCartOpen] = useState(false);
      const location = useLocation();

      const paypalOptions = {
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
        components: "buttons",
        // Enable only PayPal funding source
        "enable-funding": "paypal",
        "disable-funding": "paylater,card,credit",
        // Additional configuration for better integration
        "data-namespace": "PayPalSDK",
        "data-sdk-integration-source": "button-factory",
        // Set button customization defaults
        "button-layout": "vertical",
        "button-color": "gold",
        "button-shape": "rect",
      };

      return (
        <ErrorBoundary>
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
        </ErrorBoundary>
      );
    }

    export default App;