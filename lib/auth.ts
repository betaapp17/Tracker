import { redirect } from 'next/navigation'
import { getSession } from './session'
import { getOwnerUserId } from './supabase/service'
import { can, type Permission, type PermissionSet } from './permissions'

export type AppUser = {
  id: string
  role: 'owner' | 'employee'
  name: string
  sessionUserId: string
  permissions: PermissionSet
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await getSession()
  if (!session.loggedIn) return null
  return {
    id: getOwnerUserId(),
    role: session.role,
    name: session.name,
    sessionUserId: session.userId,
    permissions: session.permissions ?? {},
  }
}

export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requirePermission(permission: Permission): Promise<AppUser> {
  const user = await requireAuth()
  if (!can(user.role, permission, user.permissions)) throw new Error('Sem permissão para esta ação.')
  return user
}

export async function requireOwner(): Promise<AppUser> {
  const user = await requireAuth()
  if (user.role !== 'owner') redirect('/inicio')
  return user
}
