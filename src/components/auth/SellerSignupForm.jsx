import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SellerSignupForm({ onSuccess }) {
  const [form, setForm] = useState({ owner_id: '', name: '', slug: '', description: '', website: '', contact_email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
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
        <label className="block text-sm font-medium text-gray-700">Owner ID</label>
        <input name="owner_id" value={form.owner_id} onChange={handleChange} className="mt-1 block w-full border rounded p-2" />
      </div>
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
