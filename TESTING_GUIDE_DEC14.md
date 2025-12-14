# User Flow Testing Guide - Onboarding & KYC

## Complete User Journey

This guide walks through the complete user journey from signup to seller verification.

## Phase 1: Discovery & Signup

### Step 1.1: Land on Become Seller Page
```
URL: http://192.168.192.1:3000/become-seller
Expected:
- Hero section with gradient background
- "Start Selling on SKN Bridge Trade" heading
- 4 benefit cards (Low Commissions, Verified Buyers, Local Community, Grow Your Business)
- "Sign Up to Sell" CTA button
```

### Step 1.2: Click Sign Up Button
```
Action: Click "Sign Up to Sell" button
Expected: Navigate to /onboarding page
```

## Phase 2: Account Creation

### Step 2.1: View Onboarding Page
```
URL: http://192.168.192.1:3000/onboarding
Expected:
- Onboarding steps breakdown (3 steps visualization)
- SellerSignupForm component displayed
- Form fields:
  * Store Name (required)
  * Store URL Slug (required)
  * Contact Email (optional)
  * Website (optional)
  * Description (optional)
```

### Step 2.2: Fill in Store Details
```
Action: Fill form with:
- Store Name: "My Test Store"
- Slug: "my-test-store"
- Contact Email: "contact@mystore.com"
- Website: "https://mystore.com"
- Description: "Selling quality products locally"

Expected:
- All input fields accept text
- Help text visible under each field
- No validation errors during typing
```

### Step 2.3: Submit Form
```
Action: Click "Create Seller Account" button
Expected:
- Button shows "Creating Account..." state
- Form fields disabled
- Success message appears
- Redirects to /onboarding/:token
```

## Phase 3: Continue Onboarding

### Step 3.1: View Onboarding with Token
```
URL: http://192.168.192.1:3000/onboarding/:token
Expected:
- Store name displayed in card
- Current onboarding status shown
- "Start Identity Verification" button visible
- "View My Onboarding Dashboard" link available
- Information about KYC requirement
```

### Step 3.2: Start KYC Verification
```
Action: Click "Start Identity Verification" button
Expected:
- Button shows "Starting Verification..." state
- API call to /api/onboarding/start-kyc
- Redirect to verification provider (external)
- OR error message if API fails
```

## Phase 4: Onboarding Dashboard

### Step 4.1: Navigate to Dashboard
```
URL: http://192.168.192.1:3000/dashboard/onboarding
Expected:
- Page header: "Onboarding Dashboard"
- Store name displayed
- Status badge (Approved/Under Review/Rejected/Not Started)
- "Uploaded Documents" section
  * If documents exist: list with links
  * If empty: "No documents uploaded yet" message
- "Appeals" section (if appeals exist)
- Two action buttons:
  * "Edit Store Information" → /become-seller
  * "Continue Onboarding" → /onboarding
```

### Step 4.2: Check Status States

**Status: Not Started**
```
- Badge color: Gray
- Onboarding button: "Continue Onboarding"
- Document section: Empty
```

**Status: Under Review (Pending)**
```
- Badge color: Yellow
- Message: "Your application is under review"
- Onboarding button: Enabled
```

**Status: Approved**
```
- Badge color: Green
- Message: "Your seller account is verified"
- Can start selling immediately
```

**Status: Rejected**
```
- Badge color: Red
- Appeals section: Show rejection details
- Option to resubmit or appeal
```

## Phase 5: Main Dashboard

### Step 5.1: View Main Dashboard
```
URL: http://192.168.192.1:3000/dashboard
Expected:
- User profile card with avatar
- Username/email displayed
- Member since date
- If vendor exists:
  * Store name: "My Test Store"
  * Onboarding status: Badge
  * 3 action buttons:
    - Go to Seller Dashboard
    - Onboarding Dashboard
    - Start/Resume Verification
- If no vendor:
  * "Become a Seller" button
- Account Overview section:
  * Active Listings count
  * Items Sold count
  * Items Bought count
```

### Step 5.2: Navigate to Seller Dashboard
```
Action: Click "Go to Seller Dashboard" button
Expected:
- Navigate to /dashboard/vendor
- Shows vendor sidebar and main dashboard
- Access to Products, Orders, Settings
```

## Error States & Recovery

### Error: Not Authenticated
```
Location: Any protected route without login
Expected:
- Redirect to login page OR
- Show login prompt
- Clear message: "Please log in to continue"
```

### Error: Form Validation
```
Scenario: Submit empty required fields
Expected:
- Error message above form
- Red alert box
- Specific field error indication
- Cannot submit until valid
```

### Error: API Failure
```
Scenario: API endpoint returns error
Expected:
- Error card with icon
- Clear error message
- Suggestion to retry or contact support
- Retry button available
```

### Error: No Vendor Found
```
URL: /dashboard/onboarding (no vendor)
Expected:
- Message: "No Store Found"
- "Become a Seller" button
- Link to /become-seller
```

## Form Validation Rules

### Store Name
- Required: Yes
- Min length: 1 character
- Max length: 100 characters
- Allowed: Any characters

### Store URL Slug
- Required: Yes
- Min length: 1 character
- Pattern: URL-safe (lowercase, hyphens, numbers)
- Unique: Must be checked server-side

### Contact Email
- Required: No
- Type: Email
- Validation: Browser email validation

### Website
- Required: No
- Type: URL
- Validation: Browser URL validation

### Description
- Required: No
- Min length: 0
- Max length: 500 characters

## API Endpoints Used

### 1. Create Seller Account
```
POST /api/onboarding/signup
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json
Body: {
  owner_id: "user-id",
  name: "Store Name",
  slug: "store-slug",
  description: "...",
  website: "https://...",
  contact_email: "email@..."
}
Response: {
  vendor: { id, name, slug, ... },
  onboardingUrl: "/onboarding/:token"
}
```

### 2. Get Onboarding by Token
```
GET /api/onboarding/:token
Response: {
  vendor: { id, name, onboarding_status, ... }
}
```

### 3. Get Current User's Vendor
```
GET /api/onboarding/me
Headers:
  Authorization: Bearer {token}
Response: {
  vendor: { ... },
  counts: { activeListings, itemsSold, itemsBought }
}
```

### 4. Start KYC Verification
```
POST /api/onboarding/start-kyc
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
Body: {
  vendor_id: "vendor-id"
}
Response: {
  providerUrl: "https://verification-provider.com/..."
}
```

## Browser DevTools Inspection

### Console Debugging
```javascript
// Check authentication context
console.log('Auth State:', { session, user, profile });

// Monitor fetch calls
// Open Network tab → filter for /api/onboarding
// Inspect request headers for Authorization

// Check component rendering
// Open React DevTools → look for component tree
```

### Network Tab Checks
- [ ] All /api/onboarding/* requests have 200/201 status
- [ ] Authorization header present on all requests
- [ ] Response JSON valid and complete
- [ ] No CORS errors
- [ ] Response times < 1 second

## Performance Benchmarks

### Page Load Times
- /become-seller: < 2s
- /onboarding: < 2s
- /dashboard/onboarding: < 2s
- /dashboard: < 2s

### Animation Smoothness
- Framer motion animations: 60fps
- Form interactions: Instant feedback
- Navigation: < 300ms

### API Response Times
- signup: < 500ms
- getOnboarding: < 300ms
- start-kyc: < 500ms

## Responsive Design Testing

### Mobile (375px)
- [ ] All text readable
- [ ] Form inputs touch-friendly
- [ ] Buttons accessible
- [ ] Images scale properly
- [ ] No horizontal scrolling

### Tablet (768px)
- [ ] Layout adapts
- [ ] Cards responsive
- [ ] Form inputs properly sized
- [ ] Navigation works

### Desktop (1024px+)
- [ ] Full layout visible
- [ ] Multi-column layouts
- [ ] Animations smooth
- [ ] All features accessible

## Common Test Scenarios

### Scenario 1: New User Complete Flow
1. Land on /become-seller
2. Click "Sign Up to Sell"
3. Fill seller signup form
4. Submit form
5. Complete KYC verification
6. View onboarding dashboard
7. Check main dashboard

**Success Criteria**: All pages display correctly, no errors, data persists

### Scenario 2: Existing Vendor View
1. Login with existing account
2. Navigate to /dashboard/onboarding
3. View existing vendor data
4. Check status badge
5. Verify documents display

**Success Criteria**: Vendor data loads, status correct, can navigate

### Scenario 3: Error Handling
1. Try to access /dashboard/onboarding while logged out
2. Try to submit form with empty required fields
3. Try invalid API URL
4. Simulate network error

**Success Criteria**: Proper error messages, clear recovery options

## Sign-Off Checklist

Before considering implementation complete:

- [ ] All pages load without errors
- [ ] Form submission works end-to-end
- [ ] Error states display properly
- [ ] Responsive design verified
- [ ] Animations smooth on all browsers
- [ ] API integration working
- [ ] Data persists correctly
- [ ] Authentication flows work
- [ ] Mobile testing passed
- [ ] Desktop testing passed
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Browser compatibility checked

## Next Phase: KYC Provider Integration

After onboarding UI is verified:

1. [ ] Integrate identity verification provider
2. [ ] Handle webhook callbacks
3. [ ] Update vendor status in database
4. [ ] Send verification emails
5. [ ] Show verification status updates
6. [ ] Add appeal flow UI

## Support & Troubleshooting

If users encounter issues:

1. **Check browser console** for JavaScript errors
2. **Check Network tab** for failed API requests
3. **Verify authentication** session is valid
4. **Clear browser cache** (Ctrl+Shift+Delete)
5. **Try incognito mode** to eliminate extension issues
6. **Check server logs** for API errors

## Documentation Links

- Full implementation: `IMPLEMENTATION_COMPLETE_DEC14.md`
- Debug guide: `UI_UX_DEBUG_GUIDE.md`
- Files modified: See git diff
