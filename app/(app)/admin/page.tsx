'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, UserX, UserCheck, Trash2, KeyRound, User } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { addEmployee, toggleEmployee, deleteEmployee, updateEmployeePin } from '@/lib/actions/admin'
import { cn } from '@/lib/utils'

type Employee = {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export default function AdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addPin, setAddPin] = useState('')
  const [addError, setAddError] = useState('')
  const [pending, startTransition] = useTransition()
  const [resetTarget, setResetTarget] = useState<Employee | null>(null)
  const [newPin, setNewPin] = useState('')
  const [resetError, setResetError] = useState('')
  const router = useRouter()

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/employees')
      if (res.status === 403) { router.push('/inicio'); return }
      const data = await res.json()
      setEmployees(data.employees ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEmployees() }, [])

  const handleAdd = () => {
    setAddError('')
    if (!addName.trim()) { setAddError('Nome obrigatório.'); return }
    if (!/^\d{4}$/.test(addPin)) { setAddError('PIN deve ter 4 dígitos.'); return }

    startTransition(async () => {
      try {
        await addEmployee(addName, addPin)
        setAddName(''); setAddPin(''); setShowAdd(false)
        await loadEmployees()
      } catch (e: unknown) {
        setAddError(e instanceof Error ? e.message : 'Erro ao adicionar.')
      }
    })
  }

  const handleToggle = (emp: Employee) => {
    startTransition(async () => {
      await toggleEmployee(emp.id, !emp.is_active)
      await loadEmployees()
    })
  }

  const handleDelete = (emp: Employee) => {
    if (!confirm(`Remover ${emp.name}? Essa ação não pode ser desfeita.`)) return
    startTransition(async () => {
      await deleteEmployee(emp.id)
      await loadEmployees()
    })
  }

  const handleResetPin = () => {
    if (!resetTarget) return
    setResetError('')
    if (!/^\d{4}$/.test(newPin)) { setResetError('PIN deve ter 4 dígitos.'); return }
    startTransition(async () => {
      try {
        await updateEmployeePin(resetTarget.id, newPin)
        setResetTarget(null); setNewPin('')
      } catch (e: unknown) {
        setResetError(e instanceof Error ? e.message : 'Erro.')
      }
    })
  }

  return (
    <div className="px-4 pt-12 animate-page-enter pb-24">
      <Link href="/mais" className="flex items-center gap-1 text-[14px] text-ios-secondary mb-5 pressable -ml-1">
        <ChevronLeft className="w-5 h-5" />
        Mais
      </Link>
      <h1 className="text-[28px] font-bold text-ios-primary mb-6">Gerenciar Equipe</h1>

      {/* Add employee */}
      {showAdd ? (
        <Card className="mb-6 space-y-3">
          <p className="text-[15px] font-semibold text-ios-primary">Novo Funcionário</p>
          <Input
            label="Nome"
            placeholder="Nome do funcionário"
            value={addName}
            onChange={e => setAddName(e.target.value)}
          />
          <Input
            label="PIN (4 dígitos)"
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={addPin}
            onChange={e => setAddPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          {addError && <p className="text-[12px] text-expense">{addError}</p>}
          <div className="flex gap-2">
            <Button onClick={handleAdd} loading={pending} className="flex-1">Adicionar</Button>
            <Button
              onClick={() => { setShowAdd(false); setAddName(''); setAddPin(''); setAddError('') }}
              className="flex-1 bg-ios-fill text-ios-primary"
            >
              Cancelar
            </Button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-ios-border text-[14px] text-ios-secondary mb-6 pressable"
        >
          <Plus className="w-4 h-4" />
          Adicionar Funcionário
        </button>
      )}

      {/* Employee list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-200 animate-pulse" />)}
        </div>
      ) : employees.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-[14px] text-ios-secondary">Nenhum funcionário cadastrado.</p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-ios-border/50">
            {employees.map(emp => (
              <div key={emp.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  emp.is_active ? 'bg-ios-fill' : 'bg-gray-100'
                )}>
                  <User className={cn('w-5 h-5', emp.is_active ? 'text-ios-secondary' : 'text-ios-tertiary')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[14px] font-semibold', emp.is_active ? 'text-ios-primary' : 'text-ios-tertiary')}>
                    {emp.name}
                  </p>
                  <p className="text-[11px] text-ios-tertiary">
                    {emp.is_active ? 'Ativo' : 'Desativado'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setResetTarget(emp); setNewPin(''); setResetError('') }}
                    className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center pressable"
                    title="Redefinir PIN"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleToggle(emp)}
                    disabled={pending}
                    className="w-8 h-8 rounded-xl bg-ios-fill flex items-center justify-center pressable"
                    title={emp.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {emp.is_active
                      ? <UserX className="w-3.5 h-3.5 text-ios-secondary" />
                      : <UserCheck className="w-3.5 h-3.5 text-profit" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(emp)}
                    disabled={pending}
                    className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center pressable"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-expense" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reset PIN modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setResetTarget(null)}>
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <p className="text-[16px] font-bold text-ios-primary">Redefinir PIN — {resetTarget.name}</p>
            <Input
              label="Novo PIN (4 dígitos)"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            {resetError && <p className="text-[12px] text-expense">{resetError}</p>}
            <div className="flex gap-2">
              <Button onClick={handleResetPin} loading={pending} className="flex-1">Salvar</Button>
              <Button onClick={() => setResetTarget(null)} className="flex-1 bg-ios-fill text-ios-primary">Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
