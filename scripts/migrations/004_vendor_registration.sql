-- Migration: Ensure Vendor Registration (Dec 14, 2025)
-- 
-- This migration ensures that:
-- 1. All existing vendors have their owners registered as 'vendor' role users
-- 2. New vendors automatically get their owners registered
-- 3. The relationship between vendors and profiles is maintained
--
-- Status: Applied via register_existing_sellers.js script and updated onboarding.js
-- Migration Date: December 14, 2025

-- Add comment to vendors table documenting the relationship
COMMENT ON TABLE vendors IS 'Stores/vendors on the marketplace. When a vendor is created, the owner_id must have role=vendor in profiles table';

-- Add comment to profiles table documenting role meanings
COMMENT ON TABLE profiles IS 'User profiles. role can be: null (customer), vendor (seller), admin (administrator)';

-- Verify all vendors have corresponding profiles with vendor role
-- This is handled by the register_existing_sellers.js script

-- Future: Consider adding a trigger to automatically set role='vendor' when a vendor is created
-- (This would require database-level permissions and should be carefully tested)

-- Documentation of the fix:
-- Before: Vendors were created without updating the user's profile role
-- After: When a vendor is created, the owner's profile role is updated to 'vendor'
-- Result: Sellers can now access /dashboard/vendor and other protected vendor pages
