'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Delete, ChevronLeft, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type AppUser = { id: string; name: string; type: 'owner' | 'employee' }

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

export default function LoginPage() {
  const [step, setStep] = useState<'select' | 'pin'>('select')
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState<AppUser[]>([])
  const [profilesError, setProfilesError] = useState('')
  const isSubmittingRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/users', { cache: 'no-store' })
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error)
        setProfiles(data.profiles ?? [])
      })
      .catch(() => setProfilesError('Não foi possível carregar os perfis. Atualize a página e tente novamente.'))
  }, [])

  const selectUser = (user: AppUser) => {
    setSelectedUser(user)
    setStep('pin')
    setPin('')
    setError('')
  }

  const handleKey = (key: string) => {
    if (loading) return
    if (key === 'del') {
      setPin(p => p.slice(0, -1))
      setError('')
      return
    }
    if (pin.length >= 4) return
    const next = pin + key
    setPin(next)
    if (next.length === 4) submitPin(next)
  }

  const submitPin = async (pinValue: string) => {
    if (!selectedUser || isSubmittingRef.current) return
    isSubmittingRef.current = true
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, pin: pinValue }),
      })
      const data = await res.json()

      if (res.ok) {
        router.push('/inicio')
        router.refresh()
      } else {
        setError(data.error ?? 'PIN incorreto.')
        setPin('')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setPin('')
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  const handlePinChange = (value: string) => {
    const next = value.replace(/\D/g, '').slice(0, 4)
    setPin(next)
    if (next) setError('')
  }

  return (
    <div className="min-h-dvh bg-ios-bg flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-ios-primary rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-fab">
            <span className="text-[40px] font-black text-taquinho">T</span>
          </div>
          <h1 className="text-[28px] font-bold text-ios-primary">Taquinho Finance</h1>
          <p className="text-[14px] text-ios-secondary mt-1">Gestão da sua revenda</p>
        </div>

        {step === 'select' ? (
          <UserSelectScreen users={profiles} error={profilesError} onSelect={selectUser} />
        ) : (
          <PinScreen
            user={selectedUser!}
            pin={pin}
            error={error}
            loading={loading}
            onKey={handleKey}
            onPinChange={handlePinChange}
            onSubmit={submitPin}
            onBack={() => { setStep('select'); setPin(''); setError('') }}
          />
        )}
      </div>

      <p className="text-center text-[11px] text-ios-tertiary pb-8">
        Taquinho Finance © 2025
      </p>
    </div>
  )
}

function UserSelectScreen({
  users,
  error,
  onSelect,
}: {
  users: AppUser[]
  error: string
  onSelect: (u: AppUser) => void
}) {
  return (
    <div>
      <p className="text-center text-[15px] font-semibold text-ios-primary mb-6">
        Quem está acessando?
      </p>
      <div className="space-y-3">
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => onSelect(user)}
            className="w-full flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-card pressable text-left"
          >
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
              user.type === 'owner' ? 'bg-ios-primary' : 'bg-ios-fill'
            )}>
              <User className={cn(
                'w-6 h-6',
                user.type === 'owner' ? 'text-taquinho' : 'text-ios-secondary'
              )} />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-ios-primary">{user.name}</p>
            </div>
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-4 text-center text-sm text-expense">{error}</p>}
    </div>
  )
}

function PinScreen({
  user,
  pin,
  error,
  loading,
  onKey,
  onPinChange,
  onSubmit,
  onBack,
}: {
  user: AppUser
  pin: string
  error: string
  loading: boolean
  onKey: (k: string) => void
  onPinChange: (value: string) => void
  onSubmit: (pin: string) => void
  onBack: () => void
}) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!loading && pin.length === 4) onSubmit(pin)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] text-ios-secondary mb-6 pressable"
      >
        <ChevronLeft className="w-4 h-4" />
        Trocar usuário
      </button>

      {/* User badge */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          user.type === 'owner' ? 'bg-ios-primary' : 'bg-ios-fill'
        )}>
          <User className={cn(
            'w-5 h-5',
            user.type === 'owner' ? 'text-taquinho' : 'text-ios-secondary'
          )} />
        </div>
        <p className="text-[16px] font-semibold text-ios-primary">{user.name}</p>
      </div>

      {/* PIN dots */}
      <div className="flex justify-center gap-5 mb-3">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full transition-all duration-150',
              i < pin.length ? 'bg-ios-primary scale-110' : 'bg-ios-border'
            )}
          />
        ))}
      </div>

      <div className="max-w-[280px] mx-auto mb-3">
        <label htmlFor="pin-input" className="block text-[13px] font-medium text-ios-secondary mb-2">
          PIN de acesso
        </label>
        <input
          id="pin-input"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={4}
          value={pin}
          autoFocus
          onChange={event => onPinChange(event.target.value)}
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-white shadow-card px-4 text-center text-[18px] font-semibold tracking-[0.3em] text-ios-primary outline-none focus:ring-2 focus:ring-ios-primary disabled:opacity-50"
        />
      </div>

      {/* Error */}
      <div className="h-6 mb-6 flex items-center justify-center">
        {error && (
          <p className="text-[13px] text-expense text-center animate-pulse">{error}</p>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
        {PIN_KEYS.map((key, i) => {
          if (key === '') return <div key={i} />
          if (key === 'del') {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onKey('del')}
                disabled={loading || pin.length === 0}
                className="h-16 rounded-2xl bg-ios-fill flex items-center justify-center pressable disabled:opacity-30"
              >
                <Delete className="w-5 h-5 text-ios-primary" />
              </button>
            )
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => onKey(key)}
              disabled={loading || pin.length >= 4}
              className="h-16 rounded-2xl bg-white shadow-card text-[24px] font-semibold text-ios-primary flex items-center justify-center pressable disabled:opacity-50"
            >
              {loading && pin.length === 4 ? '···' : key}
            </button>
          )
        })}
      </div>

      <button
        type="submit"
        disabled={loading || pin.length !== 4}
        className="w-full max-w-[280px] h-14 mt-5 mx-auto block rounded-2xl bg-ios-primary text-taquinho text-[16px] font-semibold shadow-card pressable disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
