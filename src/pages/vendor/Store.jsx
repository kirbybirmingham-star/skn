import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getVendorByOwner, updateVendor } from '@/api/EcommerceApi';
import { Upload, Camera } from 'lucide-react';

const VendorStore = () => {
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    logo_url: '',
    cover_url: ''
  });

  useEffect(() => {
    const loadVendor = async () => {
      if (!user?.id) return;

      try {
        const vendorData = await getVendorByOwner(user.id);
        if (vendorData) {
          setVendor(vendorData);
          setFormData({
            name: vendorData.name || '',
            description: vendorData.description || '',
            website: vendorData.website || '',
            location: vendorData.location || '',
            logo_url: vendorData.logo_url || '',
            cover_url: vendorData.cover_url || ''
          });
        }
      } catch (error) {
        console.error('Failed to load vendor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVendor();
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!vendor?.id) {
      console.error('Vendor ID not found');
      alert('Unable to save: Vendor ID not found');
      return;
    }

    // Validate form data
    if (!formData.name || formData.name.trim().length < 2) {
      alert('Store name must be at least 2 characters');
      return;
    }

    if (formData.description && formData.description.length > 1000) {
      alert('Description cannot exceed 1000 characters');
      return;
    }

    setSaving(true);
    try {
      console.log('Saving vendor data:', formData);
      const result = await updateVendor(vendor.id, formData);
      
      // Refresh vendor data to get updated values
      const updatedVendor = await getVendorByOwner(user.id);
      setVendor(updatedVendor);
      
      console.log('✅ Store settings saved successfully');
      alert('✅ Store settings saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save store settings:', error);
      const errorMessage = error.message || 'An error occurred while saving';
      alert(`❌ Failed to save store settings:\n${errorMessage}\n\nPlease try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (field) => {
    // Placeholder for image upload functionality
    alert(`Image upload for ${field} - This feature will be implemented with file upload capability`);
  };

  if (loading) {
    return <div>Loading store settings...</div>;
  }

  if (!vendor) {
    return <div>No store found. Please complete your vendor setup first.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Store Settings</h1>
        <p className="text-gray-600">Manage your store profile and branding</p>
      </div>

      <div className="grid gap-6">
        {/* Store Images */}
        <Card>
          <CardHeader>
            <CardTitle>Store Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo */}
              <div className="space-y-4">
                <Label htmlFor="logo">Store Logo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {formData.logo_url ? (
                    <div className="space-y-4">
                      <img
                        src={formData.logo_url}
                        alt="Store Logo"
                        className="w-24 h-24 object-cover rounded-lg mx-auto"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImageUpload('logo')}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Change Logo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => handleImageUpload('logo')}
                        >
                          Upload Logo
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          PNG, JPG up to 2MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-4">
                <Label htmlFor="cover">Cover Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {formData.cover_url ? (
                    <div className="space-y-4">
                      <img
                        src={formData.cover_url}
                        alt="Cover Image"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImageUpload('cover')}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Change Cover
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => handleImageUpload('cover')}
                        >
                          Upload Cover Image
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Store Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your store name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourstore.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, State/Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Store Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell customers about your store..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-8"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorStore;