import React, { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function SellerSignupForm({ onSuccess }) {
  const { user, session } = useContext(SupabaseAuthContext);
  const [form, setForm] = useState({ name: '', slug: '', description: '', website: '', contact_email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Require user to be logged in
  if (!user) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <CardTitle className="text-yellow-900">Authentication Required</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-800 mb-4">Please log in to your account to become a seller.</p>
          <Button onClick={() => window.location.href = '/login'} className="bg-blue-600 text-white hover:bg-blue-700">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Validate required fields
      if (!form.name.trim() || !form.slug.trim()) {
        throw new Error('Store name and slug are required');
      }

      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/onboarding/signup', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          owner_id: user.id,
          ...form
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');

      setSuccess(true);
      // Call success callback
      onSuccess && onSuccess(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <CardTitle className="text-green-900">Store Created Successfully!</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-green-800 mb-4">Your seller account has been created. Redirecting to onboarding…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create Your Seller Account</CardTitle>
        <CardDescription>Set up your store on SKN Bridge Trade marketplace</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-900 mb-1">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Your store name"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
              required
            />
            <p className="text-xs text-slate-500 mt-1">This is the name customers will see</p>
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-900 mb-1">
              Store URL Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              value={form.slug}
              onChange={handleChange}
              placeholder="my-store"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
              required
            />
            <p className="text-xs text-slate-500 mt-1">URL-friendly name (lowercase, no spaces)</p>
          </div>

          <div>
            <label htmlFor="contact_email" className="block text-sm font-medium text-slate-900 mb-1">
              Contact Email
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              value={form.contact_email}
              onChange={handleChange}
              placeholder="contact@store.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
            />
            <p className="text-xs text-slate-500 mt-1">Email for customer inquiries</p>
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-slate-900 mb-1">
              Website
            </label>
            <input
              id="website"
              name="website"
              type="url"
              value={form.website}
              onChange={handleChange}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
            />
            <p className="text-xs text-slate-500 mt-1">Your business website (optional)</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-900 mb-1">
              Store Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell customers about your store..."
              rows="4"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">A brief description of your store and what you sell</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 font-medium py-2"
          >
            {loading ? 'Creating Account…' : 'Create Seller Account'}
          </Button>

          <p className="text-xs text-slate-600 text-center">
            By creating an account, you agree to our{' '}
            <a href="/trust-safety" className="text-blue-600 hover:text-blue-700 underline">
              Terms of Service
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
