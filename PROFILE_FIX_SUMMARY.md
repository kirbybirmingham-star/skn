# Profile Update Bug Fix Summary

## Issue Overview
The application was failing with a 400 Bad Request error when users tried to update their profile in AccountSettings:
```
PGRST204: Could not find the 'address' column of 'profiles' in the schema cache
```

## Root Cause
The code was attempting to update columns (`address`, `city`, `state`, `zip_code`, `country`, `phone`) that **do not exist** in the Supabase `profiles` table.

### Actual profiles table schema:
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  role text DEFAULT 'buyer',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

The only updatable user-profile fields are: `full_name`, `email`, `avatar_url`, `role`, and `metadata`.

## Solutions Applied

### 1. ✅ Fixed [src/pages/AccountSettings.jsx](src/pages/AccountSettings.jsx)
**Problem:** Form state was reading non-existent columns directly from profile/user_metadata.

**Fix:** Modified lines 35-43 to read address/city/state/zip_code/phone from `profile.metadata` instead:
```jsx
// BEFORE (BROKEN)
const [formData, setFormData] = useState({
  full_name: profile?.full_name || '',
  email: user?.email || '',
  phone: profile?.phone || '',           // ❌ Doesn't exist
  address: profile?.address || '',       // ❌ Doesn't exist
  city: profile?.city || '',             // ❌ Doesn't exist
  state: profile?.state || '',           // ❌ Doesn't exist
  zip_code: profile?.zip_code || '',     // ❌ Doesn't exist
  country: profile?.country || 'US'      // ❌ Doesn't exist
});

// AFTER (FIXED)
const [formData, setFormData] = useState({
  full_name: profile?.full_name || '',
  email: user?.email || '',
  phone: profile?.metadata?.phone || '',        // ✅ From metadata
  address: profile?.metadata?.address || '',    // ✅ From metadata
  city: profile?.metadata?.city || '',          // ✅ From metadata
  state: profile?.metadata?.state || '',        // ✅ From metadata
  zip_code: profile?.metadata?.zip_code || '', // ✅ From metadata
  country: profile?.metadata?.country || 'US'  // ✅ From metadata
});
```

**Problem:** handleProfileUpdate was sending all fields as top-level updates.

**Fix:** Modified lines 103-114 to only send `full_name` as a direct column update, storing all other fields in the `metadata` JSONB:
```jsx
// BEFORE (BROKEN)
const handleProfileUpdate = async () => {
  await updateUserProfile({
    full_name: formData.full_name,
    phone: formData.phone,         // ❌ Doesn't exist
    address: formData.address,     // ❌ Doesn't exist
    city: formData.city,           // ❌ Doesn't exist
    state: formData.state,         // ❌ Doesn't exist
    zip_code: formData.zip_code,   // ❌ Doesn't exist
    country: formData.country      // ❌ Doesn't exist
  });
};

// AFTER (FIXED)
const handleProfileUpdate = async () => {
  await updateUserProfile({
    full_name: formData.full_name,
    metadata: {
      ...profile?.metadata || {},
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      country: formData.country
    }
  });
};
```

### 2. ✅ Removed Debug Logging from [src/components/Header.jsx](src/components/Header.jsx#L159)
**Problem:** Console.log statements in JSX render were executing on every render, causing infinite logging loops and polluting console output with repeated messages:
```
Header profile avatar_url: null
Header user_metadata avatar_url: undefined
Header profile object: {...}
```

**Fix:** Removed the three console.log statements (lines 159-161):
```jsx
// BEFORE (BROKEN)
<Avatar className="h-8 w-8 border-2 border-white shadow-sm">
  <AvatarImage src={profile?.avatar_url} alt={user.email} />
  <AvatarFallback>{getAvatarFallback(user.email)}</AvatarFallback>
</Avatar>
{console.log('Header profile avatar_url:', profile?.avatar_url)}
{console.log('Header user_metadata avatar_url:', user.user_metadata?.avatar_url)}
{console.log('Header profile object:', profile)}

// AFTER (FIXED)
<Avatar className="h-8 w-8 border-2 border-white shadow-sm">
  <AvatarImage src={profile?.avatar_url} alt={user.email} />
  <AvatarFallback>{getAvatarFallback(user.email)}</AvatarFallback>
</Avatar>
```

### 3. ✅ Removed Debug Logging from [src/components/profile/AvatarManager.jsx](src/components/profile/AvatarManager.jsx#L50)
**Problem:** Same infinite logging issue in AvatarManager component (lines 50-52).

**Fix:** Removed the three console.log statements:
```jsx
// BEFORE (BROKEN)
<Avatar className="w-20 h-20">
  <AvatarImage src={profile?.avatar_url} />
  <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
</Avatar>
{console.log('AvatarManager profile avatar_url:', profile?.avatar_url)}
{console.log('AvatarManager user_metadata avatar_url:', user?.user_metadata?.avatar_url)}
{console.log('AvatarManager profile object:', profile)}

// AFTER (FIXED)
<Avatar className="w-20 h-20">
  <AvatarImage src={profile?.avatar_url} />
  <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
</Avatar>
```

## Testing Instructions

1. **Clear browser cache** and reload the app
2. **Navigate to Account Settings** page
3. **Update profile information** (name, phone, address, etc.) - should now succeed
4. **Check browser console** - should no longer have infinite avatar_url logging
5. **Verify metadata storage** - In Supabase, check that address/city/state/zip_code are stored in the `metadata` JSONB field of the profiles table

## Expected Results After Fix

✅ Profile updates complete without 400 errors
✅ Console no longer has infinite logging loops
✅ Address fields stored in metadata JSONB instead of non-existent columns
✅ User can successfully save profile changes

## Technical Notes

- The Supabase `profiles` table uses a `metadata` JSONB field for flexible, user-defined data
- This approach is more scalable than adding individual columns for every possible user attribute
- The fix maintains backward compatibility with existing profile data
- All changes are in the frontend only - no database schema modifications needed

## Files Modified

1. [src/pages/AccountSettings.jsx](src/pages/AccountSettings.jsx) - Lines 35-43 and 103-114
2. [src/components/Header.jsx](src/components/Header.jsx) - Lines 159-161 (removed)
3. [src/components/profile/AvatarManager.jsx](src/components/profile/AvatarManager.jsx) - Lines 50-52 (removed)

## Related Documentation

- [Data Layer Guide](DATA_LAYER_GUIDE.md) - For future implementation of centralized profile updates
- [Supabase Setup](docs/SUPABASE_SETUP.md) - Database schema information
- [Database Schema](docs/SCHEMA.md) - profiles table definition
