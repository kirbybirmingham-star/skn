/**
 * Profile Management API
 * Handles user profile updates with proper authorization and field mapping
 * Uses service role key to bypass RLS policies
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseJwt } from './middleware.js';

const router = express.Router();

// Initialize Supabase client with service role (bypasses RLS)
const supabaseServiceUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase service role key not configured. Profile updates will use user auth.');
}

const supabaseService = createClient(supabaseServiceUrl, supabaseServiceKey);

/**
 * PATCH /api/profile
 * Update authenticated user's profile
 * 
 * Request body:
 * {
 *   full_name?: string,
 *   email?: string,
 *   phone?: string,
 *   address?: string,
 *   city?: string,
 *   state?: string,
 *   zip_code?: string,
 *   country?: string,
 *   metadata?: object (merged with existing)
 * }
 * 
 * Returns: Updated profile object
 */
router.patch('/', verifySupabaseJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      country,
      metadata
    } = req.body;

    console.log(`[ProfileAPI] Updating profile for user: ${userId}`);

    // Build update payload - only include provided fields
    const updatePayload = {
      updated_at: new Date().toISOString()
    };

    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (email !== undefined) updatePayload.email = email;
    if (phone !== undefined) updatePayload.phone = phone;
    if (address !== undefined) updatePayload.address = address;
    if (city !== undefined) updatePayload.city = city;
    if (state !== undefined) updatePayload.state = state;
    if (zip_code !== undefined) updatePayload.zip_code = zip_code;
    if (country !== undefined) updatePayload.country = country;

    // Merge metadata if provided
    if (metadata && typeof metadata === 'object') {
      // Get existing profile to preserve existing metadata
      const { data: existingProfile, error: fetchError } = await supabaseService
        .from('profiles')
        .select('metadata')
        .eq('id', userId)
        .single();

      if (!fetchError && existingProfile) {
        updatePayload.metadata = {
          ...(existingProfile.metadata || {}),
          ...metadata
        };
      } else if (!fetchError) {
        updatePayload.metadata = metadata;
      }
    }

    console.log(`[ProfileAPI] Update payload:`, updatePayload);

    // Use service role client to bypass RLS
    const { data: updatedProfile, error } = await supabaseService
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`[ProfileAPI] Update error:`, error);
      return res.status(400).json({
        error: 'Failed to update profile',
        details: error.message,
        code: error.code
      });
    }

    console.log(`[ProfileAPI] ✅ Profile updated successfully`);

    return res.json({
      success: true,
      profile: updatedProfile
    });

  } catch (error) {
    console.error('[ProfileAPI] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/profile
 * Get authenticated user's profile
 */
router.get('/', verifySupabaseJwt, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`[ProfileAPI] Fetching profile for user: ${userId}`);

    const { data: profile, error } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error(`[ProfileAPI] Fetch error:`, error);
      return res.status(404).json({
        error: 'Profile not found',
        details: error.message
      });
    }

    console.log(`[ProfileAPI] ✅ Profile fetched successfully`);

    return res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('[ProfileAPI] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;
