import { redirect } from 'next/navigation'
import { getSession } from './session'
import { getOwnerUserId } from './supabase/service'

export type AppUser = {
  id: string          // always the owner's Supabase user_id
  role: 'owner' | 'employee'
  name: string
  sessionUserId: string  // 'owner' or employee UUID
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await getSession()
  if (!session.loggedIn) return null

  return {
    id: getOwnerUserId(),
    role: session.role,
    name: session.name,
    sessionUserId: session.userId,
  }
}

export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireOwner(): Promise<AppUser> {
  const user = await requireAuth()
  if (user.role !== 'owner') redirect('/inicio')
  return user
}
