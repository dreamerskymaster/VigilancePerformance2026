/**
 * Supabase client configuration for the vigilance study.
 * Handles connection to the database for storing participant data.
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon/public key
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Check if Supabase is configured.
 * Returns false if environment variables are missing.
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
}

/**
 * Supabase client instance.
 * Will be null if environment variables are not configured.
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Log a warning if Supabase is not configured.
 * Data will be stored in localStorage as fallback.
 */
if (!supabase) {
  console.warn(
    '[Vigilance Study] Supabase not configured. Data will be stored locally only.',
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable cloud storage.'
  )
}
