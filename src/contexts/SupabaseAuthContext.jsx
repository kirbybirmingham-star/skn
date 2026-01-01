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
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    // fetch profile when session/user changes
    if (session?.user) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (!error) setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    } else {
      setProfile(null);
    }

    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async (userId) => {
    try {
      if (!userId) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!error) {
        setProfile(data);
        return data;
      }
      return null;
    } catch (err) {
      console.error('refreshProfile error:', err);
      return null;
    }
  }, []);

  const updateUserProfile = useCallback(async (updates) => {
    try {
      if (!user?.id) throw new Error('No user logged in');
      
      // Get JWT token from current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Call backend API endpoint using service role key (bypasses RLS)
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.profile) {
        setProfile(data.profile);
        return data.profile;
      }
      
      throw new Error('Invalid response from profile update');
    } catch (err) {
      console.error('updateUserProfile error:', err);
      throw err;
    }
  }, [user?.id]);

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
    let data = null;
    let error = null;

    if (options?.provider === 'google') {
      // Handle OAuth sign up
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: options.redirectTo || `${window.location.origin}/auth/callback`,
        },
      });
      error = result.error;
      data = result.data;
      return { error, data };
    }

    // Handle email/password sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...options,
        data: {
          ...options?.data,
          email_confirm: true, // Skip email confirmation
        }
      },
    });

    data = signUpData;
    error = signUpError;

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
          full_name: options?.data?.full_name || user.email?.split('@')[0] || null,
          role: options?.role || 'customer', // Use provided role or default to customer
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase.from('profiles').insert([profile]);
        if (insertError) {
          // Non-fatal: profile insert can fail due to RLS or policies; surface to developer via toast.
          console.error('Profile insert error:', insertError);
          toast({
            variant: 'destructive',
            title: 'Profile creation failed',
            description: 'Database error saving new user. Please try again.',
          });
          return { error: insertError, data };
        } else {
          toast({
            title: 'Account created',
            description: 'Welcome! Your account has been created successfully.',
          });
        }
      }
    } catch (err) {
      // Unexpected error while attempting profile creation.
      console.error('Profile creation error:', err);
      toast({
        variant: 'destructive',
        title: 'Profile creation error',
        description: 'Database error saving new user. Please try again.',
      });
      return { error: err, data };
    }

    return { error, data };
  }, [toast]);

  const signIn = useCallback(async (email, password, options) => {
    let error = null;
    let data = null;

    if (options?.provider === 'google') {
      // Handle OAuth sign in
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: options.redirectTo || `${window.location.origin}/auth/callback`,
        },
      });
      error = result.error;
      data = result.data;
    } else {
      // Handle email/password sign in
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = result.error;
      data = result.data;
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error, data };
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
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    updateUserProfile,
  }), [user, session, loading, signUp, signIn, signOut, refreshProfile, updateUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};