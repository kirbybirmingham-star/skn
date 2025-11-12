# 🧪 Seller Onboarding - Testing Guide

## ✅ All 4 Fixes Are Complete!

```
✅ Fix 1: SellerSignupForm - owner_id removed, uses user.id
✅ Fix 2: /onboarding routes - now protected with ProtectedRoute  
✅ Fix 3: SellerOnboarding - JWT headers added to API calls
✅ Fix 4: OnboardingDashboard - JWT headers added to API calls

COMMITTED: ✅ All changes pushed to feature/auth-login-signup branch
```

---

## 🚀 How to Test

### Prerequisites
- ✅ Dev servers running (`npm run dev:all`)
- ✅ Supabase configured (check `.env`)
- ✅ All 4 fixes committed

### Test Scenario: New Seller Signup

#### Step 1: Go to Frontend
```
URL: http://localhost:3000
```

Expected: Homepage loads with "Become a Seller" button visible

---

#### Step 2: Test Route Protection (Anonymous User)

Try to access onboarding directly without logging in:
```
URL: http://localhost:3000/onboarding
```

Expected: ❌ Should redirect to login OR show "Please log in" message (ProtectedRoute working)

---

#### Step 3: Sign Up as Buyer

```
1. Click login/signup button
2. Create buyer account:
   - Email: test@example.com
   - Password: TestPassword123!
   - Role: Buyer (if asked)
3. Confirm email (check console/browser dev tools for magic link)
4. You should be logged in
```

Expected: ✅ Logged in with buyer account

---

#### Step 4: Become a Seller

```
1. Go to /become-seller
2. Click "Sign Up to Sell" button
3. Should redirect to /onboarding
```

Expected: ✅ Seller form appears (NOT showing owner_id field)

---

#### Step 5: Fill Seller Form

```
Form fields visible:
- ✓ Store Name (required)
- ✓ Slug (required)
- ✗ Owner ID (SHOULD NOT appear - this was the bug!)
- ✓ Website
- ✓ Contact Email
- ✓ Description

Example values:
- Store Name: "My Test Store"
- Slug: "my-test-store"
- Website: "https://example.com"
- Contact Email: "store@example.com"
- Description: "Test store for verification"
```

Expected: ✅ Form shows all fields EXCEPT owner_id

---

#### Step 6: Submit Form

```
1. Click "Create Seller Account" button
2. Wait for submission (should show "Creating..." text)
3. Should redirect to /onboarding/:token
```

Expected: 
- ✅ Form submits without owner_id input field
- ✅ JWT token sent automatically (you won't see it, but it's in the header)
- ✅ Redirect to onboarding page with token

---

#### Step 7: Verify in Supabase

```
1. Go to Supabase dashboard
2. Open "vendors" table
3. Look for your newly created store
4. Check these fields:
   - ✅ name = "My Test Store"
   - ✅ slug = "my-test-store"
   - ✅ owner_id = YOUR USER ID (not manual input!)
   - ✅ onboarding_status = "started"
   - ✅ onboarding_token = UUID
```

Expected: ✅ Vendor created with correct owner_id matching your user

---

#### Step 8: Test KYC Flow

```
1. On /onboarding/:token page, you should see:
   - Store name
   - Status (should be "started")
   - "Start Identity Verification" button

2. Click the button
3. Should redirect to /onboarding/:token?provider=stub&session=...
```

Expected: 
- ✅ JWT sent with KYC request (401 error if not)
- ✅ Can see KYC button
- ✅ Redirect works

---

#### Step 9: Test Dashboard

```
1. Go to /dashboard/onboarding
2. Should show vendor info:
   - Store name
   - Onboarding status
   - Active listings count
   - Items sold count
   - Items bought count
```

Expected:
- ✅ Dashboard loads vendor info (JWT working!)
- ✅ Shows correct vendor data
- ✅ Counts show (will be 0 since new account)

---

## ✅ Success Criteria

### Checks to Verify

- [ ] Cannot access /onboarding without login (ProtectedRoute working)
- [ ] Owner_id field NOT visible in seller form
- [ ] Form submission works and redirects
- [ ] Vendor created in Supabase with correct owner_id
- [ ] Vendor owner_id matches YOUR user id (not random)
- [ ] /onboarding/:token page loads vendor
- [ ] Start KYC button visible and clickable
- [ ] /dashboard/onboarding loads vendor info
- [ ] Dashboard shows correct vendor (JWT working)
- [ ] Browser console has no 401/403 errors

### Expected Results

✅ **All 10 checks pass** = Seller onboarding is working!

---

## 🔍 If You See Errors

### Error: "401 Unauthorized" or "403 Forbidden"

**Cause**: JWT not being sent to backend  
**Check**: 
- Browser DevTools → Network tab
- Look for fetch to `/api/onboarding/start-kyc`
- Check Authorization header (should have `Bearer token`)
- If missing, JWT header wasn't added correctly

**Fix**: Re-check the code in:
- `src/pages/SellerOnboarding.jsx` - lines ~38-45
- `src/pages/OnboardingDashboard.jsx` - lines ~20-25

---

### Error: "Please log in to become a seller"

**Cause**: SellerSignupForm is checking if user exists  
**Expected**: This is correct behavior! User MUST be logged in

**Check**:
- Make sure you're logged in first
- Go to /become-seller first
- Then click "Sign Up to Sell"

---

### Error: "owner_id, name and slug are required"

**Cause**: Backend didn't receive owner_id  
**Check**: 
- owner_id should be sent from `user.id` automatically
- Check SellerSignupForm.jsx line ~25-27

---

### Error: "Cannot read property 'access_token'"

**Cause**: session or access_token doesn't exist  
**Check**:
- Make sure SupabaseAuthContext is imported correctly
- Verify user is logged in
- Check session?.access_token is not undefined

---

## 📱 Testing Checklist

### Before Testing
- [ ] npm run dev:all is running (both servers up)
- [ ] No critical errors in server terminal
- [ ] Browser console is open (F12)
- [ ] Supabase dashboard open in another tab

### Quick Test Flow
- [ ] Create test buyer account
- [ ] Try /onboarding without being logged in (should block)
- [ ] Click "Become Seller" 
- [ ] Verify owner_id field NOT in form
- [ ] Fill and submit form
- [ ] Check Supabase vendors table for new entry
- [ ] Verify owner_id matches your user id
- [ ] Go to /dashboard/onboarding
- [ ] Verify vendor loads

---

## 🎉 After Testing

If everything works:

```bash
# All fixed! Now you can:

1. Continue with next features
2. Test with real KYC provider (later)
3. Build seller dashboard pages
4. Implement product management
5. Set up payout system
```

---

## 📊 Test Report Template

Save this and fill in after testing:

```
Date: ____________
Tester: __________ 

RESULTS:
--------
✅/❌ Owner_id field hidden
✅/❌ Form submits successfully
✅/❌ Vendor created in DB
✅/❌ Owner_id is correct
✅/❌ Dashboard loads
✅/❌ No JWT errors
✅/❌ All flows work

Issues Found:
- 
- 
- 

Ready for Production: YES / NO
```

---

## 📞 Debugging Tips

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action (click button, submit form)
4. Look for failed requests (red)
5. Click on failed request
6. Check Response and Headers tabs

### Check Browser Console
1. F12 → Console tab
2. Look for red errors
3. Copy full error message
4. Search error in code

### Check Server Logs
1. Look at terminal running npm run dev:all
2. Should see:
   - POST /api/onboarding/signup
   - GET /api/onboarding/:token
   - GET /api/onboarding/me
3. Check for errors in logs

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅
```
1. Push to GitHub
   git push origin feature/auth-login-signup

2. Create Pull Request
   - Title: "feat: Secure seller onboarding with JWT auth"
   - Description: Document fixes

3. Merge to main when ready

4. Deploy to production

5. Continue with next features
```

### If Tests Fail ❌
```
1. Check error in browser console
2. Check server logs for error details
3. Refer to debugging section above
4. Check if code changes match ACTION_PLAN.md
5. Verify SupabaseAuthContext is working
6. Test login/signup works independently
```

---

**Happy Testing! 🚀**

All fixes are in place. Now verify they work!

