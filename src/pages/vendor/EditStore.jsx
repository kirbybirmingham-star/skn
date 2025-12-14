import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';


const EditStore = () => {
  const { vendor, session } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', slug: '', description: '', website: '', contact_email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name || '',
        slug: vendor.slug || '',
        description: vendor.description || '',
        website: vendor.website || '',
        contact_email: vendor.metadata?.contact_email || '',
      });
    }
  }, [vendor]);

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
      if (!form.name.trim() || !form.slug.trim()) {
        throw new Error('Store name and slug are required');
      }

      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/vendor/${vendor.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update store');

      setSuccess(true);
      toast({
        title: 'Store Updated',
        description: 'Your store information has been successfully updated.',
      });
    } catch (err) {
      setError(err.message || 'An error occurred');
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: err.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Edit Store</h1>
        <p className="text-slate-600">Update your store's information here.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Store Information</CardTitle>
          <CardDescription>Update your store's details.</CardDescription>
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
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-green-800 font-medium">Success</p>
                        <p className="text-green-700 text-sm">Store information updated successfully.</p>
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
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 font-medium py-2"
            >
              {loading ? 'Saving Changes…' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditStore;
