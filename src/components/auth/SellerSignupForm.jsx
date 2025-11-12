import React, { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

export default function SellerSignupForm({ onSuccess }) {
  const { user, session } = useContext(SupabaseAuthContext);
  const [form, setForm] = useState({ name: '', slug: '', description: '', website: '', contact_email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Require user to be logged in
  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please log in to become a seller.</p>
      </div>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch('/api/onboarding/signup', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          owner_id: user.id,  // Use authenticated user's ID
          ...form
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      onSuccess && onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Store Name</label>
        <input name="name" value={form.name} onChange={handleChange} className="mt-1 block w-full border rounded p-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Slug</label>
        <input name="slug" value={form.slug} onChange={handleChange} className="mt-1 block w-full border rounded p-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Contact Email</label>
        <input name="contact_email" value={form.contact_email} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Website</label>
        <input name="website" value={form.website} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <div>
        <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Seller Account'}</Button>
      </div>
    </form>
  );
}
