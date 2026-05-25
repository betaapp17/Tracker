import { getIronSession } from 'iron-session'
import type { IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export type UserRole = 'owner' | 'employee'

export interface SessionData {
  loggedIn: boolean
  role: UserRole
  userId: string   // 'owner' or employee UUID
  name: string
}

export const sessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: 'tq-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
