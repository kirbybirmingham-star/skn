# Enhanced Order Management Database Schema

This document contains the complete SQL migration script for implementing an enhanced order management system that builds upon the existing SKN Shop database schema.

## Overview

The enhanced system adds comprehensive order management capabilities including:
- Extended order status tracking (pending, confirmed, shipped, delivered, cancelled)
- Order audit trail with status history
- Fulfillment workflow with shipping details
- Notification system with email templates
- Refund and cancellation handling
- Analytics and reporting tables
- Vendor order management views
- Performance optimizations and security policies

## Migration Script

```sql
-- Enhanced Order Management System Migration
-- Generated: 2025-11-13
-- This migration builds upon the existing SKN Shop schema to add comprehensive order management features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== 1. EXTEND ORDER STATUS ENUM =====
-- Add new order status values while maintaining backward compatibility
DO $$
BEGIN
    -- Add new enum values if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.order_status'::regtype AND enumlabel = 'confirmed') THEN
        ALTER TYPE public.order_status ADD VALUE 'confirmed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.order_status'::regtype AND enumlabel = 'shipped') THEN
        ALTER TYPE public.order_status ADD VALUE 'shipped';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.order_status'::regtype AND enumlabel = 'delivered') THEN
        ALTER TYPE public.order_status ADD VALUE 'delivered';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===== 2. ADD FULFILLMENT WORKFLOW COLUMNS TO ORDERS =====
-- Add shipping and fulfillment tracking fields
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS shipping_carrier text,
ADD COLUMN IF NOT EXISTS estimated_delivery timestamptz,
ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS fulfillment_notes text;

-- ===== 3. ORDER STATUS HISTORY TABLE =====
-- Tracks all status changes for audit trail and compliance
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status public.order_status,
    new_status public.order_status NOT NULL,
    changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    change_reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS order_status_history_created_at_idx ON public.order_status_history(created_at);
CREATE INDEX IF NOT EXISTS order_status_history_new_status_idx ON public.order_status_history(new_status);

-- ===== 4. EMAIL TEMPLATES TABLE =====
-- Stores email templates for order notifications
CREATE TABLE IF NOT EXISTS public.email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key text NOT NULL UNIQUE, -- e.g., 'order_confirmed', 'order_shipped'
    name text NOT NULL,
    subject text NOT NULL,
    html_body text NOT NULL,
    text_body text,
    variables jsonb DEFAULT '[]'::jsonb, -- Array of variable names used in template
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER email_templates_set_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ===== 5. NOTIFICATION PREFERENCES TABLE =====
-- Stores user preferences for email notifications
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_confirmed boolean DEFAULT true,
    order_shipped boolean DEFAULT true,
    order_delivered boolean DEFAULT true,
    order_cancelled boolean DEFAULT true,
    refund_processed boolean DEFAULT true,
    marketing_emails boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Trigger for updated_at
CREATE TRIGGER notification_preferences_set_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ===== 6. NOTIFICATION LOGS TABLE =====
-- Logs all sent notifications for audit and analytics
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    template_key text NOT NULL,
    email_address text NOT NULL,
    subject text NOT NULL,
    status text DEFAULT 'sent', -- 'sent', 'failed', 'bounced'
    sent_at timestamptz DEFAULT now(),
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS notification_logs_user_idx ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS notification_logs_order_idx ON public.notification_logs(order_id);
CREATE INDEX IF NOT EXISTS notification_logs_sent_at_idx ON public.notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS notification_logs_status_idx ON public.notification_logs(status);

-- ===== 7. CANCELLATION REASONS TABLE =====
-- Standardized cancellation reasons for orders
CREATE TABLE IF NOT EXISTS public.cancellation_reasons (
    id serial PRIMARY KEY,
    reason_code text NOT NULL UNIQUE,
    reason_text text NOT NULL,
    requires_approval boolean DEFAULT false,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Insert default cancellation reasons
INSERT INTO public.cancellation_reasons (reason_code, reason_text, requires_approval, sort_order) VALUES
('customer_request', 'Customer requested cancellation', false, 1),
('payment_failed', 'Payment failed', false, 2),
('item_unavailable', 'Item became unavailable', true, 3),
('shipping_issue', 'Shipping address issue', false, 4),
('duplicate_order', 'Accidental duplicate order', false, 5),
('fraud_suspected', 'Fraud suspected', true, 6),
('other', 'Other reason', true, 7)
ON CONFLICT (reason_code) DO NOTHING;

-- ===== 8. REFUND REQUESTS TABLE =====
-- Handles refund requests and processing
CREATE TABLE IF NOT EXISTS public.refund_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    amount_requested integer NOT NULL, -- in cents
    amount_approved integer, -- in cents, NULL if not yet approved
    status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed'
    requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at timestamptz,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS refund_requests_order_idx ON public.refund_requests(order_id);
CREATE INDEX IF NOT EXISTS refund_requests_user_idx ON public.refund_requests(user_id);
CREATE INDEX IF NOT EXISTS refund_requests_status_idx ON public.refund_requests(status);

-- Trigger for updated_at
CREATE TRIGGER refund_requests_set_updated_at
BEFORE UPDATE ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ===== 9. REFUND ITEMS TABLE =====
-- Tracks which items are being refunded
CREATE TABLE IF NOT EXISTS public.refund_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_request_id uuid NOT NULL REFERENCES public.refund_requests(id) ON DELETE CASCADE,
    order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    quantity integer NOT NULL,
    unit_price integer NOT NULL, -- in cents
    total_amount integer NOT NULL, -- in cents
    reason text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(refund_request_id, order_item_id)
);

-- ===== 10. ORDER METRICS TABLE =====
-- Stores calculated metrics for analytics and reporting
CREATE TABLE IF NOT EXISTS public.order_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    processing_time_hours numeric(6,2), -- Time from order to shipped
    fulfillment_time_hours numeric(6,2), -- Time from order to delivered
    customer_satisfaction_rating smallint CHECK (customer_satisfaction_rating >= 1 AND customer_satisfaction_rating <= 5),
    return_rate_percentage numeric(5,2),
    profit_margin_percentage numeric(5,2),
    shipping_cost integer DEFAULT 0, -- in cents
    packaging_cost integer DEFAULT 0, -- in cents
    metadata jsonb DEFAULT '{}'::jsonb,
    calculated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS order_metrics_order_idx ON public.order_metrics(order_id);
CREATE INDEX IF NOT EXISTS order_metrics_calculated_at_idx ON public.order_metrics(calculated_at);

-- ===== 11. ORDER REPORTS TABLE =====
-- Stores generated reports for business intelligence
CREATE TABLE IF NOT EXISTS public.order_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type text NOT NULL, -- 'daily', 'weekly', 'monthly', 'vendor_performance', etc.
    report_period_start date NOT NULL,
    report_period_end date NOT NULL,
    generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    total_orders integer DEFAULT 0,
    total_revenue integer DEFAULT 0, -- in cents
    total_profit integer DEFAULT 0, -- in cents
    average_order_value integer DEFAULT 0, -- in cents
    conversion_rate numeric(5,2),
    return_rate numeric(5,2),
    top_products jsonb DEFAULT '[]'::jsonb,
    top_vendors jsonb DEFAULT '[]'::jsonb,
    report_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS order_reports_type_period_idx ON public.order_reports(report_type, report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS order_reports_created_at_idx ON public.order_reports(created_at);

-- ===== 12. VENDOR ORDER MANAGEMENT VIEWS =====

-- View for vendor order summary
CREATE OR REPLACE VIEW public.vendor_order_summary AS
SELECT
    v.id as vendor_id,
    v.name as vendor_name,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) as completed_orders,
    SUM(CASE WHEN o.status = 'delivered' THEN oi.total_price ELSE 0 END) as total_revenue,
    AVG(CASE WHEN o.status = 'delivered' THEN oi.total_price END) as avg_order_value,
    COUNT(DISTINCT CASE WHEN rr.status = 'approved' THEN rr.id END) as refund_requests
FROM public.vendors v
LEFT JOIN public.products p ON p.vendor_id = v.id
LEFT JOIN public.order_items oi ON oi.product_id = p.id
LEFT JOIN public.orders o ON o.id = oi.order_id
LEFT JOIN public.refund_requests rr ON rr.order_id = o.id
GROUP BY v.id, v.name;

-- View for vendor order details
CREATE OR REPLACE VIEW public.vendor_orders_detailed AS
SELECT
    o.id as order_id,
    o.user_id as customer_id,
    o.status as order_status,
    o.total_amount,
    o.created_at as order_date,
    o.shipped_at,
    o.delivered_at,
    v.id as vendor_id,
    v.name as vendor_name,
    p.title as product_title,
    pv.sku,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    pr.full_name as customer_name
FROM public.orders o
JOIN public.order_items oi ON oi.order_id = o.id
JOIN public.products p ON p.id = oi.product_id
JOIN public.vendors v ON v.id = p.vendor_id
LEFT JOIN public.product_variants pv ON pv.id = oi.variant_id
LEFT JOIN public.profiles pr ON pr.id = o.user_id
ORDER BY o.created_at DESC, o.id;

-- ===== 13. PERFORMANCE INDEXES =====

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS orders_user_status_created_idx ON public.orders(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_vendor_idx ON public.order_items(order_id, vendor_id);
CREATE INDEX IF NOT EXISTS products_vendor_published_idx ON public.products(vendor_id, is_published);

-- JSONB indexes for flexible queries
CREATE INDEX IF NOT EXISTS orders_metadata_gin_idx ON public.orders USING gin (metadata jsonb_path_ops);
CREATE INDEX IF NOT EXISTS products_metadata_gin_idx ON public.products USING gin (metadata jsonb_path_ops);

-- ===== 14. DATABASE TRIGGERS =====

-- Trigger to automatically create status history entries
CREATE OR REPLACE FUNCTION public.create_order_status_history()
RETURNS trigger AS $$
BEGIN
    -- Only create history if status actually changed
    IF OLD.status IS NULL OR OLD.status != NEW.status THEN
        INSERT INTO public.order_status_history (
            order_id,
            old_status,
            new_status,
            changed_by,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.metadata->>'changed_by', -- Assuming metadata contains user info
            NEW.metadata->>'change_reason'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_status_history_trigger
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_order_status_history();

-- Trigger to update timestamps based on status
CREATE OR REPLACE FUNCTION public.update_order_timestamps()
RETURNS trigger AS $$
BEGIN
    -- Set timestamps based on status changes
    IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
        NEW.shipped_at = now();
    ELSIF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        NEW.delivered_at = now();
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        NEW.cancelled_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_update_timestamps_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_order_timestamps();

-- Trigger to create default notification preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_notification_preferences_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_default_notification_preferences();

-- ===== 15. ROW LEVEL SECURITY POLICIES =====

-- Enable RLS on all new tables
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_reports ENABLE ROW LEVEL SECURITY;

-- Order status history: Users can view their own orders' history
CREATE POLICY order_status_history_select_policy ON public.order_status_history
FOR SELECT USING (
    order_id IN (
        SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
);

-- Email templates: Only admins can manage
CREATE POLICY email_templates_admin_policy ON public.email_templates
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Notification preferences: Users can manage their own
CREATE POLICY notification_preferences_policy ON public.notification_preferences
FOR ALL USING (user_id = auth.uid());

-- Notification logs: Users can view their own
CREATE POLICY notification_logs_select_policy ON public.notification_logs
FOR SELECT USING (user_id = auth.uid());

-- Cancellation reasons: Read-only for all authenticated users
CREATE POLICY cancellation_reasons_select_policy ON public.cancellation_reasons
FOR SELECT USING (auth.role() = 'authenticated');

-- Refund requests: Users can create/view their own
CREATE POLICY refund_requests_policy ON public.refund_requests
FOR ALL USING (user_id = auth.uid());

-- Refund items: Users can view items for their refunds
CREATE POLICY refund_items_select_policy ON public.refund_items
FOR SELECT USING (
    refund_request_id IN (
        SELECT id FROM public.refund_requests WHERE user_id = auth.uid()
    )
);

-- Order metrics: Only admins can view
CREATE POLICY order_metrics_admin_policy ON public.order_metrics
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Order reports: Only admins can view
CREATE POLICY order_reports_admin_policy ON public.order_reports
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ===== 16. BACKWARD COMPATIBILITY =====

-- Ensure existing orders maintain their current status
-- All existing data should continue to work without modification

-- Update any existing NULL preferences with defaults
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- ===== END OF MIGRATION =====

-- Note: After running this migration:
-- 1. Update your application code to handle the new order statuses
-- 2. Implement notification sending logic using the email_templates and notification_logs tables
-- 3. Add UI for order status management and refund processing
-- 4. Create analytics dashboards using the metrics and reports tables
-- 5. Test all existing functionality to ensure backward compatibility
```

## Key Features Implemented

### 1. **Order Status Management**
- Extended enum: `pending`, `confirmed`, `paid`, `processing`, `fulfilled`, `shipped`, `delivered`, `cancelled`, `refunded`
- Automatic timestamp updates based on status changes
- Comprehensive status history tracking

### 2. **Order Audit Trail**
- `order_status_history` table tracks all changes with user and reason
- Full audit trail for compliance and debugging

### 3. **Fulfillment Workflow**
- Shipping details: tracking number, carrier, estimated delivery
- Automatic timestamp setting for shipped/delivered/cancelled

### 4. **Notification System**
- Email templates with variable substitution
- User notification preferences
- Complete logging of sent notifications

### 5. **Refund and Cancellation Handling**
- Structured cancellation reasons
- Refund request workflow with approval process
- Item-level refund tracking

### 6. **Analytics and Reporting**
- Order metrics for performance analysis
- Generated reports for business intelligence
- Vendor performance tracking

### 7. **Vendor Order Management**
- Views for vendor order summaries and details
- Efficient queries for vendor dashboards

### 8. **Performance and Security**
- Strategic indexes for common query patterns
- RLS policies protecting sensitive data
- Triggers for automatic data maintenance

### 9. **Backward Compatibility**
- All existing tables and data preserved
- Existing functionality continues to work
- Gradual migration path for new features

## Usage Examples

### Query Customer Order History with Status Tracking
```sql
SELECT
    o.id,
    o.total_amount,
    o.status,
    o.created_at,
    osh.new_status,
    osh.created_at as status_changed_at,
    o.tracking_number,
    o.shipping_carrier
FROM public.orders o
LEFT JOIN public.order_status_history osh ON osh.order_id = o.id
WHERE o.user_id = $1
ORDER BY o.created_at DESC, osh.created_at ASC;
```

### Get Vendor Order Summary
```sql
SELECT * FROM public.vendor_order_summary
WHERE vendor_id = $1;
```

### Check Notification Preferences
```sql
SELECT * FROM public.notification_preferences
WHERE user_id = $1;
```

This schema provides a complete foundation for advanced order management while maintaining compatibility with the existing SKN Shop system.