import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '../lib/customSupabaseClient.js';
import { useToast } from '../components/ui/use-toast';

const AuthContext = createContext(undefined);

export const SupabaseAuthContext = AuthContext;

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        if (profileError) throw new Error(profileError.message);
        setProfile(profileData);
        
        // Fetch vendor status
        const res = await fetch('/api/onboarding/me', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (res.ok) {
          const { vendor: vendorData } = await res.json();
          setVendor(vendorData || null);
        } else if (res.status === 404) {
          setVendor(null); // No vendor found for user
        }

      } catch (err) {
        console.error('Failed to fetch user data:', err);
        // Don't toast here, as it can be noisy during normal operations (e.g. 404)
        setProfile(null);
        setVendor(null);
      }
    } else {
      setProfile(null);
      setVendor(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
      return { error, data };
    }

    // If a user object is returned, create a corresponding profile row.
    // Many apps keep a `profiles` table for extended user data (username, avatar, etc.).
    try {
      const user = data?.user;
      if (user) {
        const profile = {
          id: user.id,
          email: user.email,
          username: user.email ? user.email.split('@')[0] : null,
          created_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase.from('profiles').insert([profile]);
        if (insertError) {
          // Non-fatal: profile insert can fail due to RLS or policies; surface to developer via toast.
          toast({
            variant: 'destructive',
            title: 'Profile creation failed',
            description: insertError.message || 'Could not create profile row in the database.',
          });
        } else {
          toast({
            title: 'Account created',
            description: 'Please check your email to confirm the account.',
          });
        }
      }
    } catch (err) {
      // Unexpected error while attempting profile creation.
      toast({
        variant: 'destructive',
        title: 'Profile creation error',
        description: err?.message || String(err) || 'An unexpected error occurred creating profile.',
      });
    }

    return { error, data };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    vendor,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, profile, vendor, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};