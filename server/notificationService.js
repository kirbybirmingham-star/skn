import { supabase } from './supabaseClient.js';
import emailService from './emailService.js';
import emailQueue from './emailQueue.js';

class NotificationService {
  constructor() {
    this.emailService = emailService;
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return data || {
        user_id: userId,
        order_confirmed: true,
        order_shipped: true,
        order_delivered: true,
        order_cancelled: true,
        refund_processed: true,
        marketing_emails: false,
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Get email template by key
   */
  async getEmailTemplate(templateKey) {
    try {
      const { data, error } = await supabaseClient
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error getting template ${templateKey}:`, error);
      throw error;
    }
  }

  /**
   * Get all email templates
   */
  async getAllEmailTemplates() {
    try {
      const { data, error } = await supabaseClient
        .from('email_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting email templates:', error);
      throw error;
    }
  }

  /**
   * Create or update email template
   */
  async upsertEmailTemplate(templateData) {
    try {
      const { data, error } = await supabaseClient
        .from('email_templates')
        .upsert({
          ...templateData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting email template:', error);
      throw error;
    }
  }

  /**
   * Send notification using template
   */
  async sendNotification(templateKey, userId, orderId, customVariables = {}) {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);

      // Check if user wants this type of notification
      const preferenceKey = this.templateKeyToPreference(templateKey);
      if (preferenceKey && !preferences[preferenceKey]) {
        console.log(`User ${userId} has disabled ${preferenceKey} notifications`);
        return { skipped: true, reason: 'user_preference_disabled' };
      }

      // Get user email
      const { data: userData, error: userError } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!userData.email) {
        throw new Error('User has no email address');
      }

      // Get template
      const template = await this.getEmailTemplate(templateKey);

      // Prepare variables for template
      const variables = await this.prepareTemplateVariables(templateKey, userId, orderId, userData, customVariables);

      // Send email via queue for better reliability
      const emailResult = await this.emailService.sendTemplateEmail(template, variables, userData.email);

      // Log the notification
      await this.logNotification({
        user_id: userId,
        order_id: orderId,
        template_key: templateKey,
        email_address: userData.email,
        subject: template.subject,
        status: emailResult.success ? 'sent' : 'failed',
        error_message: emailResult.success ? null : emailResult.error,
        metadata: emailResult,
      });

      return emailResult;
    } catch (error) {
      console.error('Error sending notification:', error);

      // Log failed notification
      if (userId && templateKey) {
        await this.logNotification({
          user_id: userId,
          order_id: orderId,
          template_key: templateKey,
          email_address: 'unknown',
          subject: 'Error sending notification',
          status: 'failed',
          error_message: error.message,
        });
      }

      throw error;
    }
  }

  /**
   * Send custom notification (not using template)
   */
  async sendCustomNotification({ to, subject, html, text, userId, orderId }) {
    try {
      const emailResult = await this.emailService.sendEmail({
        to,
        subject,
        html,
        text,
      });

      // Log the notification
      await this.logNotification({
        user_id: userId,
        order_id: orderId,
        template_key: 'custom',
        email_address: to,
        subject,
        status: emailResult.success ? 'sent' : 'failed',
        error_message: emailResult.success ? null : emailResult.error,
        metadata: emailResult,
      });

      return emailResult;
    } catch (error) {
      console.error('Error sending custom notification:', error);
      throw error;
    }
  }

  /**
   * Log notification to database
   */
  async logNotification(logData) {
    try {
      const { error } = await supabaseClient
        .from('notification_logs')
        .insert(logData);

      if (error) {
        console.error('Error logging notification:', error);
      }
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Get notification logs for user
   */
  async getNotificationLogs(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting notification logs:', error);
      throw error;
    }
  }

  /**
   * Prepare variables for email template
   */
  async prepareTemplateVariables(templateKey, userId, orderId, userData, customVariables = {}) {
    const baseVariables = {
      user_name: userData.full_name || 'Valued Customer',
      user_email: userData.email,
      current_year: new Date().getFullYear(),
      ...customVariables,
    };

    if (orderId) {
      try {
        // Get order details
        const { data: orderData, error: orderError } = await supabaseClient
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (title),
              product_variants (sku)
            )
          `)
          .eq('id', orderId)
          .single();

        if (!orderError && orderData) {
          baseVariables.order_id = orderData.id;
          baseVariables.order_total = `$${(orderData.total_amount / 100).toFixed(2)}`;
          baseVariables.order_status = orderData.status;
          baseVariables.order_date = new Date(orderData.created_at).toLocaleDateString();
          baseVariables.tracking_number = orderData.tracking_number || 'Not available';
          baseVariables.shipping_carrier = orderData.shipping_carrier || 'To be determined';

          // Add order items summary
          if (orderData.order_items && orderData.order_items.length > 0) {
            baseVariables.order_items = orderData.order_items.map(item =>
              `${item.products?.title || 'Product'} (${item.quantity}x) - $${(item.total_price / 100).toFixed(2)}`
            ).join('\n');
          }
        }
      } catch (error) {
        console.error('Error preparing order variables:', error);
      }
    }

    // Add template-specific variables
    switch (templateKey) {
      case 'order_confirmed':
        baseVariables.estimated_delivery = customVariables.estimated_delivery || '3-5 business days';
        break;
      case 'order_shipped':
        baseVariables.tracking_url = customVariables.tracking_url || '#';
        break;
      case 'order_delivered':
        baseVariables.delivery_date = customVariables.delivery_date || new Date().toLocaleDateString();
        break;
      case 'refund_approved':
        baseVariables.refund_amount = `$${(customVariables.refund_amount / 100).toFixed(2)}`;
        baseVariables.refund_id = customVariables.refund_id;
        break;
      case 'refund_rejected':
        baseVariables.refund_id = customVariables.refund_id;
        break;
      case 'refund_processed':
        baseVariables.refund_amount = `$${(customVariables.refund_amount / 100).toFixed(2)}`;
        baseVariables.paypal_refund_id = customVariables.paypal_refund_id;
        baseVariables.processing_date = new Date().toLocaleDateString();
        break;
    }

    return baseVariables;
  }

  /**
   * Convert template key to preference key
   */
  templateKeyToPreference(templateKey) {
    const mapping = {
      'order_confirmed': 'order_confirmed',
      'order_shipped': 'order_shipped',
      'order_delivered': 'order_delivered',
      'order_cancelled': 'order_cancelled',
      'refund_processed': 'refund_processed',
    };
    return mapping[templateKey];
  }

  /**
   * Trigger notifications based on order status change
   */
  async triggerOrderStatusNotification(orderId, oldStatus, newStatus, userId) {
    try {
      const templateKey = this.getTemplateForStatus(newStatus);
      if (!templateKey) return;

      await this.sendNotification(templateKey, userId, orderId, {
        old_status: oldStatus,
        new_status: newStatus,
      });
    } catch (error) {
      console.error('Error triggering order status notification:', error);
    }
  }

  /**
   * Get template key for order status
   */
  getTemplateForStatus(status) {
    const statusTemplates = {
      'confirmed': 'order_confirmed',
      'paid': 'order_confirmed',
      'shipped': 'order_shipped',
      'delivered': 'order_delivered',
      'cancelled': 'order_cancelled',
      'refunded': 'refund_processed',
    };
    return statusTemplates[status];
  }

  /**
   * Trigger refund status notification
   */
  async triggerRefundStatusNotification(refundId, userId, orderId, status, refundData = {}) {
    try {
      const templateKey = this.getTemplateForRefundStatus(status);
      if (!templateKey) return;

      await this.sendNotification(templateKey, userId, orderId, {
        refund_id: refundId,
        refund_status: status,
        refund_amount: refundData.amount_approved || refundData.amount_requested,
        paypal_refund_id: refundData.paypal_refund_id,
        ...refundData,
      });
    } catch (error) {
      console.error('Error triggering refund status notification:', error);
    }
  }

  /**
   * Get template key for refund status
   */
  getTemplateForRefundStatus(status) {
    const refundTemplates = {
      'approved': 'refund_approved',
      'rejected': 'refund_rejected',
      'processed': 'refund_processed',
    };
    return refundTemplates[status];
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;