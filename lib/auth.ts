import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AUTH_DISABLED, DEMO_USER_ID } from '@/lib/demo'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) return user

  if (AUTH_DISABLED) {
    return {
      id: DEMO_USER_ID,
      email: 'Modo demonstração',
      isDemo: true,
    }
  }

  return null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
