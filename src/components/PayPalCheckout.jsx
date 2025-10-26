import React from 'react';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/use-toast";
import { createPayPalOrder, capturePayPalOrder } from "../api/EcommerceApi";

export default function PayPalCheckout({ cartItems, onSuccess }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [{ isPending, isInitial, isRejected, isResolved }, dispatch] = usePayPalScriptReducer();

  React.useEffect(() => {
    // Check PayPal configuration
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      console.error('PayPal Client ID is missing');
      toast({
        variant: "destructive",
        title: "PayPal Configuration Error",
        description: "PayPal Client ID is not set. Please check your environment variables.",
      });
      return;
    }

    // Log initialization status
    console.log('PayPal Status:', {
      isPending,
      isInitial,
      isRejected,
      isResolved,
      clientId: clientId.substring(0, 8) + '...' // Log partial ID for debugging
    });

    if (isRejected) {
      console.error('PayPal script failed to load');
      toast({
        variant: "destructive",
        title: "PayPal Error",
        description: "Failed to initialize PayPal. Please refresh the page.",
      });
    }
  }, [isPending, isInitial, isRejected, isResolved, toast]);
  
  const handleRetry = () => {
    // Reset the PayPal script
    if (!import.meta.env.VITE_PAYPAL_CLIENT_ID) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "PayPal Client ID is not configured. Please check your environment variables.",
      });
      return;
    }
    
    dispatch({
      type: "resetOptions",
      value: {
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
      },
    });
  };

  if (isPending || isInitial) {
    return (
      <div className="w-full p-4 text-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p>Loading PayPal checkout...</p>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-medium">
            Failed to load PayPal checkout
          </p>
          <p className="text-sm text-gray-600">
            This could be due to network issues or an invalid configuration.
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

  if (!isResolved) {
    return (
      <div className="w-full p-4 text-center text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg">
        Initializing payment system...
      </div>
    );
  }

  return (
    <PayPalButtons
      forceReRender={[cartItems]} // Re-render when cart changes
      style={{
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "checkout",
        height: 45,
      }}
      fundingSource="paypal"
      createOrder={async (data, actions) => {
        try {
          console.log('Starting PayPal order creation...');
          
          // Validate cart first
          if (!cartItems || cartItems.length === 0) {
            throw new Error('Your cart is empty');
          }

          // Log cart items for debugging
          console.log('Cart items:', cartItems);

          const orderId = await createPayPalOrder(cartItems);
          console.log('Order created successfully:', orderId);
          
          if (!orderId) {
            throw new Error('Invalid order response from server');
          }

          return orderId;
        } catch (error) {
          console.error('Create order error:', error);
          
          // Format user-friendly error message
          let errorMessage = "Unable to create PayPal order. Please try again.";
          if (error.message.includes('cart')) {
            errorMessage = "Please add items to your cart before checking out.";
          } else if (error.message.includes('Invalid server response')) {
            errorMessage = "We're having trouble connecting to PayPal. Please try again in a moment.";
          } else if (error.message.includes('authentication') || error.message.includes('token')) {
            errorMessage = "Payment system needs to reconnect. Please try again.";
            handleRetry();
          }
          
          toast({
            variant: "destructive",
            title: "Checkout Error",
            description: errorMessage,
          });
          
          throw error;
        }
      }}
      onApprove={async (data, actions) => {
        try {
          const orderData = await capturePayPalOrder(data.orderID);
          toast({
            title: "Payment Successful!",
            description: "Thank you for your purchase.",
          });
          onSuccess?.(orderData);
          navigate("/success");
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Payment Error",
            description: "Unable to process payment. Please try again.",
          });
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
  );
}