import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Server-only service role client — bypasses Row Level Security.
// NEVER import this file from client components or expose the key to the browser.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase service role configuration. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
  }

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// The owner's Supabase user_id — all business data is scoped to this account.
export function getOwnerUserId(): string {
  const id = process.env.OWNER_USER_ID
  if (!id) throw new Error('OWNER_USER_ID env var is not set in .env.local')
  return id
}
