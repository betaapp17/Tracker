import { getIronSession } from 'iron-session'
import type { IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import type { PermissionSet } from './permissions'

export type UserRole = 'owner' | 'employee'

export interface SessionData {
  loggedIn: boolean
  role: UserRole
  userId: string
  name: string
  permissions?: PermissionSet
  lastActivity?: number
}

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000

export const sessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: 'tq-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8,
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
