import express from 'express';
import notificationService from './notificationService.js';
import { supabase } from './supabaseClient.js';
import { requireAuth, requireRole } from './middleware.js';

const router = express.Router();

// ===== EMAIL TEMPLATES MANAGEMENT =====

// GET /api/notifications/templates - List available email templates
router.get('/templates', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const templates = await notificationService.getAllEmailTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

// POST /api/notifications/templates - Create new email template
router.post('/templates', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { template_key, name, subject, html_body, text_body, variables, is_active } = req.body;

    if (!template_key || !name || !subject || !html_body) {
      return res.status(400).json({
        error: 'Missing required fields: template_key, name, subject, html_body'
      });
    }

    const template = await notificationService.upsertEmailTemplate({
      template_key,
      name,
      subject,
      html_body,
      text_body,
      variables: variables || [],
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ error: 'Failed to create email template' });
  }
});

// PUT /api/notifications/templates/:templateKey - Update email template
router.put('/templates/:templateKey', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { name, subject, html_body, text_body, variables, is_active } = req.body;

    const template = await notificationService.upsertEmailTemplate({
      template_key: req.params.templateKey,
      name,
      subject,
      html_body,
      text_body,
      variables: variables || [],
      is_active: is_active !== undefined ? is_active : true,
    });

    res.json(template);
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ error: 'Failed to update email template' });
  }
});

// DELETE /api/notifications/templates/:templateKey - Delete email template
router.delete('/templates/:templateKey', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('template_key', req.params.templateKey);

    if (error) throw error;
    res.json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ error: 'Failed to delete email template' });
  }
});

// ===== NOTIFICATION PREFERENCES =====

// GET /api/notifications/preferences - Get user notification preferences
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const preferences = await notificationService.getUserPreferences(req.user.id);
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// PUT /api/notifications/preferences - Update user notification preferences
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const allowedFields = [
      'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled',
      'refund_processed', 'marketing_emails'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = Boolean(req.body[field]);
      }
    });

    const preferences = await notificationService.updateUserPreferences(req.user.id, updates);
    res.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// ===== NOTIFICATION LOGS =====

// GET /api/notifications/logs - Get user notification history
router.get('/logs', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await notificationService.getNotificationLogs(req.user.id, limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching notification logs:', error);
    res.status(500).json({ error: 'Failed to fetch notification logs' });
  }
});

// ===== SEND NOTIFICATIONS =====

// POST /api/notifications/send - Send custom notification
router.post('/send', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { to, subject, html, text, userId, orderId } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, html'
      });
    }

    const result = await notificationService.sendCustomNotification({
      to,
      subject,
      html,
      text,
      userId,
      orderId,
    });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      ...result
    });
  } catch (error) {
    console.error('Error sending custom notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// POST /api/notifications/send-template - Send notification using template
router.post('/send-template', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { templateKey, userId, orderId, customVariables } = req.body;

    if (!templateKey || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: templateKey, userId'
      });
    }

    const result = await notificationService.sendNotification(
      templateKey,
      userId,
      orderId,
      customVariables || {}
    );

    res.json({
      success: true,
      message: 'Template notification sent successfully',
      ...result
    });
  } catch (error) {
    console.error('Error sending template notification:', error);
    res.status(500).json({ error: 'Failed to send template notification' });
  }
});

// ===== ADMIN ENDPOINTS =====

// GET /api/notifications/admin/logs - Admin view of notification logs
router.get('/admin/logs', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { status, template_key, limit = 100, offset = 0 } = req.query;

    let query = supabase
      .from('notification_logs')
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (template_key) {
      query = query.eq('template_key', template_key);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      logs: data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error fetching admin notification logs:', error);
    res.status(500).json({ error: 'Failed to fetch notification logs' });
  }
});

// GET /api/notifications/admin/stats - Notification statistics
router.get('/admin/stats', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    // Get notification stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('notification_logs')
      .select('status, template_key, sent_at')
      .gte('sent_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total_sent: data.filter(log => log.status === 'sent').length,
      total_failed: data.filter(log => log.status === 'failed').length,
      total_bounced: data.filter(log => log.status === 'bounced').length,
      template_breakdown: {},
      daily_stats: {},
    };

    // Template breakdown
    data.forEach(log => {
      if (!stats.template_breakdown[log.template_key]) {
        stats.template_breakdown[log.template_key] = { sent: 0, failed: 0 };
      }
      if (log.status === 'sent') {
        stats.template_breakdown[log.template_key].sent++;
      } else if (log.status === 'failed') {
        stats.template_breakdown[log.template_key].failed++;
      }
    });

    // Daily stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = data.filter(log => new Date(log.sent_at) >= sevenDaysAgo);

    recentLogs.forEach(log => {
      const date = new Date(log.sent_at).toISOString().split('T')[0];
      if (!stats.daily_stats[date]) {
        stats.daily_stats[date] = { sent: 0, failed: 0 };
      }
      if (log.status === 'sent') {
        stats.daily_stats[date].sent++;
      } else if (log.status === 'failed') {
        stats.daily_stats[date].failed++;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

export default router;