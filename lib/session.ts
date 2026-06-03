import { getIronSession } from 'iron-session'
import type { IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export type UserRole = 'owner' | 'employee'

export interface SessionData {
  loggedIn: boolean
  role: UserRole
  userId: string   // 'owner' or employee UUID
  name: string
  lastActivity?: number  // unix ms timestamp, updated on every request
}

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export const sessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: 'tq-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
