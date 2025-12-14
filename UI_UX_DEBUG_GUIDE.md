# UI/UX Debug Guide - Onboarding & Dashboard

## Overview
This document provides guidance on debugging and verifying the UI/UX implementation for the seller onboarding flow and dashboard.

## Dev Environment
- **Dev Server**: Running at `http://192.168.192.1:3000/`
- **Command**: `npm run dev`
- **Status**: Active with HMR enabled

## User Flow

### 1. Become a Seller Page
**Route**: `/become-seller`
- Hero section with "Start Selling on SKN Bridge Trade" 
- Benefits cards (Low Commissions, Verified Buyers, Local Community, Grow Your Business)
- "Sign Up to Sell" CTA button

### 2. Seller Onboarding Page
**Route**: `/onboarding` or `/onboarding/:token`

#### Initial State (No Token)
- Shows onboarding steps breakdown (3 steps)
- Displays `SellerSignupForm` component
- User fills in:
  - Store Name (required)
  - Store URL Slug (required)
  - Contact Email (optional)
  - Website (optional)
  - Store Description (optional)

#### With Token State
- Displays vendor information
- Shows current onboarding status
- "Start Identity Verification" button
- "View My Onboarding Dashboard" link

### 3. Onboarding Dashboard
**Route**: `/dashboard/onboarding`
- **Authentication**: Protected route (requires login)
- **Components**:
  - Status card showing store name and onboarding status
  - Uploaded documents section
  - Appeals section (if any)
  - Action buttons: "Edit Store Information" & "Continue Onboarding"

### 4. Main Dashboard
**Route**: `/dashboard`
- Shows user profile card with avatar
- Displays store information if vendor exists
- Shows action buttons:
  - "Go to Seller Dashboard" → `/dashboard/vendor`
  - "Onboarding Dashboard" → `/dashboard/onboarding`
  - "Start/Resume Verification" button

## Key Components Enhanced

### OnboardingDashboard.jsx
**Improvements**:
- ✅ Gradient background (blue-50 to slate-50)
- ✅ Motion animations with framer-motion
- ✅ Card-based layout with icons
- ✅ Status badges (Approved, Under Review, Rejected, Not Started)
- ✅ Responsive grid layout
- ✅ Document list with view links
- ✅ Appeals section (conditional)
- ✅ Clear CTA buttons

### SellerSignupForm.jsx
**Improvements**:
- ✅ Card-based form layout
- ✅ Clear error/success states
- ✅ Help text under each field
- ✅ Required field indicators
- ✅ Proper input styling with focus states
- ✅ Loading state on submit
- ✅ Success confirmation
- ✅ Login prompt for unauthenticated users

### SellerOnboarding.jsx
**Improvements**:
- ✅ Onboarding steps visualization
- ✅ Gradient header
- ✅ Status information display
- ✅ KYC flow integration
- ✅ Error handling with alert card
- ✅ Clear navigation options

## Testing Checklist

### Visual Verification
- [ ] Navigate to `/become-seller` - verify all benefits cards display
- [ ] Click "Sign Up to Sell" - navigates to `/onboarding`
- [ ] Check OnboardingDashboard loads with proper styling
- [ ] Verify form inputs are visible and interactive
- [ ] Check responsive design on mobile/tablet views
- [ ] Verify color scheme and gradients apply correctly
- [ ] Check animations smooth and not janky

### Functional Verification
- [ ] Form submission validation works
- [ ] Error messages display properly
- [ ] Success states show correctly
- [ ] Navigation between pages works
- [ ] Protected routes redirect if not authenticated
- [ ] API calls to `/api/onboarding/*` endpoints work
- [ ] JWT bearer token passed correctly in headers

### Data Flow
- [ ] Create seller account creates vendor in database
- [ ] OnboardingDashboard loads vendor data correctly
- [ ] Status updates reflect correctly
- [ ] KYC start-kyc endpoint works and redirects

## Common Issues & Solutions

### Issue: Elements Not Visible
**Solution**:
1. Check browser DevTools for console errors
2. Verify Tailwind CSS classes are compiling:
   - Check `src/index.css` has `@tailwind` directives
   - Run `npm run dev` to trigger HMR
3. Clear browser cache (Ctrl+Shift+Delete)
4. Verify component imports are correct

### Issue: Forms Not Submitting
**Solution**:
1. Check browser console for API errors
2. Verify `/api/onboarding/signup` endpoint is responding
3. Check Authorization headers are being sent
4. Verify session token is available in context

### Issue: Dashboard Data Not Loading
**Solution**:
1. Check user is authenticated
2. Verify `/api/onboarding/me` endpoint is working
3. Check bearer token is valid and not expired
4. Review browser console for fetch errors

### Issue: Styling Issues
**Solution**:
1. Verify card components are imported from `@/components/ui/card`
2. Check button components have proper styling
3. Ensure motion animations don't conflict with Tailwind
4. Verify dark mode CSS variables are set properly

## Browser DevTools Debugging

### Console Checks
```javascript
// Check authentication context
console.log('Session:', session);
console.log('User:', user);
console.log('Profile:', profile);

// Check fetch calls
// Open Network tab and filter for /api/onboarding
// Look for request headers and response data
```

### Network Tab
- Monitor all `/api/onboarding/*` requests
- Verify Authorization header is present
- Check response status codes
- Look for CORS errors (if any)

## CSS/Tailwind Debugging

### Tailwind Classes Used
- Gradients: `bg-gradient-to-br from-slate-50 to-blue-50`
- Animations: `motion` from framer-motion
- Cards: Radix UI Card components
- Icons: Lucide React icons
- Colors: Blue (600, 700), Slate, Green, Red, Yellow, Orange

### Hot Module Replacement (HMR)
When you edit files, changes should auto-reload:
1. Edit `.jsx` file
2. Dev server detects change
3. Browser auto-refreshes (unless in middle of form)
4. Check terminal output for HMR messages

## Next Steps

### If UI Displays Correctly
1. Test the complete onboarding flow end-to-end
2. Verify KYC integration works
3. Test data persistence to database
4. Test role-based access control

### If Issues Remain
1. Check browser console for specific errors
2. Review Vite configuration for proper plugin loading
3. Verify all components are properly exported
4. Check PostCSS/Tailwind config

## File Locations
- Components: `src/components/`
- Pages: `src/pages/`
- Contexts: `src/contexts/`
- API: `server/onboarding.js`
- Styles: `src/index.css`
- Config: `tailwind.config.js`, `vite.config.js`
