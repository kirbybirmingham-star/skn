import { supabase as supabaseClient } from '../server/supabaseClient.js';

const defaultTemplates = [
  {
    template_key: 'order_confirmed',
    name: 'Order Confirmation',
    subject: 'Your SKN Shop Order #{{order_id}} Has Been Confirmed',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
    .content { padding: 20px 0; }
    .order-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Thank you for shopping with SKN Shop</p>
    </div>

    <div class="content">
      <p>Hi {{user_name}},</p>

      <p>Great news! Your order has been confirmed and is now being processed.</p>

      <div class="order-details">
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> {{order_id}}</p>
        <p><strong>Total Amount:</strong> {{order_total}}</p>
        <p><strong>Order Date:</strong> {{order_date}}</p>
        <p><strong>Estimated Delivery:</strong> {{estimated_delivery}}</p>
      </div>

      <h4>What's Next?</h4>
      <ul>
        <li>We'll start preparing your order for shipment</li>
        <li>You'll receive another email when your order ships</li>
        <li>Track your order status in your account dashboard</li>
      </ul>

      <p>If you have any questions, feel free to contact our support team.</p>

      <p>Best regards,<br>The SKN Shop Team</p>
    </div>

    <div class="footer">
      <p>This email was sent to {{user_email}} because you placed an order with SKN Shop.</p>
      <p>© {{current_year}} SKN Shop. All rights reserved.</p>
      <p><a href="{{unsubscribe_link}}">Unsubscribe from order notifications</a></p>
    </div>
  </div>
</body>
</html>`,
    text_body: `Order Confirmed!

Hi {{user_name}},

Great news! Your order has been confirmed and is now being processed.

Order Details:
- Order ID: {{order_id}}
- Total Amount: {{order_total}}
- Order Date: {{order_date}}
- Estimated Delivery: {{estimated_delivery}}

What's Next?
- We'll start preparing your order for shipment
- You'll receive another email when your order ships
- Track your order status in your account dashboard

If you have any questions, feel free to contact our support team.

Best regards,
The SKN Shop Team

---
This email was sent to {{user_email}} because you placed an order with SKN Shop.
© {{current_year}} SKN Shop. All rights reserved.
Unsubscribe: {{unsubscribe_link}}`,
    variables: ['user_name', 'user_email', 'order_id', 'order_total', 'order_date', 'estimated_delivery', 'current_year', 'unsubscribe_link'],
    is_active: true
  },
  {
    template_key: 'order_shipped',
    name: 'Order Shipped',
    subject: 'Your SKN Shop Order #{{order_id}} Has Been Shipped',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Shipped</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px; }
    .content { padding: 20px 0; }
    .shipping-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .tracking-button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚚 Order Shipped!</h1>
      <p>Your order is on its way</p>
    </div>

    <div class="content">
      <p>Hi {{user_name}},</p>

      <p>Great news! Your order has been shipped and is on its way to you.</p>

      <div class="shipping-details">
        <h3>Shipping Details</h3>
        <p><strong>Order ID:</strong> {{order_id}}</p>
        <p><strong>Tracking Number:</strong> {{tracking_number}}</p>
        <p><strong>Shipping Carrier:</strong> {{shipping_carrier}}</p>
        <p><strong>Shipped Date:</strong> {{order_date}}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{tracking_url}}" class="tracking-button">Track Your Package</a>
      </div>

      <h4>What to Expect Next</h4>
      <ul>
        <li>Package delivery typically takes 2-5 business days</li>
        <li>You'll receive another notification when delivered</li>
        <li>Check your email for delivery updates</li>
      </ul>

      <p>Questions about your order? Contact us anytime.</p>

      <p>Happy shopping,<br>The SKN Shop Team</p>
    </div>

    <div class="footer">
      <p>This email was sent to {{user_email}} about order {{order_id}}.</p>
      <p>© {{current_year}} SKN Shop. All rights reserved.</p>
      <p><a href="{{unsubscribe_link}}">Unsubscribe from order notifications</a></p>
    </div>
  </div>
</body>
</html>`,
    text_body: `Order Shipped!

Hi {{user_name}},

Great news! Your order has been shipped and is on its way to you.

Shipping Details:
- Order ID: {{order_id}}
- Tracking Number: {{tracking_number}}
- Shipping Carrier: {{shipping_carrier}}
- Shipped Date: {{order_date}}

Track your package: {{tracking_url}}

What to Expect Next:
- Package delivery typically takes 2-5 business days
- You'll receive another notification when delivered
- Check your email for delivery updates

Questions about your order? Contact us anytime.

Happy shopping,
The SKN Shop Team

---
This email was sent to {{user_email}} about order {{order_id}}.
© {{current_year}} SKN Shop. All rights reserved.
Unsubscribe: {{unsubscribe_link}}`,
    variables: ['user_name', 'user_email', 'order_id', 'tracking_number', 'shipping_carrier', 'order_date', 'tracking_url', 'current_year', 'unsubscribe_link'],
    is_active: true
  },
  {
    template_key: 'order_delivered',
    name: 'Order Delivered',
    subject: 'Your SKN Shop Order #{{order_id}} Has Been Delivered',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Delivered</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px; }
    .content { padding: 20px 0; }
    .delivered-details { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .review-button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Delivered!</h1>
      <p>Your package has arrived safely</p>
    </div>

    <div class="content">
      <p>Hi {{user_name}},</p>

      <p>Great news! Your order has been successfully delivered.</p>

      <div class="delivered-details">
        <h3>Delivery Confirmation</h3>
        <p><strong>Order ID:</strong> {{order_id}}</p>
        <p><strong>Delivery Date:</strong> {{delivery_date}}</p>
        <p><strong>Total Amount:</strong> {{order_total}}</p>
      </div>

      <p>We hope you're enjoying your purchase! Your satisfaction is our top priority.</p>

      <h4>Need Help?</h4>
      <ul>
        <li>Questions about your order? Contact our support team</li>
        <li>Need to return an item? Check our return policy</li>
        <li>Issues with your delivery? Let us know</li>
      </ul>

      <div style="text-align: center;">
        <a href="{{review_url}}" class="review-button">Leave a Review</a>
      </div>

      <p>Thank you for choosing SKN Shop!</p>

      <p>Best regards,<br>The SKN Shop Team</p>
    </div>

    <div class="footer">
      <p>This email was sent to {{user_email}} about order {{order_id}}.</p>
      <p>© {{current_year}} SKN Shop. All rights reserved.</p>
      <p><a href="{{unsubscribe_link}}">Unsubscribe from order notifications</a></p>
    </div>
  </div>
</body>
</html>`,
    text_body: `Order Delivered!

Hi {{user_name}},

Great news! Your order has been successfully delivered.

Delivery Confirmation:
- Order ID: {{order_id}}
- Delivery Date: {{delivery_date}}
- Total Amount: {{order_total}}

We hope you're enjoying your purchase! Your satisfaction is our top priority.

Need Help?
- Questions about your order? Contact our support team
- Need to return an item? Check our return policy
- Issues with your delivery? Let us know

Leave a review: {{review_url}}

Thank you for choosing SKN Shop!

Best regards,
The SKN Shop Team

---
This email was sent to {{user_email}} about order {{order_id}}.
© {{current_year}} SKN Shop. All rights reserved.
Unsubscribe: {{unsubscribe_link}}`,
    variables: ['user_name', 'user_email', 'order_id', 'delivery_date', 'order_total', 'review_url', 'current_year', 'unsubscribe_link'],
    is_active: true
  },
  {
    template_key: 'order_cancelled',
    name: 'Order Cancellation',
    subject: 'Your SKN Shop Order #{{order_id}} Has Been Cancelled',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Cancelled</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px; }
    .content { padding: 20px 0; }
    .cancellation-details { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .refund-info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .contact-button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Cancelled</h1>
      <p>We're sorry for the inconvenience</p>
    </div>

    <div class="content">
      <p>Hi {{user_name}},</p>

      <p>We're writing to confirm that your order has been cancelled.</p>

      <div class="cancellation-details">
        <h3>Cancellation Details</h3>
        <p><strong>Order ID:</strong> {{order_id}}</p>
        <p><strong>Order Total:</strong> {{order_total}}</p>
        <p><strong>Cancellation Reason:</strong> {{cancellation_reason}}</p>
      </div>

      <div class="refund-info">
        <h4>Refund Information</h4>
        <p>If payment was already processed, a refund will be initiated automatically.</p>
        <p>Refunds typically take 3-5 business days to appear in your original payment method.</p>
        <p>You'll receive a separate email confirmation once the refund is processed.</p>
      </div>

      <p>We apologize for any inconvenience this may have caused.</p>

      <h4>Questions or Concerns?</h4>
      <p>If you have any questions about this cancellation or need assistance, please don't hesitate to contact us.</p>

      <div style="text-align: center;">
        <a href="{{contact_url}}" class="contact-button">Contact Support</a>
      </div>

      <p>We hope to serve you again in the future.</p>

      <p>Best regards,<br>The SKN Shop Team</p>
    </div>

    <div class="footer">
      <p>This email was sent to {{user_email}} about order {{order_id}}.</p>
      <p>© {{current_year}} SKN Shop. All rights reserved.</p>
      <p><a href="{{unsubscribe_link}}">Unsubscribe from order notifications</a></p>
    </div>
  </div>
</body>
</html>`,
    text_body: `Order Cancelled

Hi {{user_name}},

We're writing to confirm that your order has been cancelled.

Cancellation Details:
- Order ID: {{order_id}}
- Order Total: {{order_total}}
- Cancellation Reason: {{cancellation_reason}}

Refund Information:
If payment was already processed, a refund will be initiated automatically.
Refunds typically take 3-5 business days to appear in your original payment method.
You'll receive a separate email confirmation once the refund is processed.

We apologize for any inconvenience this may have caused.

Questions or Concerns?
If you have any questions about this cancellation or need assistance, please contact us at {{contact_url}}.

We hope to serve you again in the future.

Best regards,
The SKN Shop Team

---
This email was sent to {{user_email}} about order {{order_id}}.
© {{current_year}} SKN Shop. All rights reserved.
Unsubscribe: {{unsubscribe_link}}`,
    variables: ['user_name', 'user_email', 'order_id', 'order_total', 'cancellation_reason', 'contact_url', 'current_year', 'unsubscribe_link'],
    is_active: true
  }
];

async function createDefaultTemplates() {
  console.log('Creating default email templates...');

  try {
    for (const template of defaultTemplates) {
      console.log(`Creating template: ${template.template_key}`);

      const { error } = await supabaseClient
        .from('email_templates')
        .upsert(template, { onConflict: 'template_key' });

      if (error) {
        console.error(`Error creating template ${template.template_key}:`, error);
      } else {
        console.log(`✓ Template ${template.template_key} created/updated`);
      }
    }

    console.log('Default email templates created successfully!');
  } catch (error) {
    console.error('Error creating default templates:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDefaultTemplates();
}

export default createDefaultTemplates;