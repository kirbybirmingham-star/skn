'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/use-toast";
import { createPayPalOrder, capturePayPalOrder, createOrderFromPayPalPayment } from "../api/EcommerceApi";
import { useAuth } from "../contexts/SupabaseAuthContext";
import ErrorBoundary from "../ErrorBoundary";

// Constants for button styles
const PAYPAL_BUTTON_STYLES = {
  layout: 'vertical',
  color: 'gold',
  shape: 'rect',
  label: 'checkout',
  height: 50,
};

export default function PayPalCheckout({ cartItems, onSuccess }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      // Mark component as unmounted to prevent state updates after unmount
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    
    if (!clientId) {
      const error = 'PayPal Client ID is missing';
      console.error(error);
      if (isMountedRef.current) setScriptError(error);
      toast({
        variant: "destructive",
        title: "PayPal Configuration Error",
        description: "PayPal Client ID is not set. Please check your environment variables.",
      });
      return;
    }

    try {
      // Validate the client ID format
      const encodedClientId = encodeURIComponent(clientId);
      
      // Log initialization attempt (only show first few chars)
      console.log('Initializing PayPal with Client ID:', encodedClientId.substring(0, 8) + '...');
      
      if (isMountedRef.current) setScriptLoaded(true);
    } catch (error) {
      console.error('PayPal initialization error:', error);
      if (isMountedRef.current) setScriptError('Failed to initialize PayPal: ' + error.message);
      toast({
        variant: "destructive",
        title: "PayPal Error",
        description: "Failed to initialize PayPal checkout. Please try again.",
      });
    }
  }, [toast]);
  
  const handleRetry = () => {
    if (!import.meta.env.VITE_PAYPAL_CLIENT_ID) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "PayPal Client ID is not configured. Please check your environment variables.",
      });
      return;
    }
    
    setScriptError(null);
    setScriptLoaded(true);
  };

  if (scriptError) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-medium">
            Failed to load PayPal checkout
          </p>
          <p className="text-sm text-gray-600">
            {scriptError}
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div className="w-full p-4 text-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p>Loading PayPal checkout...</p>
      </div>
    );
  }

  // Properly encode the client ID and other values
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
  const paypalConfig = {
    "client-id": clientId,
    currency: "USD",
    // Request the PayPal JS SDK v6 per integration guide
    "sdk-version": "6",
    intent: "capture",
    components: "buttons",
    "disable-funding": "credit,card",
    "enable-funding": "venmo,paylater",
    // Add options to reduce initial load timeout and improve robustness
    "data-page-type": "product",
    dataAttributes: {
      "data-sdk-tracking-id": "react-paypal-js"
    }
  };
  
  // Debug: log client ID presence
  if (!clientId) {
    console.warn('PayPal Client ID is empty or undefined in paypalConfig');
  } else {
    console.log('PayPal configured with Client ID:', clientId.substring(0, 8) + '...');
  }

  // Function to handle script load errors
  const handleScriptLoadError = (err) => {
    console.error('PayPal script load error:', err);
    setScriptError('Failed to load PayPal script: ' + err.message);
  };

  return (
    <PayPalScriptProvider 
      options={paypalConfig}
      onError={handleScriptLoadError}
    >
      <ErrorBoundary
        fallback={(error) => (
          <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-600">Something went wrong with PayPal checkout.</p>
            <p className="text-sm text-gray-600 mt-2">{error.message}</p>
            <button onClick={handleRetry} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
              Try Again
            </button>
          </div>
        )}
      >
        <PayPalButtons
          forceReRender={[cartItems]} // Re-render when cart changes
          style={PAYPAL_BUTTON_STYLES}
        createOrder={async (data, actions) => {
        try {
          // Validate cart first
          if (!cartItems?.length) {
            throw new Error('Your cart is empty');
          }

          // Calculate order total (move this to a utility function if used elsewhere)
          const orderTotal = cartItems.reduce((total, item) => {
            const priceCents = item.variant?.sale_price_in_cents ?? item.variant?.price_in_cents ?? item.product?.base_price ?? 0;
            const price = Number(priceCents) / 100;
            return total + (price * (item.quantity || 0));
          }, 0);

          if (orderTotal <= 0) {
            throw new Error('Invalid order total');
          }

          // Create the order on our server
          const orderId = await createPayPalOrder(cartItems);
          if (!orderId) {
            throw new Error('Failed to create order');
          }

          return orderId;
        } catch (error) {
          console.error('PayPal createOrder error:', error);
          
          const errorMessage = error.message === 'Your cart is empty'
            ? "Please add items to your cart before checking out."
            : "Unable to create order. Please try again.";
          
          toast({
            variant: "destructive",
            title: "Checkout Error",
            description: errorMessage,
          });
          
          throw error; // Let PayPal handle the error display
        }
      }}
      onApprove={async (data) => {
        try {
          // Check if user is authenticated
          if (!user) {
            throw new Error('You must be logged in to complete this purchase');
          }

          // Show processing message
          toast({
            title: "Processing Payment",
            description: "Please wait while we confirm your payment...",
          });

          console.log('Capturing PayPal order:', data.orderID);

          // Capture the order from PayPal
          const orderData = await capturePayPalOrder(data.orderID);
          
          if (!orderData || orderData.error) {
            throw new Error(orderData?.error?.message || 'Failed to capture payment');
          }

          console.log('PayPal capture successful, creating database order');

          // Create the order in our database
          try {
            const dbOrder = await createOrderFromPayPalPayment(orderData, cartItems, user.id);
            console.log('Database order created:', dbOrder.orderId);

            // Show success message and redirect
            toast({
              title: "Payment Successful! 🎉",
              description: `Thank you for your purchase. Order #${dbOrder.orderId.substring(0, 8)} has been created.`,
            });
            
            onSuccess?.(orderData);
            navigate("/success");
          } catch (dbError) {
            console.error('Failed to create order in database:', dbError);
            // Payment was captured from PayPal, but order couldn't be saved to DB
            // This is a critical issue that needs manual intervention
            toast({
              variant: "destructive",
              title: "Payment Captured - Order Save Failed",
              description: "Your payment was successful but we couldn't save your order. Please contact support with your PayPal transaction ID: " + orderData.id,
            });
            navigate("/success");
          }
        } catch (error) {
          console.error('PayPal capture error:', error);
          toast({
            variant: "destructive",
            title: "Payment Error",
            description: "We couldn't complete your payment. Please try again or contact support.",
          });
          throw error; // Let PayPal handle the error display
        }
      }}
      onError={(err) => {
        console.error("PayPal error:", err);
        
        // Handle specific error cases
        let errorMessage = "An error occurred with PayPal. Please try again.";
        if (err.message?.includes('popup')) {
          errorMessage = "The PayPal login window was blocked. Please allow popups for this site.";
        } else if (err.message?.includes('cancelled')) {
          errorMessage = "The payment process was cancelled. Please try again.";
        }
        
        toast({
          variant: "destructive",
          title: "PayPal Error",
          description: errorMessage,
        });
        
        // Attempt to recover from certain errors
        if (err.message?.includes('initialize') || err.message?.includes('script')) {
          handleRetry();
        }
      }}
      onCancel={() => {
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the payment process.",
        });
      }}
    />
      </ErrorBoundary>
    </PayPalScriptProvider>
  );
}