import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Card } from '@/components/ui/card';

const AccountSettings = () => {
  const { profile, user, vendor } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    full_name: '',
    avatar_url: ''
  });
  
  // Vendor form state
  const [vendorForm, setVendorForm] = useState({
    store_name: '',
    description: '',
    slug: '',
    website: '',
    location: ''
  });

  // Load current data
  useEffect(() => {
    if (profile) {
      setProfileForm({
        username: profile.username || '',
        email: profile.email || user?.email || '',
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile, user]);

  useEffect(() => {
    if (vendor) {
      setVendorForm({
        store_name: vendor.store_name || vendor.name || '',
        description: vendor.description || '',
        slug: vendor.slug || '',
        website: vendor.website || '',
        location: vendor.location || ''
      });
    }
  }, [vendor]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Error', description: 'Not logged in', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileForm.username,
          full_name: profileForm.full_name,
          avatar_url: profileForm.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to update profile', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVendorUpdate = async (e) => {
    e.preventDefault();
    if (!vendor) {
      toast({ title: 'Error', description: 'No vendor found', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          store_name: vendorForm.store_name,
          name: vendorForm.store_name,
          description: vendorForm.description,
          slug: vendorForm.slug,
          website: vendorForm.website,
          location: vendorForm.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Vendor settings updated successfully' });
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to update vendor settings', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newPassword = form.elements.password?.value;
    const confirmPassword = form.elements.confirm_password?.value;

    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: 'Success', description: 'Password updated successfully' });
      form.reset();
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to update password', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
          <p className="text-slate-600">Manage your profile, vendor settings, and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profile
          </button>
          {vendor && (
            <button
              onClick={() => setActiveTab('vendor')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'vendor'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vendor Settings
            </button>
          )}
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'security'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Security
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card className="p-8">
            <h2 className="text-xl font-bold mb-6">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <Input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed here</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                <Input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  placeholder="your_username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <Input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  placeholder="Your Full Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Avatar URL</label>
                <Input
                  type="url"
                  value={profileForm.avatar_url}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
                {profileForm.avatar_url && (
                  <div className="mt-3">
                    <img 
                      src={profileForm.avatar_url} 
                      alt="Avatar preview" 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Vendor Settings Tab */}
        {activeTab === 'vendor' && vendor && (
          <Card className="p-8">
            <h2 className="text-xl font-bold mb-6">Vendor Settings</h2>
            <form onSubmit={handleVendorUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Store Name</label>
                <Input
                  type="text"
                  value={vendorForm.store_name}
                  onChange={(e) => setVendorForm({ ...vendorForm, store_name: e.target.value })}
                  placeholder="Your Store Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Store Slug</label>
                <Input
                  type="text"
                  value={vendorForm.slug}
                  onChange={(e) => setVendorForm({ ...vendorForm, slug: e.target.value })}
                  placeholder="store-slug"
                />
                <p className="text-xs text-slate-500 mt-1">Used in store URL</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={vendorForm.description}
                  onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                  placeholder="Describe your store..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                <Input
                  type="url"
                  value={vendorForm.website}
                  onChange={(e) => setVendorForm({ ...vendorForm, website: e.target.value })}
                  placeholder="https://yourstore.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <Input
                  type="text"
                  value={vendorForm.location}
                  onChange={(e) => setVendorForm({ ...vendorForm, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Vendor Settings'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <Card className="p-8">
            <h2 className="text-xl font-bold mb-6">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                <Input
                  type="password"
                  name="password"
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                <Input
                  type="password"
                  name="confirm_password"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <p className="text-xs text-slate-500">Password must be at least 8 characters long</p>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
