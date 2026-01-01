# SKN Shop Notification System

A comprehensive email notification system integrated with the order management database schema. This system handles automated notifications for order status changes, user preferences management, and email delivery tracking.

## Features

### 🎯 **Email Templates**
- Customizable HTML email templates with dynamic content
- Support for variable substitution ({{variable_name}})
- Template management via API
- Default templates for order confirmations, shipping updates, and deliveries

### 📧 **Event-Driven Notifications**
- Automatic notifications on order status changes
- User preference-based filtering
- Template-based email generation
- Integration with order status management system

### 👤 **User Preferences**
- Granular notification preferences per user
- Order confirmation, shipping, delivery, and cancellation notifications
- Marketing email opt-in/opt-out
- RESTful API for preference management

### 📊 **Email Queue & Delivery**
- Asynchronous email processing with retry logic
- Failed email handling and dead letter queue
- Delivery status tracking
- Rate limiting and batch processing

### 🔐 **Security & Compliance**
- Row Level Security (RLS) policies
- User data protection
- Unsubscribe functionality
- Audit logging of all notifications

## Database Schema

The notification system extends the existing order management schema with:

- `email_templates` - Stores customizable email templates
- `notification_preferences` - User notification preferences
- `notification_logs` - Complete audit trail of sent notifications

## API Endpoints

### Email Templates
```
GET    /api/notifications/templates          # List all templates (admin)
POST   /api/notifications/templates          # Create new template (admin)
PUT    /api/notifications/templates/:key     # Update template (admin)
DELETE /api/notifications/templates/:key     # Delete template (admin)
```

### User Preferences
```
GET  /api/notifications/preferences           # Get user preferences
PUT  /api/notifications/preferences           # Update user preferences
```

### Notification Logs
```
GET  /api/notifications/logs                   # Get user's notification history
GET  /api/notifications/admin/logs            # Admin view of all logs
GET  /api/notifications/admin/stats           # Notification statistics
```

### Send Notifications
```
POST /api/notifications/send                  # Send custom notification (admin)
POST /api/notifications/send-template         # Send template notification (admin)
```

## Email Templates

### Default Templates Included

1. **Order Confirmation** (`order_confirmed`)
   - Sent when order status changes to 'confirmed'
   - Includes order details, items, and expected delivery

2. **Order Shipped** (`order_shipped`)
   - Sent when order status changes to 'shipped'
   - Includes tracking number and carrier information

3. **Order Delivered** (`order_delivered`)
   - Sent when order status changes to 'delivered'
   - Includes delivery confirmation and review request

4. **Order Cancelled** (`order_cancelled`)
   - Sent when order status changes to 'cancelled'
   - Includes cancellation reason and refund information

### Template Variables

Templates support dynamic content through variables:
- `{{user_name}}` - Customer's full name
- `{{user_email}}` - Customer's email address
- `{{order_id}}` - Order ID
- `{{order_total}}` - Formatted order total
- `{{order_date}}` - Order creation date
- `{{tracking_number}}` - Shipping tracking number
- `{{shipping_carrier}}` - Shipping carrier name
- And more...

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password
EMAIL_FROM=noreply@sknshop.com

# Frontend URL for unsubscribe links
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup

For Gmail SMTP:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password as `EMAIL_SMTP_PASS`

## Usage Examples

### Send Custom Notification
```javascript
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'customer@example.com',
    subject: 'Custom Notification',
    html: '<h1>Hello!</h1><p>This is a custom notification.</p>',
    userId: 'user-uuid',
    orderId: 'order-uuid'
  })
});
```

### Update User Preferences
```javascript
const response = await fetch('/api/notifications/preferences', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    order_confirmed: true,
    order_shipped: true,
    order_delivered: true,
    order_cancelled: false,
    marketing_emails: false
  })
});
```

### Create Custom Template
```javascript
const response = await fetch('/api/notifications/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template_key: 'custom_welcome',
    name: 'Welcome Email',
    subject: 'Welcome to SKN Shop, {{user_name}}!',
    html_body: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
    variables: ['user_name'],
    is_active: true
  })
});
```

## Integration with Order Management

The notification system automatically integrates with the order status management system:

1. When an order status changes, the system checks user preferences
2. If notifications are enabled for that status, it sends the appropriate template
3. All notifications are logged to the `notification_logs` table
4. Email delivery status is tracked

### Automatic Triggers

- `confirmed` → Order Confirmation Email
- `shipped` → Shipping Notification Email
- `delivered` → Delivery Confirmation Email
- `cancelled` → Cancellation Notification Email

## Monitoring & Analytics

### Notification Statistics

Admin users can view:
- Total emails sent/failed/bounced
- Template usage breakdown
- Daily/weekly notification trends
- User engagement metrics

### Queue Monitoring

The email queue provides:
- Current queue length
- Processing status
- Retry statistics
- Failed email handling

## Security Considerations

1. **Row Level Security**: All notification tables have RLS policies
2. **User Data Protection**: Emails are only accessible to the user or admins
3. **Rate Limiting**: SMTP rate limiting prevents abuse
4. **Audit Logging**: All notification activities are logged
5. **Unsubscribe Links**: All emails include unsubscribe functionality

## Troubleshooting

### Common Issues

1. **"Supabase env vars not present"**
   - Ensure `.env` file has correct Supabase credentials
   - Check environment variable names match exactly

2. **"Email service configuration error"**
   - Verify SMTP credentials are correct
   - Check Gmail app password if using Gmail
   - Ensure SMTP server allows connections

3. **Notifications not sending**
   - Check user preferences are enabled
   - Verify email templates exist and are active
   - Check server logs for errors

4. **Template variables not replacing**
   - Ensure variable names match exactly (case-sensitive)
   - Check template `variables` array includes all used variables

### Logs & Debugging

- Server console logs show email sending attempts
- `notification_logs` table contains delivery status
- Email queue statistics available via queue methods
- Supabase logs show database operations

## Development

### Testing Email Templates

You can test templates without sending emails by:
1. Using the API endpoints to create/modify templates
2. Checking the preview functionality (if implemented)
3. Reviewing template variables and content

### Adding New Templates

1. Create template in database via API
2. Add corresponding status mapping in notification service
3. Update user preferences if needed
4. Test the integration

## Future Enhancements

- Email open/read tracking
- A/B testing for email templates
- SMS notifications
- Push notifications
- Advanced analytics dashboard
- Template versioning
- Bulk email campaigns
- Email scheduling