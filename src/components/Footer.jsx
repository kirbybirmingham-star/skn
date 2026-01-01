import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-card via-card to-card/80 border-t border-border text-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">SKN Bridge Trade</span>
            </div>
            <p className="text-muted-foreground text-sm">
              The trusted local marketplace connecting verified buyers and sellers in your community.
            </p>
          </div>

          <div>
            <span className="font-semibold text-lg mb-4 block text-foreground">Quick Links</span>
            <div className="flex flex-col gap-2">
              <Link to='/store' className="text-muted-foreground hover:text-foreground text-sm text-left transition-colors">
                Browse Store
              </Link>
              <Link to='/become-seller' className="text-muted-foreground hover:text-foreground text-sm text-left transition-colors">
                Become a Seller
              </Link>
              <Link to='/trust-safety' className="text-muted-foreground hover:text-foreground text-sm text-left transition-colors">
                Trust & Safety
              </Link>
              <Link to='/faq' className="text-muted-foreground hover:text-foreground text-sm text-left transition-colors">
                FAQ
              </Link>
            </div>
          </div>

          <div>
            <span className="font-semibold text-lg mb-4 block text-foreground">Company</span>
            <div className="flex flex-col gap-2">
              <Link to='/about' className="text-muted-foreground hover:text-foreground text-sm text-left transition-colors">
                About Us
              </Link>
              <Link to='/contact' className="text-muted-foreground hover:text-foreground text-sm text-left transition-colors">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <span className="font-semibold text-lg mb-4 block text-foreground">Contact Info</span>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="w-4 h-4" />
                <span>businesstrends869@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="w-4 h-4" />
                <span>+1 (869) 613-9919</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" />
                <span>Basseterre, St. Kitts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 SKN Bridge Trade. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;