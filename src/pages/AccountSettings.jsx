import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import AvatarManager from '@/components/profile/AvatarManager';
import NotificationPreferences from '@/components/orders/NotificationPreferences';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Moon, Sun, Shield, Eye, EyeOff, Lock, Bell, Palette } from 'lucide-react';

const AccountSettingsPage = () => {
   const { user, profile, updateUserProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    data_sharing: false,
    marketing_emails: true,
    analytics_tracking: true
  });
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: false,
    login_alerts: true,
    session_timeout: '30'
  });
  // Fallback logic: Try direct columns first, then fall back to metadata if columns don't exist yet
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || profile?.metadata?.phone || user?.user_metadata?.phone || '',
    address: profile?.address || profile?.metadata?.address || user?.user_metadata?.address || '',
    city: profile?.city || profile?.metadata?.city || user?.user_metadata?.city || '',
    state: profile?.state || profile?.metadata?.state || user?.user_metadata?.state || '',
    zip_code: profile?.zip_code || profile?.metadata?.zip_code || user?.user_metadata?.zip_code || '',
    country: profile?.country || profile?.metadata?.country || user?.user_metadata?.country || 'US'
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrivacySettingChange = (setting, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSecuritySettingChange = (setting, value) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const updatePrivacySettings = async () => {
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: 'Privacy Settings Updated',
        description: 'Your privacy preferences have been saved successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update privacy settings.',
        variant: 'destructive'
      });
    }
  };

  const updateSecuritySettings = async () => {
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: 'Security Settings Updated',
        description: 'Your security preferences have been saved successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update security settings.',
        variant: 'destructive'
      });
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      // Send updates to both direct columns and metadata for backward compatibility
      // Direct columns (for new schema) and metadata (fallback for old schema)
      await updateUserProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        country: formData.country,
        // Also store in metadata for backward compatibility
        metadata: {
          ...profile?.metadata || {},
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          country: formData.country
        }
      });

      // Refresh profile from database to ensure consistency
      if (refreshProfile && user?.id) {
        await refreshProfile(user.id);
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvatarFallback = (email) => {
    if (!email) return "U";
    return email[0].toUpperCase();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url} alt={user?.email} />
                    <AvatarFallback className="text-lg">{getAvatarFallback(user?.email)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{profile?.full_name || user?.email}</h3>
                    <p className="text-sm text-muted-foreground">
                      Role: {profile?.role || 'buyer'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Enter your country"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your address"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter your city"
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Enter your state"
                    />
                  </div>

                  <div>
                    <Label htmlFor="zip_code">Zip Code</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      placeholder="Enter your zip code"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent>
                <AvatarManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button className="w-full md:w-auto">
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {securitySettings.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={securitySettings.two_factor_enabled}
                      onCheckedChange={(checked) => handleSecuritySettingChange('two_factor_enabled', checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Login Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified of new login attempts to your account
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.login_alerts}
                    onCheckedChange={(checked) => handleSecuritySettingChange('login_alerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Session Timeout</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out after period of inactivity
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={securitySettings.session_timeout === '15' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSecuritySettingChange('session_timeout', '15')}
                    >
                      15 min
                    </Button>
                    <Button
                      variant={securitySettings.session_timeout === '30' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSecuritySettingChange('session_timeout', '30')}
                    >
                      30 min
                    </Button>
                    <Button
                      variant={securitySettings.session_timeout === '60' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSecuritySettingChange('session_timeout', '60')}
                    >
                      1 hour
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Active Sessions</h4>
                    <p className="text-sm text-muted-foreground">
                      View and manage your active login sessions
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Sessions
                  </Button>
                </div>

                <Button
                  onClick={updateSecuritySettings}
                  className="w-full md:w-auto"
                >
                  Update Security Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Security Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Security Recommendations</p>
                      <ul className="text-blue-700 mt-2 space-y-1">
                        <li>• Enable two-factor authentication for enhanced security</li>
                        <li>• Use a strong, unique password</li>
                        <li>• Monitor your account activity regularly</li>
                        <li>• Log out from shared or public devices</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <NotificationPreferences />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Theme Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Theme Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose between light and dark theme
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">
                      Current: {isDark ? 'Dark' : 'Light'}
                    </span>
                    <ThemeToggle />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto Theme</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically switch theme based on system preference
                    </p>
                  </div>
                  <Switch
                    checked={theme === 'auto'}
                    onCheckedChange={(checked) => {
                      // This would need to be implemented in theme context
                      // For now, just show the concept
                    }}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Profile Visibility</h4>
                    <p className="text-sm text-muted-foreground">
                      Control who can see your profile information
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={privacySettings.profile_visibility === 'public' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePrivacySettingChange('profile_visibility', 'public')}
                    >
                      Public
                    </Button>
                    <Button
                      variant={privacySettings.profile_visibility === 'private' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePrivacySettingChange('profile_visibility', 'private')}
                    >
                      Private
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Data Sharing</h4>
                    <p className="text-sm text-muted-foreground">
                      Allow data sharing for analytics and improvements
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.data_sharing}
                    onCheckedChange={(checked) => handlePrivacySettingChange('data_sharing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Emails</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive promotional emails and newsletters
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.marketing_emails}
                    onCheckedChange={(checked) => handlePrivacySettingChange('marketing_emails', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Analytics Tracking</h4>
                    <p className="text-sm text-muted-foreground">
                      Help improve our service with usage analytics
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.analytics_tracking}
                    onCheckedChange={(checked) => handlePrivacySettingChange('analytics_tracking', checked)}
                  />
                </div>

                <Button
                  onClick={updatePrivacySettings}
                  className="w-full md:w-auto"
                >
                  Update Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountSettingsPage;