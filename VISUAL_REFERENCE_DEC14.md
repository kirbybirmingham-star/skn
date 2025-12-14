# Visual Reference Guide - UI/UX Components

## Component Design Overview

This guide provides visual references for all components and their states.

## Color Palette

### Primary Colors
```
Blue-600:     #2563eb (Primary actions)
Blue-700:     #1d4ed8 (Hover states)
Indigo-600:   #4f46e5 (Accents)
```

### Status Colors
```
Green:        #10b981 (Approved)
Yellow:       #f59e0b (Pending/Under Review)
Red:          #ef4444 (Rejected/Error)
Gray:         #6b7280 (Neutral)
```

### Neutral Colors
```
Slate-50:     #f8fafc (Background)
Slate-100:    #f1f5f9 (Light surfaces)
Slate-900:    #0f172a (Text)
White:        #ffffff (Cards/Surfaces)
```

## Layout Patterns

### Card Pattern
```
┌────────────────────────────────┐
│ Header (Optional Icon + Title) │
│ ──────────────────────────────│
│ Content                        │
│ (Main body text/form/etc)      │
│                                │
│ Footer (Optional CTA buttons)  │
└────────────────────────────────┘
```

### Responsive Grid
```
Mobile (< 640px):          Tablet (640-1024px):    Desktop (> 1024px):
┌──────────────┐          ┌──────┬──────┐         ┌────┬────┬────┐
│              │          │      │      │         │    │    │    │
│   Full       │          │ Half │ Half │         │1/3 │1/3 │1/3 │
│   Width      │          │      │      │         │    │    │    │
└──────────────┘          └──────┴──────┘         └────┴────┴────┘
```

## Component States

### Button States
```
Default:        Blue background, white text
┌─────────────┐
│ Click Me    │  Normal (hover: darker blue)
└─────────────┘

Loading:        Button text changes + spinner
┌──────────────────┐
│ Creating... ◌◌◌  │  Disabled state
└──────────────────┘

Disabled:        Gray background, reduced opacity
┌─────────────┐
│ Click Me    │  Grayed out
└─────────────┘

Success:        Green checkmark + text
┌─────────────┐
│ ✓ Done      │  Green background
└─────────────┘
```

### Input Field States
```
Default:        Border + placeholder text
┌──────────────────────────────┐
│ Enter value...               │
└──────────────────────────────┘

Focused:        Blue border + ring
┌──────────────────────────────┐
│ Enter value...               │  Blue outline
└──────────────────────────────┘
  (focus:ring-2 focus:ring-blue-500)

Filled:         Text visible
┌──────────────────────────────┐
│ My Store Name                │
└──────────────────────────────┘

Error:          Red border + message
┌──────────────────────────────┐
│ My Store Name                │  Red border
└──────────────────────────────┘
  ⚠ Store name is required
```

### Status Badges
```
Approved:       ✅ Green badge
┌───────────────┐
│ ✓ Approved    │  bg-green-100, text-green-800
└───────────────┘

Pending:        ⏱ Yellow badge
┌──────────────────┐
│ Under Review     │  bg-yellow-100, text-yellow-800
└──────────────────┘

Rejected:       ❌ Red badge
┌───────────────┐
│ Rejected      │  bg-red-100, text-red-800
└───────────────┘

Not Started:    ◯ Gray badge
┌────────────────┐
│ Not Started    │  bg-gray-100, text-gray-800
└────────────────┘
```

## Page Layouts

### Become Seller Page
```
┌────────────────────────────────────────────┐
│                                            │
│  Hero Section (Blue gradient background)  │
│  ═════════════════════════════════════════│
│                                            │
│  "Start Selling on SKN Bridge Trade"      │
│  [Sign Up to Sell] Button                 │
│                                            │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Why Sell With Us?                         │
├──┬──────────────┬──────────────┬──────────┤
│  │ Low Comm.    │ Verified     │ Local    │
│  │ $            │ Buyers ✓     │ Community│
│  │              │              │ 👥       │
├──┼──────────────┼──────────────┼──────────┤
│  │ Grow Your Business           │          │
│  │ 📈                           │          │
└──┴──────────────┴──────────────┴──────────┘
```

### Onboarding Dashboard
```
┌────────────────────────────────────────────┐
│ Onboarding Dashboard                       │
│ Manage your seller account and complete   │
│ verification                              │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ My Test Store                  [Approved] ✓│
│ ────────────────────────────────────────── │
│ Status: Under Review                       │
│ Created: Dec 14, 2025                      │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ 📄 Uploaded Documents                      │
│ • Document 1                        [View] │
│ • Document 2                        [View] │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ [Edit Store] [Continue Onboarding]         │
└────────────────────────────────────────────┘
```

### Seller Signup Form
```
┌────────────────────────────────────────────┐
│ Create Your Seller Account                 │
│ Set up your store on SKN Bridge Trade      │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ Store Name *                               │
│ ┌──────────────────────────────────────┐  │
│ │ Enter store name...                  │  │
│ └──────────────────────────────────────┘  │
│ This is the name customers will see       │
│                                           │
│ Store URL Slug *                          │
│ ┌──────────────────────────────────────┐  │
│ │ my-store                             │  │
│ └──────────────────────────────────────┘  │
│ URL-friendly name (lowercase, no spaces)  │
│                                           │
│ Contact Email                             │
│ ┌──────────────────────────────────────┐  │
│ │ contact@store.com                    │  │
│ └──────────────────────────────────────┘  │
│ Email for customer inquiries               │
│                                           │
│ [Create Seller Account]                   │
└────────────────────────────────────────────┘
```

### Main Dashboard
```
                Left Column        Right Column
                ───────────        ────────────
┌──────────────┬────────────────────────────┐
│ User Avatar  │                            │
│ [A]          │ Account Overview           │
│              │ ─────────────────────────  │
│ Username     │ Active Listings: 5         │
│ user@...     │ Items Sold: 12             │
│              │ Items Bought: 3            │
│ Member       │                            │
│ since...     │                            │
│              │                            │
│ Store: My    │                            │
│ Test Store   │                            │
│ [Under Rev.] │                            │
│              │                            │
│ [Seller DB]  │                            │
│ [Onboarding] │                            │
│ [Verify]     │                            │
└──────────────┴────────────────────────────┘
```

## Animation Effects

### Fade In with Slide
```
Start:      opacity: 0, translateY: 20px
            ↓
End:        opacity: 1, translateY: 0px
Duration:   0.6s ease-out

Visual:     Element slides up and fades in
```

### Button Hover
```
Start:      bg-blue-600
            ↓ (on hover)
End:        bg-blue-700
Transition: 200ms
```

### Form Validation
```
Error:      Border color → red-500
            Icon appears → red exclamation
            Message appears → red text

Fixed:      Border color → blue-500
            Icon disappears
            Message disappears
```

## Spacing System

### Padding
```
p-1   = 0.25rem (4px)     p-4  = 1rem (16px)      p-8  = 2rem (32px)
p-2   = 0.5rem (8px)      p-6  = 1.5rem (24px)    p-12 = 3rem (48px)
p-3   = 0.75rem (12px)
```

### Margin
```
m-1   = 0.25rem (4px)     m-4  = 1rem (16px)      m-8  = 2rem (32px)
m-2   = 0.5rem (8px)      m-6  = 1.5rem (24px)    m-12 = 3rem (48px)
m-3   = 0.75rem (12px)
```

### Gap (between flex items)
```
gap-1  = 0.25rem (4px)    gap-4 = 1rem (16px)
gap-2  = 0.5rem (8px)     gap-6 = 1.5rem (24px)
gap-3  = 0.75rem (12px)   gap-8 = 2rem (32px)
```

## Font Sizes

```
text-xs      = 12px (Small labels, help text)
text-sm      = 14px (Body text, form labels)
text-base    = 16px (Default body text)
text-lg      = 18px (Section headers)
text-xl      = 20px (Large text)
text-2xl     = 24px (Page headings)
text-4xl     = 36px (Large headings)
text-6xl     = 60px (Hero headings)
```

## Border Radius

```
rounded      = 0.25rem (4px)      Default
rounded-lg   = 0.5rem (8px)       Cards, buttons
rounded-full = 50%                Avatars, pills
```

## Shadow Effects

```
shadow-sm    = subtle             Small cards
shadow-md    = moderate           Medium cards
shadow-lg    = prominent          Large cards, modals
shadow-2xl   = strong             Hero elements
```

## Icons Used

```
✓ CheckCircle       - Success states
⚠ AlertCircle       - Warnings/Errors
📄 FileText         - Documents
→ ArrowRight        - CTAs/Navigation
👥 Users            - Community features
$ DollarSign        - Pricing/Revenue
🛡 Shield           - Security/Trust
📈 TrendingUp       - Growth
```

## Responsive Breakpoints

```
Mobile:     < 640px       (sm)
Tablet:     640px-1024px  (md)
Desktop:    > 1024px      (lg)

Classes:
md:grid-cols-2      (2 columns on tablet+)
lg:grid-cols-3      (3 columns on desktop+)
sm:flex-row         (Row layout on tablet+)
md:text-lg          (Larger text on tablet+)
```

## Example: Complete Component

```jsx
// Card Component Usage
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-2xl">Store Name</CardTitle>
        <CardDescription>Description here</CardDescription>
      </div>
      <Badge>Status</Badge>
    </div>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
</Card>
```

## Common Tailwind Patterns

### Centered Container
```jsx
<div className="max-w-4xl mx-auto px-6">
  {/* Content */}
</div>
```

### Gradient Background
```jsx
<div className="bg-gradient-to-br from-blue-50 to-slate-50">
  {/* Content */}
</div>
```

### Flex Row with Gap
```jsx
<div className="flex gap-4">
  {/* Items */}
</div>
```

### Grid Layout
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

### Hover Effects
```jsx
<button className="hover:bg-blue-700 transition-colors">
  Hover Me
</button>
```

---

## Reference Images

### Status Badge Colors
```
Approved:     🟢 bg-green-100    text-green-800
Pending:      🟡 bg-yellow-100   text-yellow-800
Rejected:     🔴 bg-red-100      text-red-800
Not Started:  ⚪ bg-gray-100     text-gray-800
```

### Button Variants
```
Primary:      Blue   [Action Button]
Secondary:    White  [Edit Button]
Outline:      Border [Secondary Option]
Danger:       Red    [Delete Button]
Disabled:     Gray   [Inactive Button]
```

### Form Field Types
```
Text Input:        Single line text
Textarea:          Multiple lines
Email Input:       Email validation
URL Input:         URL validation
Select:            Dropdown
Checkbox:          Multi-select
Radio:             Single choice
```

---

This visual reference guide helps maintain consistency across all UI components and provides a quick reference for colors, spacing, and layout patterns.

For more details, see `IMPLEMENTATION_COMPLETE_DEC14.md`.
