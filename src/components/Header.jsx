import React, { useState } from 'react';
    import { Link, useLocation, useNavigate } from 'react-router-dom';
    import { Menu, X, ShoppingBag, ShoppingCart as CartIcon, User, LogOut, LayoutDashboard } from 'lucide-react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Button } from '@/components/ui/button';
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
      const { user, signOut } = useAuth();

      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      const navItems = [
        { path: '/', label: 'Home' },
        { path: '/marketplace', label: 'Marketplace' },
        { path: '/become-seller', label: 'Become a Seller' },
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

          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-between gap-4">
                <Link to="/" className="flex-shrink-0">
                  <motion.div 
                    className="flex items-center gap-2 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      SKN Bridge Trade
                    </span>
                  </motion.div>
                </Link>

                <nav className="hidden md:flex items-center gap-4 flex-1 justify-center">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                        location.pathname === item.path ? 'text-blue-600' : 'text-slate-700'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="hidden md:flex items-center gap-1">
                  {user ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-1 px-2" 
                        onClick={onCartClick}
                      >
                        <CartIcon className="w-4 h-4" />
                        {totalItems > 0 && (
                          <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs font-medium">
                            {totalItems}
                          </span>
                        )}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                              <AvatarFallback>{getAvatarFallback(user.email)}</AvatarFallback>
                            </Avatar>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                          <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none">{user.email}</p>
                              <p className="text-xs leading-none text-muted-foreground">
                                {user.user_metadata?.full_name || 'User'}
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
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={() => setShowSignUp(true)}>
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>

                <div className="md:hidden flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 px-2" 
                    onClick={onCartClick}
                  >
                    <CartIcon className="w-4 h-4" />
                    {totalItems > 0 && (
                      <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs font-medium">
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
                      {navItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`text-left px-4 py-2 rounded-lg transition-colors ${
                            location.pathname === item.path
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
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
                            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => { setMobileMenuOpen(false); setShowSignUp(true);}}>
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