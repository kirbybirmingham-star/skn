# SKN Bridge Trade 🏪

**The Trusted Local Marketplace** - Connecting verified buyers and sellers in your community with secure, low-commission transactions.

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.47.10-orange.svg)](https://supabase.com/)
[![PayPal](https://img.shields.io/badge/PayPal-Integration-blue.svg)](https://developer.paypal.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1.12-purple.svg)](https://vitejs.dev/)

## 🌟 Overview

SKN Bridge Trade is a comprehensive e-commerce marketplace platform designed for local communities. It provides a secure, user-friendly environment where verified buyers and sellers can connect, transact, and build trust through our robust verification and payment systems.

### Key Highlights
- **🔐 Verified Users**: Rigorous KYC process for sellers
- **💰 Low Commissions**: Competitive rates supporting local commerce
- **🛡️ Secure Payments**: PayPal integration with buyer protection
- **📊 Multi-Role Dashboards**: Separate interfaces for customers, vendors, and admins
- **📱 Responsive Design**: Modern UI built with React and Tailwind CSS
- **⚡ Real-time Notifications**: Email and in-app notification system
- **📈 Analytics**: Comprehensive dashboards for vendors and admins

## ✨ Features

### 🏪 Marketplace
- **Product Listings**: Rich product catalog with variants, images, and descriptions
- **Advanced Search & Filters**: Find products by category, price, location, and seller
- **Store Fronts**: Individual seller stores with custom branding
- **Product Reviews**: Rating and review system for buyer feedback
- **Inventory Management**: Real-time stock tracking and management

### 👥 User Management
- **Authentication**: Secure login/signup with Supabase Auth
- **Role-Based Access**: Customer, Vendor, and Admin roles
- **Profile Management**: User profiles with preferences and settings
- **Account Verification**: Multi-step verification process

### 💳 Payments & Orders
- **PayPal Integration**: Secure payment processing with PayPal SDK
- **Order Management**: Complete order lifecycle from creation to fulfillment
- **Payout System**: Automated vendor payouts with commission handling
- **Transaction History**: Detailed order and payment tracking
- **Refund Processing**: Streamlined refund workflows

### 🏪 Seller Features
- **KYC Onboarding**: Comprehensive Know Your Customer verification
- **Store Management**: Custom store setup and branding
- **Product Management**: Add, edit, and manage product listings
- **Order Fulfillment**: Track and manage customer orders
- **Analytics Dashboard**: Sales performance and customer insights
- **Asset Management**: Image and media library management

### 👑 Admin Features
- **User Management**: Oversee all users and their roles
- **Platform Analytics**: System-wide performance metrics
- **Content Moderation**: Review and moderate listings
- **Commission Management**: Configure and monitor platform fees
- **System Monitoring**: Health checks and performance monitoring

### 📧 Communication
- **Email Notifications**: Automated emails for orders, payments, and updates
- **In-App Notifications**: Real-time notifications within the platform
- **Customer Support**: Integrated support ticket system

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management
- **React Dropzone** - File upload handling

### Backend
- **Node.js + Express** - RESTful API server
- **Supabase** - PostgreSQL database with real-time features
- **PayPal SDK** - Payment processing
- **JWT Authentication** - Secure API authentication
- **Nodemailer** - Email service
- **Sharp** - Image processing
- **Node-cron** - Scheduled tasks

### Infrastructure
- **Supabase** - Database, Auth, Storage, and Edge Functions
- **Render** - Cloud deployment platform
- **Netlify** - Static site deployment (alternative)
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Express API   │    │   Supabase DB   │
│   (Port 3000)   │◄──►│   (Port 3001)   │◄──►│   PostgreSQL    │
│                 │    │                 │    │                 │
│ • Components    │    │ • REST Routes   │    │ • Users         │
│ • Pages         │    │ • Middleware    │    │ • Products      │
│ • Hooks         │    │ • Services      │    │ • Orders        │
│ • Context       │    │ • Webhooks      │    │ • Reviews       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PayPal API    │    │   Email Service │    │   File Storage  │
│                 │    │                 │    │                 │
│ • Payments      │    │ • Notifications │    │ • Images        │
│ • Payouts       │    │ • Templates     │    │ • Assets        │
│ • Refunds       │    │ • Queue         │    │ • CDN           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### API Structure
```
/api/
├── auth/           # Authentication endpoints
├── products/       # Product management
├── orders/         # Order processing
├── users/          # User management
├── vendors/        # Seller operations
├── admin/          # Administrative functions
├── payments/       # Payment processing
├── notifications/  # Communication
└── analytics/      # Reporting and metrics
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- PayPal Developer account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skn-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```

4. **Configure Environment Variables**
   ```env
   # Frontend (.env)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id

   # Backend (server/.env)
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   ```

5. **Database Setup**
   ```bash
   # Run Supabase migrations
   npm run db:migrate

   # Seed initial data (optional)
   npm run seed
   ```

6. **Start Development Server**
   ```bash
   # Start both frontend and backend
   npm run dev:all

   # Or start separately
   npm run dev      # Frontend (port 3000)
   npm start        # Backend (port 3001)
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📚 API Documentation

### Authentication
```javascript
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
GET  /api/auth/me
```

### Products
```javascript
GET    /api/products          # List products
POST   /api/products          # Create product
GET    /api/products/:id      # Get product details
PUT    /api/products/:id      # Update product
DELETE /api/products/:id      # Delete product
```

### Orders
```javascript
GET    /api/orders            # List user orders
POST   /api/orders            # Create order
GET    /api/orders/:id        # Get order details
PUT    /api/orders/:id/status # Update order status
```

### Payments
```javascript
POST /api/payments/create-order    # Create PayPal order
POST /api/payments/capture-order   # Capture payment
POST /api/payments/refund          # Process refund
GET  /api/payments/payouts         # Get payout history
```

## 🚢 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
Ensure all production environment variables are set in your deployment platform.

### Render Deployment
1. Connect GitHub repository to Render
2. Create Static Site for frontend
3. Create Web Service for backend
4. Configure environment variables
5. Deploy

### Netlify Deployment (Alternative)
```bash
npm run build
# Deploy dist/ folder to Netlify
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📁 Project Structure

```
skn-main/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── orders/        # Order-related components
│   │   ├── products/      # Product components
│   │   └── ui/            # Base UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React contexts
│   ├── lib/               # Utilities and configurations
│   └── api/               # API client functions
├── server/
│   ├── middleware/        # Express middleware
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   ├── utils/            # Server utilities
│   └── index.js          # Server entry point
├── supabase_migrations/   # Database migrations
├── scripts/              # Utility scripts
└── docs/                 # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Join GitHub Discussions for questions and community support

## 🗺️ Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] API rate limiting and optimization
- [ ] Advanced search with AI recommendations
- [ ] Integration with shipping providers
- [ ] Loyalty program implementation

---

**Built with ❤️ for local communities worldwide**
