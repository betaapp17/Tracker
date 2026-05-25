import { NextRequest, NextResponse } from 'next/server'
import { compareSync } from 'bcryptjs'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/session'
import type { SessionData } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/service'

// In-memory rate limiter: 5 attempts per IP per 60 seconds.
// Resets on server restart — acceptable for an internal tool.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return { allowed: true }
  }

  if (entry.count >= 5) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const rateCheck = checkRateLimit(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Muitas tentativas incorretas. Aguarde ${rateCheck.retryAfter}s.` },
      { status: 429 }
    )
  }

  let body: { userId?: unknown; pin?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  const { userId, pin } = body

  if (
    typeof userId !== 'string' ||
    typeof pin !== 'string' ||
    pin.length !== 4 ||
    !/^\d{4}$/.test(pin)
  ) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  let role: 'owner' | 'employee'
  let name: string
  let resolvedUserId: string

  if (userId === 'owner') {
    const ownerPinHash = process.env.OWNER_PIN_HASH
    if (!ownerPinHash) {
      return NextResponse.json(
        { error: 'Sistema não configurado. Defina OWNER_PIN_HASH no .env.local.' },
        { status: 500 }
      )
    }

    if (!compareSync(pin, ownerPinHash)) {
      return NextResponse.json({ error: 'PIN incorreto.' }, { status: 401 })
    }

    role = 'owner'
    name = process.env.OWNER_NAME ?? 'Proprietário'
    resolvedUserId = 'owner'
  } else {
    const supabase = createServiceClient()
    const { data: employee } = await supabase
      .from('app_employees')
      .select('id, name, pin_hash, is_active')
      .eq('id', userId)
      .single()

    if (!employee || !employee.is_active) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 })
    }

    if (!compareSync(pin, employee.pin_hash)) {
      return NextResponse.json({ error: 'PIN incorreto.' }, { status: 401 })
    }

    role = 'employee'
    name = employee.name
    resolvedUserId = employee.id
  }

  // Create session using cookies() from next/headers
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  session.loggedIn = true
  session.role = role
  session.userId = resolvedUserId
  session.name = name
  session.lastActivity = Date.now()
  await session.save()

  return NextResponse.json({ ok: true })
}
