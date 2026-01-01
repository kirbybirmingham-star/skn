import React, { useState } from 'react';
    import { Link, useLocation, useNavigate } from 'react-router-dom';
    import { Menu, X, ShoppingBag, ShoppingCart as CartIcon, User, LogOut, LayoutDashboard } from 'lucide-react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { ThemeToggle } from '@/components/ui/theme-toggle';
    import { useCart } from '@/hooks/useCart';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import Login from '@/components/auth/Login';
    import SignUp from '@/components/auth/SignUp';
    import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuLabel,
      DropdownMenuSeparator,
      DropdownMenuTrigger,
    } from "@/components/ui/dropdown-menu";
    import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

    const Header = ({ onCartClick }) => {
      const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
      const [showLogin, setShowLogin] = useState(false);
      const [showSignUp, setShowSignUp] = useState(false);

      const location = useLocation();
      const navigate = useNavigate();
      const { cartItems } = useCart();
      const { user, profile, signOut } = useAuth();

      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      const mainNavItems = [
        { path: '/', label: 'Home' },
        { path: '/marketplace', label: 'Marketplace' },
        { path: '/become-seller', label: 'Become a Seller' },
      ];

      const moreNavItems = [
        { path: '/trust-safety', label: 'Trust & Safety' },
        { path: '/about', label: 'About Us' },
        { path: '/faq', label: 'FAQ' },
        { path: '/contact', label: 'Contact' },
      ];

      const handleSignOut = async () => {
        try {
          await signOut();
          navigate('/');
        } catch (error) {
          console.error('Error signing out:', error);
        }
      };

      const getAvatarFallback = (email) => {
        if (!email) return "U";
        return email[0].toUpperCase();
      };

      return (
        <>
          <Login isOpen={showLogin} onOpenChange={setShowLogin} onSignUpClick={() => { setShowLogin(false); setShowSignUp(true); }} />
          <SignUp isOpen={showSignUp} onOpenChange={setShowSignUp} onLoginClick={() => { setShowSignUp(false); setShowLogin(true); }} />

          <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border shadow-sm">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <Link to="/" className="flex-shrink-0">
                  <motion.div 
                    className="flex items-center gap-2 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      SKN Bridge Trade
                    </span>
                  </motion.div>
                </Link>

                <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
                  {mainNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${
                       location.pathname === item.path
                         ? 'text-primary bg-primary/10'
                         : 'text-foreground hover:bg-accent'
                     }`}
                      aria-current={location.pathname === item.path ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  ))}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${
                          moreNavItems.some(item => location.pathname === item.path)
                            ? 'text-primary bg-primary/10'
                            : 'text-foreground hover:bg-accent'
                        }`}
                      >
                        More ▼
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      {moreNavItems.map((item) => (
                        <DropdownMenuItem key={item.path} asChild>
                          <Link
                            to={item.path}
                            className={`w-full ${
                              location.pathname === item.path
                                ? 'text-primary bg-primary/10'
                                : 'text-foreground'
                            }`}
                            aria-current={location.pathname === item.path ? 'page' : undefined}
                          >
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </nav>

                <div className="hidden md:flex items-center gap-1">
                  {user ? (
                    <>
                      <ThemeToggle />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 px-2"
                        onClick={onCartClick}
                      >
                        <CartIcon className="w-4 h-4" />
                        {totalItems > 0 && (
                         <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs font-medium">
                           {totalItems}
                         </span>
                        )}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                              <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                <AvatarImage src={profile?.avatar_url} alt={user.email} />
                                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                  {getAvatarFallback(user.email)}
                                </AvatarFallback>
                              </Avatar>
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                          <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none">{profile?.full_name || user.email}</p>
                              <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate('/account-settings')}
                            className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            Account Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/dashboard')}
                            className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleSignOut}
                            className="cursor-pointer text-red-600 focus:text-red-600">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setShowLogin(true)}>Sign In</Button>
                      <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary" onClick={() => setShowSignUp(true)}>
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>

                <div className="md:hidden flex items-center gap-2">
                  <ThemeToggle />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 px-2"
                    onClick={onCartClick}
                  >
                    <CartIcon className="w-4 h-4" />
                    {totalItems > 0 && (
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs font-medium">
                        {totalItems}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="md:hidden mt-4 pb-4"
                  >
                    <nav className="flex flex-col gap-3">
                      {mainNavItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block text-left px-4 py-3 rounded-lg transition-colors ${
                            location.pathname === item.path
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-foreground hover:bg-accent'
                          }`}
                          aria-current={location.pathname === item.path ? 'page' : undefined}
                        >
                          {item.label}
                        </Link>
                      ))}

                      <div className="border-t border-border pt-2 mt-2">
                        <div className="px-4 py-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          More
                        </div>
                        {moreNavItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block text-left px-4 py-3 rounded-lg transition-colors ${
                              location.pathname === item.path
                                ? 'bg-teal-50 text-teal-700 font-medium'
                                : 'text-foreground hover:bg-accent'
                            }`}
                            aria-current={location.pathname === item.path ? 'page' : undefined}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                        {user ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => { setMobileMenuOpen(false); navigate('/account-settings'); }}>My Account</Button>
                            <Button variant="outline" size="sm" onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}>Dashboard</Button>
                            <Button size="sm" className="bg-red-500" onClick={() => { setMobileMenuOpen(false); handleSignOut();}}>
                              Sign Out
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => { setMobileMenuOpen(false); setShowLogin(true); }}>Sign In</Button>
                            <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80" onClick={() => { setMobileMenuOpen(false); setShowSignUp(true);}}>
                              Sign Up
                            </Button>
                          </>
                        )}
                      </div>
                    </nav>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>
        </>
      );
    };

    export default Header;