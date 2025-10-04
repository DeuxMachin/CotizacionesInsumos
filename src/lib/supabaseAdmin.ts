import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Database } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// This client uses the service role key to bypass RLS for trusted server-side operations.
// It must ONLY be used on the server (API routes, server actions).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin: SupabaseClient = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : (supabase as unknown as SupabaseClient)
