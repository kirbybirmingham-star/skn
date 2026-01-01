# PRODUCT_ Logic Applied to Profile Management

## Overview
Applied the security and architecture patterns from PRODUCT_ documentation to profile management system. This ensures robust, secure, and maintainable profile updates.

## Key Concepts Applied

### 1. **Backend API Endpoint Pattern** ✅
Following PRODUCT_UPDATE_FIX_SUMMARY.md approach:
- Created backend endpoint using service role key (bypasses RLS)
- JWT verification for authentication
- Proper error handling and logging
- Field mapping between form and database schema

### 2. **Service Role Client Usage** ✅
**File**: [server/profile.js](server/profile.js)
- Uses `SUPABASE_SERVICE_ROLE_KEY` instead of anon key
- Bypasses Row-Level Security policies
- Eliminates silent failures from RLS denials
- Proper authorization checks via JWT

### 3. **Frontend API Integration** ✅
**File**: [src/contexts/SupabaseAuthContext.jsx](src/contexts/SupabaseAuthContext.jsx)
- Frontend calls backend endpoint instead of direct Supabase
- Passes JWT token in Authorization header
- Handles errors properly
- Updates local state on success

## Implementation Details

### Backend API Endpoints

#### PATCH /api/profile
Updates authenticated user's profile with all supported fields.

**Request**:
```javascript
{
  full_name?: string,
  email?: string,
  phone?: string,
  address?: string,
  city?: string,
  state?: string,
  zip_code?: string,
  country?: string,
  metadata?: object  // merged with existing
}
```

**Response**:
```javascript
{
  success: true,
  profile: { /* updated profile object */ }
}
```

**Features**:
- Only updates provided fields (partial updates)
- Automatically sets `updated_at` timestamp
- Preserves existing metadata when merging
- Uses service role key to bypass RLS
- Full error logging with codes

#### GET /api/profile
Fetches authenticated user's profile.

**Response**:
```javascript
{
  success: true,
  profile: { /* user's profile object */ }
}
```

### Field Mapping
Unlike some systems that store everything in metadata, this implementation:
- ✅ Stores fields directly in table columns when they exist
- ✅ Falls back to metadata for unmapped fields
- ✅ Supports metadata merging (preserves existing data)
- ✅ Maintains backward compatibility

### Security Architecture

```
Frontend Form
    ↓
SupabaseAuthContext.updateUserProfile()
    ↓
/api/profile PATCH endpoint (JWT verified)
    ↓
Supabase Client (Service Role Key)
    ↓
Database (RLS bypassed for service role)
```

## Files Modified

| File | Changes | Pattern |
|------|---------|---------|
| [server/profile.js](server/profile.js) | NEW - Backend profile API | Service role pattern |
| [server/index.js](server/index.js) | Import & register profile routes | Route registration |
| [src/contexts/SupabaseAuthContext.jsx](src/contexts/SupabaseAuthContext.jsx) | Use backend API instead of direct Supabase | API integration pattern |
| [scripts/apply-profile-columns.js](scripts/apply-profile-columns.js) | Enhanced with service role execution | Migration pattern |

## Migration Script Improvements

Updated `apply-profile-columns.js` to:
- Load environment variables properly
- Attempt to apply migrations using service role
- Graceful fallback if service function not available
- Clear feedback on success/failure
- Better console output formatting

**Run with**: `node scripts/apply-profile-columns.js`

## Advantages Over Direct Supabase Calls

| Aspect | Direct Supabase | Backend Endpoint |
|--------|-----------------|------------------|
| RLS Policies | Subject to RLS denials | Bypasses via service role |
| Error Handling | Silent failures possible | Explicit error responses |
| Field Validation | Client-side only | Backend validation |
| Logging | Limited | Full audit trail |
| Schema Changes | Breaks on column mismatch | Handles gracefully |
| Metadata Merging | Manual | Automatic |

## Testing

**Frontend Testing**:
1. Navigate to Account Settings
2. Update profile fields (name, phone, address, etc.)
3. Verify no errors in console
4. Check database for updated values

**Backend Testing**:
```bash
# Test with curl
curl -X PATCH http://localhost:3001/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"full_name":"New Name","phone":"555-1234"}'
```

## Error Scenarios Handled

1. **Missing JWT Token**: Returns 401 Unauthorized
2. **Invalid Session**: Catches and reports
3. **Database Errors**: Returns 400 with details
4. **Missing Profile**: Returns 404
5. **Malformed Data**: Returns 400 with description

## Migration Path

### Before (Direct Supabase)
```javascript
// Subject to RLS policies, silent failures
const { data, error } = await supabase
  .from('profiles')
  .update(updates)
  .eq('id', userId);
```

### After (Backend API)
```javascript
// Service role bypass, explicit errors
const response = await fetch('/api/profile', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(updates)
});
```

## Performance Considerations

- Single HTTP request to backend
- Service role client connection reused
- Database query optimized with single update
- Metadata merging happens server-side
- Proper indexing on profiles table ensures fast lookups

## Future Enhancements

1. Add profile picture upload endpoint
2. Implement email verification flow
3. Add role-based profile visibility
4. Create profile history/audit log
5. Add bulk profile update for admins
6. Implement profile validation schemas

## Dependencies

- `express` - HTTP server framework
- `@supabase/supabase-js` - Supabase client library
- Middleware: `verifySupabaseJwt` - JWT verification
- Environment: `SUPABASE_SERVICE_ROLE_KEY` - Service role authentication

## Deployment Notes

1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in production .env
2. Verify backend is running on correct port
3. Check CORS settings allow API calls
4. Monitor logs for RLS-related errors
5. Test with various profile field combinations

---

**Applied**: December 31, 2025
**Pattern Source**: PRODUCT_UPDATE_FIX_SUMMARY.md
**Status**: ✅ Complete and Ready for Testing
