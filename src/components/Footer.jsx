import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">SKN Bridge Trade</span>
            </div>
            <p className="text-slate-300 text-sm">
              The trusted local marketplace connecting verified buyers and sellers in your community.
            </p>
          </div>

          <div>
            <span className="font-semibold text-lg mb-4 block">Quick Links</span>
            <div className="flex flex-col gap-2">
              <Link to='/store' className="text-slate-300 hover:text-white text-sm text-left transition-colors">
                Browse Store
              </Link>
              <Link to='/become-seller' className="text-slate-300 hover:text-white text-sm text-left transition-colors">
                Become a Seller
              </Link>
              <Link to='/trust-safety' className="text-slate-300 hover:text-white text-sm text-left transition-colors">
                Trust & Safety
              </Link>
              <Link to='/faq' className="text-slate-300 hover:text-white text-sm text-left transition-colors">
                FAQ
              </Link>
            </div>
          </div>

          <div>
            <span className="font-semibold text-lg mb-4 block">Company</span>
            <div className="flex flex-col gap-2">
              <Link to='/about' className="text-slate-300 hover:text-white text-sm text-left transition-colors">
                About Us
              </Link>
              <Link to='/contact' className="text-slate-300 hover:text-white text-sm text-left transition-colors">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <span className="font-semibold text-lg mb-4 block">Contact Info</span>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Mail className="w-4 h-4" />
                <span>support@sknbridgetrade.com</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <MapPin className="w-4 h-4" />
                <span>Your City, Your Region</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center">
          <p className="text-slate-400 text-sm">
            © 2025 SKN Bridge Trade. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;