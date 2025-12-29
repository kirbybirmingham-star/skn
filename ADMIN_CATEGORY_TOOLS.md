# Admin Panel Category & Metadata Tools

**Purpose:** Provide admins with tools to manage categories and track missing category alerts  
**Status:** Ready for implementation  

---

## Admin Panel Components to Add

### 1. Missing Category Alerts Widget

**Display:**
```
┌─────────────────────────────────────────┐
│ ⚠️  Missing Category Alerts              │
├─────────────────────────────────────────┤
│                                         │
│ [Unresolved: 3]  [View All]  [Settings]│
│                                         │
│ Alert 1:                                │
│   Product: "Organic Honey"              │
│   Requested: "Raw Honey"                │
│   Reason: CREATION_FAILED               │
│   [Resolve]  [Edit Category]            │
│                                         │
│ Alert 2:                                │
│   Product: "Fair Trade Coffee"          │
│   Requested: "Specialty Coffee"         │
│   Reason: CREATION_FAILED               │
│   [Resolve]  [Edit Category]            │
│                                         │
│ Alert 3:                                │
│   Product: "Unnamed Item"               │
│   Requested: "Uncategorized"            │
│   Reason: AUTO_ASSIGNED                 │
│   [Resolve]                             │
│                                         │
└─────────────────────────────────────────┘
```

**Functions Needed:**
```javascript
// Get unresolved alerts
const alerts = await getAdminAlerts({ status: 'UNRESOLVED' });

// Click to resolve
await resolveAdminAlert(alertId, newCategoryId);
```

### 2. Category Statistics Dashboard

**Display:**
```
┌──────────────────────────────────────┐
│ 📊 Category Distribution              │
├──────────────────────────────────────┤
│                                      │
│ Organic          ████████████ 42     │
│ Produce          ███████████ 38      │
│ Coffee           ████████ 25         │
│ Beverages        ██████ 18           │
│ Snacks           ████ 12             │
│ Uncategorized    ▌ 3                 │
│                                      │
│ Total: 138 products                  │
│ Uncategorized: 2.2%                  │
│                                      │
└──────────────────────────────────────┘
```

**Functions Needed:**
```javascript
const stats = await getCategoryStats();

// Format data for chart
const labels = Object.values(stats).map(s => s.name);
const counts = Object.values(stats).map(s => s.count);
const colors = {
  'uncategorized': '#ffcccc',
  'organic': '#ccffcc',
  // ... etc
};
```

### 3. Bulk Migration Tool

**Display:**
```
┌─────────────────────────────────────────┐
│ 🔧 Bulk Category Migration              │
├─────────────────────────────────────────┤
│                                         │
│ Migrate uncategorized products to:      │
│                                         │
│ [Select Category ▼]                     │
│  ├─ Organic                             │
│  ├─ Produce                             │
│  └─ Create New...                       │
│                                         │
│ [Preview Migration]  [Execute]          │
│                                         │
│ Preview Results (if clicked):           │
│ Would migrate: 3 products               │
│  • "Unnamed Item 1"                     │
│  • "Unnamed Item 2"                     │
│  • "Unnamed Item 3"                     │
│                                         │
│ [Proceed]  [Cancel]                     │
│                                         │
└─────────────────────────────────────────┘
```

**Functions Needed:**
```javascript
// Dry run
const preview = await migrateMissingCategories({ dryRun: true });

// Execute
const result = await migrateMissingCategories({ dryRun: false });
```

### 4. Product Category Validator

**Display:**
```
┌──────────────────────────────────────────┐
│ ✓ Category Validation Report             │
├──────────────────────────────────────────┤
│                                          │
│ ✅ 138 products have valid categories    │
│ ⚠️  3 products missing categories        │
│ 📊 0 orphaned categories                 │
│                                          │
│ Issues Found:                            │
│                                          │
│ • Product #123: No category_id           │
│   [Auto-fix]  [Assign Manual]            │
│                                          │
│ • Product #456: Invalid category_id      │
│   [Auto-fix]  [Assign Manual]            │
│                                          │
│ • Product #789: No category_id           │
│   [Auto-fix]  [Assign Manual]            │
│                                          │
│ [Fix All Issues] [Export Report]         │
│                                          │
└──────────────────────────────────────────┘
```

---

## Code Examples for Admin Components

### AlertsWidget.jsx

```javascript
import { useEffect, useState } from 'react';
import { getAdminAlerts, resolveAdminAlert } from '@/api/EcommerceApi';

export function MissingCategoryAlertsWidget() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await getAdminAlerts({
        status: 'UNRESOLVED',
        alertType: 'MISSING_CATEGORY',
        limit: 10
      });
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId, categoryId) => {
    try {
      await resolveAdminAlert(alertId, categoryId);
      // Remove from list
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  if (loading) return <div>Loading alerts...</div>;

  return (
    <div className="widget">
      <h3>⚠️ Missing Category Alerts ({alerts.length})</h3>
      {alerts.length === 0 ? (
        <p>No unresolved alerts. Great!</p>
      ) : (
        <ul>
          {alerts.map(alert => (
            <li key={alert.id}>
              <div>Product: {alert.product_id}</div>
              <div>Requested: {alert.requested_category}</div>
              <div>Reason: {alert.reason}</div>
              <button onClick={() => handleResolve(alert.id, null)}>
                Mark Resolved
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### CategoryStatsWidget.jsx

```javascript
import { useEffect, useState } from 'react';
import { getCategoryStats } from '@/api/EcommerceApi';

export function CategoryStatsWidget() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getCategoryStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const total = Object.values(stats).reduce((sum, s) => sum + s.count, 0);
  const uncategorized = stats.uncategorized?.count || 0;
  const uncategorizedPercent = total > 0 
    ? ((uncategorized / total) * 100).toFixed(1) 
    : 0;

  return (
    <div className="widget">
      <h3>📊 Category Distribution</h3>
      <div>
        {Object.entries(stats)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([slug, stat]) => (
            <div key={slug}>
              <div>{stat.name}</div>
              <div className="bar">
                <div 
                  style={{
                    width: `${(stat.count / total) * 100}%`,
                    backgroundColor: slug === 'uncategorized' ? '#ffcccc' : '#4CAF50'
                  }}
                >
                  {stat.count}
                </div>
              </div>
            </div>
          ))}
      </div>
      <div className="summary">
        <div>Total: {total} products</div>
        <div>Uncategorized: {uncategorizedPercent}%</div>
      </div>
    </div>
  );
}
```

### MigrationTool.jsx

```javascript
import { useState } from 'react';
import { migrateMissingCategories } from '@/api/EcommerceApi';

export function MigrationTool() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const result = await migrateMissingCategories({ dryRun: true });
      setPreview(result);
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      const result = await migrateMissingCategories({ dryRun: false });
      if (result.updated > 0) {
        alert(`✅ Successfully migrated ${result.updated} products!`);
        setPreview(null);
      }
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="widget">
      <h3>🔧 Bulk Migration Tool</h3>
      <button onClick={handlePreview} disabled={loading}>
        Preview Migration
      </button>

      {preview && (
        <div>
          <p>Would migrate: {preview.total} products</p>
          <button onClick={handleExecute} disabled={loading}>
            Execute Migration
          </button>
          <button onClick={() => setPreview(null)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Integration with AdminPanel.jsx

**Add to AdminPanel:**
```javascript
import { MissingCategoryAlertsWidget } from '@/components/admin/MissingCategoryAlertsWidget';
import { CategoryStatsWidget } from '@/components/admin/CategoryStatsWidget';
import { MigrationTool } from '@/components/admin/MigrationTool';

export default function AdminPanel() {
  return (
    <div>
      {/* Existing sections */}
      
      {/* Category Management Section */}
      <section className="admin-section">
        <h2>📂 Category Management</h2>
        
        <MissingCategoryAlertsWidget />
        
        <CategoryStatsWidget />
        
        <MigrationTool />
      </section>
    </div>
  );
}
```

---

## Navigation Updates

**Add to AdminPanel nav:**
```
├─ Category Management
│  ├─ Missing Alerts
│  ├─ Statistics
│  └─ Bulk Migration
├─ Products
│  ├─ Validation
│  ├─ Bulk Actions
│  └─ Reports
```

---

## Database Queries for Validation

```sql
-- Check uncategorized products
SELECT id, title, category_id
FROM products
WHERE category_id IS NULL
ORDER BY created_at DESC;

-- Count by category
SELECT 
  c.name,
  COUNT(p.id) as count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY count DESC;

-- Find missing categories
SELECT DISTINCT metadata->>'category_name' as requested
FROM products
WHERE category_id IS NULL
  AND metadata->>'category_name' IS NOT NULL;

-- Check unresolved alerts
SELECT 
  aa.id,
  aa.product_id,
  aa.requested_category,
  aa.reason,
  aa.created_at
FROM admin_alerts aa
WHERE aa.status = 'UNRESOLVED'
ORDER BY aa.created_at DESC;
```

---

## Testing Checklist

- [ ] Alerts widget displays unresolved alerts
- [ ] Click "Resolve" marks alert as resolved
- [ ] Stats widget shows accurate category counts
- [ ] Migration preview shows correct count
- [ ] Migration execution assigns "Uncategorized"
- [ ] New products auto-assigned category
- [ ] Metadata stored correctly with category_name
- [ ] Admin alerts created on failures

---

**Status: Ready for admin panel integration**

Next: Implement these components in AdminPanel.jsx
