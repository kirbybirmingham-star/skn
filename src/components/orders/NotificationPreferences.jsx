import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Mail, Package, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';

import { supabase } from '../../lib/customSupabaseClient';

// Real API integration
const fetchNotificationPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    // Return default preferences if no record exists
    return data || {
      email_order_confirmations: true,
      email_shipping_updates: true,
      email_delivery_notifications: true,
      email_promotional_offers: false,
      email_payment_reminders: true,
      email_return_updates: true,
      email_refund_notifications: true
    };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
};

const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

const NotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [preferences, setPreferences] = useState({
    email_order_confirmations: true,
    email_shipping_updates: true,
    email_delivery_notifications: true,
    email_promotional_offers: false,
    email_payment_reminders: true,
    email_return_updates: true,
    email_refund_notifications: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const notificationTypes = [
    {
      key: 'email_order_confirmations',
      title: 'Order Confirmations',
      description: 'Receive emails when your orders are placed and confirmed',
      icon: Package,
      category: 'orders'
    },
    {
      key: 'email_shipping_updates',
      title: 'Shipping Updates',
      description: 'Get notified when your orders are shipped and tracking information is available',
      icon: Package,
      category: 'orders'
    },
    {
      key: 'email_delivery_notifications',
      title: 'Delivery Notifications',
      description: 'Receive alerts when your orders are delivered',
      icon: Package,
      category: 'orders'
    },
    {
      key: 'email_payment_reminders',
      title: 'Payment Reminders',
      description: 'Get reminders about upcoming payments or payment issues',
      icon: CreditCard,
      category: 'payments'
    },
    {
      key: 'email_return_updates',
      title: 'Return & Exchange Updates',
      description: 'Notifications about return requests and exchange status',
      icon: RefreshCw,
      category: 'returns'
    },
    {
      key: 'email_refund_notifications',
      title: 'Refund Notifications',
      description: 'Receive updates on refund processing and completion',
      icon: CreditCard,
      category: 'payments'
    },
    {
      key: 'email_promotional_offers',
      title: 'Promotional Offers',
      description: 'Special deals, discounts, and promotional emails',
      icon: Bell,
      category: 'marketing'
    }
  ];

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const data = await fetchNotificationPreferences(user.id);
      setPreferences(data);
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notification preferences."
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async () => {
    try {
      setSaving(true);
      await updateNotificationPreferences(user.id, preferences);

      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved successfully."
      });
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update notification preferences. Please try again."
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleAllInCategory = (category, enabled) => {
    const categoryPreferences = notificationTypes
      .filter(type => type.category === category)
      .map(type => type.key);

    setPreferences(prev => {
      const updated = { ...prev };
      categoryPreferences.forEach(key => {
        updated[key] = enabled;
      });
      return updated;
    });
  };

  const getCategoryPreferences = (category) => {
    return notificationTypes.filter(type => type.category === category);
  };

  const isCategoryFullyEnabled = (category) => {
    const categoryPrefs = getCategoryPreferences(category);
    return categoryPrefs.every(type => preferences[type.key]);
  };

  const isCategoryPartiallyEnabled = (category) => {
    const categoryPrefs = getCategoryPreferences(category);
    const enabledCount = categoryPrefs.filter(type => preferences[type.key]).length;
    return enabledCount > 0 && enabledCount < categoryPrefs.length;
  };

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const categories = ['orders', 'payments', 'returns', 'marketing'];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notification Preferences
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose how you want to be notified about your orders and account activity.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {categories.map((category) => {
          const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
          const categoryTypes = getCategoryPreferences(category);
          const fullyEnabled = isCategoryFullyEnabled(category);
          const partiallyEnabled = isCategoryPartiallyEnabled(category);

          return (
            <div key={category} className="space-y-4">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{categoryName} Notifications</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {categoryTypes.filter(type => preferences[type.key]).length} of {categoryTypes.length} enabled
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllInCategory(category, !fullyEnabled)}
                  >
                    {fullyEnabled ? 'Disable All' : 'Enable All'}
                  </Button>
                </div>
              </div>

              {/* Individual Preferences */}
              <div className="space-y-4 pl-4 border-l-2 border-gray-100">
                {categoryTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <div key={type.key} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        <IconComponent className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{type.title}</h4>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                          <Switch
                            checked={preferences[type.key]}
                            onCheckedChange={(checked) => handlePreferenceChange(type.key, checked)}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Save Button */}
        <div className="pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>All notifications are sent to: {user?.email}</span>
            </div>
            <Button
              onClick={updatePreferences}
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Important Notifications</p>
              <p className="text-blue-700 mt-1">
                Order confirmations, shipping updates, and payment-related notifications cannot be disabled
                as they contain important information about your purchases and account security.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;