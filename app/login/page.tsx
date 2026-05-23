'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = () => {
    if (!email || !password) return
    setError('')

    startTransition(async () => {
      const supabase = createClient()

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) { setError(error.message); return }
        setError('Verifique seu e-mail para confirmar o cadastro.')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('E-mail ou senha incorretos.'); return }
      router.push('/')
      router.refresh()
    })
  }

  return (
    <div className="min-h-dvh bg-ios-bg flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-ios-primary rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-fab">
            <span className="text-[40px] font-black text-taquinho">T</span>
          </div>
          <h1 className="text-[28px] font-bold text-ios-primary">Taquinho Finance</h1>
          <p className="text-[14px] text-ios-secondary mt-1">Gestão da sua revenda</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-6 shadow-card space-y-4">
          <h2 className="text-[20px] font-bold text-ios-primary">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h2>

          <Input
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <Input
            label="Senha"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && (
            <p className={`text-[13px] ${error.includes('Verifique') ? 'text-profit' : 'text-expense'}`}>
              {error}
            </p>
          )}

          <Button onClick={handleSubmit} loading={pending} className="mt-2">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </Button>
        </div>

        {/* Toggle */}
        <p className="text-center text-[13px] text-ios-secondary mt-6">
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button
            onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
            className="text-ios-primary font-semibold"
          >
            {mode === 'login' ? 'Cadastrar' : 'Entrar'}
          </button>
        </p>
      </div>

      {/* Footer */}
      <p className="text-center text-[11px] text-ios-tertiary pb-8">
        Taquinho Finance © 2025
      </p>
    </div>
  )
}
