# ⚡ QUICK TEST CHECKLIST (5-10 minutes)

**Current Status**: Servers running on npm run dev:all  
**Frontend**: http://localhost:3000  
**Backend**: http://localhost:3001

---

## ✅ Test 1: Can Access Homepage (1 min)

**Action**: Go to http://localhost:3000

**Expected Results**:
- [ ] Homepage loads without errors
- [ ] No red errors in browser console (F12)
- [ ] See "Become a Seller" button

---

## ✅ Test 2: Route Protection Works (2 min)

**Action**: Try to access /onboarding without logging in

```
Go to: http://localhost:3000/onboarding
```

**Expected Results**:
- [ ] Either redirects to login OR shows "Please log in" message
- [ ] Does NOT show the seller form
- [ ] ProtectedRoute is working ✅

---

## ✅ Test 3: Signup Flow (5 min)

**Action 1**: Sign up as buyer
```
1. Click login/signup
2. Create account: test@example.com / TestPassword123!
3. Confirm you're logged in
```

**Expected Results**:
- [ ] Account created successfully
- [ ] You see user menu or profile
- [ ] Console has no auth errors

**Action 2**: Become a seller
```
1. Click "Become Seller"
2. Should see seller form
3. CHECK: Is owner_id field visible?
```

**Expected Results**:
- [ ] Form appears
- [ ] ❌ NO owner_id field (this was the bug!)
- [ ] Shows: Store Name, Slug, Website, Email, Description

**Action 3**: Fill and submit form
```
1. Store Name: "Test Store"
2. Slug: "test-store"
3. Website: "https://test.com"
4. Email: "store@test.com"
5. Description: "Test"
6. Click "Create Seller Account"
```

**Expected Results**:
- [ ] Form submits
- [ ] Redirects to /onboarding/:token page
- [ ] Shows vendor info ("Test Store", "started" status)
- [ ] No JWT/401 errors in console

---

## ✅ Test 4: Check Supabase (2 min)

**Action**: Go to Supabase Dashboard
```
1. https://app.supabase.com
2. Open your project
3. Go to vendors table
4. Look for "Test Store"
```

**Expected Results**:
- [ ] New vendor found
- [ ] name = "Test Store"
- [ ] slug = "test-store"
- [ ] ⭐ owner_id = YOUR user.id (matches!)
- [ ] onboarding_status = "started"
- [ ] onboarding_token is set

---

## ✅ Test 5: Dashboard Access (1 min)

**Action**: Go to dashboard
```
Go to: http://localhost:3000/dashboard/onboarding
```

**Expected Results**:
- [ ] Page loads
- [ ] Shows vendor info
- [ ] Shows "Test Store"
- [ ] No JWT/401 errors

---

## 🎯 SUMMARY

If ALL checks pass ✅:
- Fixes are working correctly
- Ready to push to GitHub
- Ready for code review

If ANY check fails ❌:
- Check browser console for errors
- Check server logs
- Report the error

---

## 🚀 NEXT: Push to GitHub

Once tests pass, we'll push:
```bash
git push origin feature/auth-login-signup
```

Then create a Pull Request!

