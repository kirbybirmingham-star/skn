import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import StorePage from '../pages/StorePage';
import ProductDetailsPage from '../pages/ProductDetailsPage';
import SuccessPage from '../pages/SuccessPage';
import BecomeSellerPage from '../pages/BecomeSellerPage';
import TrustSafetyPage from '../pages/TrustSaftetyPage';
import AboutPage from '../pages/AboutPage';
import FAQPage from '../pages/FAQPage';
import ContactPage from '../pages/ContactPage';
import DashboardPage from '../pages/Dashboard';
import SellerOnboarding from '../pages/SellerOnboarding';
import ProtectedRoute from '../components/ProtectedRoute';
import RequireRole from '../components/RequireRole';
import VendorIndex from '../pages/vendor/Index';
import VendorProducts from '../pages/vendor/Products';
import VendorDashboardPage from '../pages/vendor/Dashboard';
import VendorStore from '../pages/vendor/Store';
import VendorOrders from '../pages/vendor/Orders';
import App from '../App';
import MarketplacePage from '../pages/MarketplacePage';
import RouteError from '../components/RouteError';
import OnboardingDashboard from '../pages/OnboardingDashboard';
import PaymentPage from '../pages/PaymentPage';
import OrderHistoryPage from '../pages/OrderHistoryPage';
import AccountSettings from '../pages/AccountSettings';
import AdminPanel from '../pages/AdminPanel';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'store', element: <StorePage /> },
      { path: 'store/:sellerId', element: <StorePage /> },
      { path: 'marketplace', element: <MarketplacePage /> },
      { path: 'product/:id', element: <ProductDetailsPage /> },
      { path: 'success', element: <SuccessPage /> },
      { path: 'checkout', element: <ProtectedRoute><PaymentPage /></ProtectedRoute> },
      { path: 'orders', element: <ProtectedRoute><OrderHistoryPage /></ProtectedRoute> },
      { path: 'orders/:orderId', element: <ProtectedRoute><OrderHistoryPage /></ProtectedRoute> },
      { path: 'account-settings', element: <ProtectedRoute><AccountSettings /></ProtectedRoute> },
      { path: 'admin', element: <ProtectedRoute><RequireRole role="admin"><AdminPanel /></RequireRole></ProtectedRoute> },
      { path: 'become-seller', element: <BecomeSellerPage /> },
      { path: 'onboarding', element: <ProtectedRoute><SellerOnboarding /></ProtectedRoute> },
      { path: 'onboarding/:token', element: <ProtectedRoute><SellerOnboarding /></ProtectedRoute> },
      { path: 'dashboard/onboarding', element: <ProtectedRoute><OnboardingDashboard /></ProtectedRoute> },
      { path: 'trust-safety', element: <TrustSafetyPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'faq', element: <FAQPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
      {
        path: 'dashboard/vendor',
        element: (
          <ProtectedRoute>
            <RequireRole role="vendor">
              <VendorIndex />
            </RequireRole>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <VendorDashboardPage /> },
          { path: 'products', element: <VendorProducts /> },
          { path: 'orders', element: <VendorOrders /> },
          { path: 'edit', element: <VendorStore /> },
        ]
      },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});