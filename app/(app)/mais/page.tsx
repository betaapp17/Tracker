import { requireAuth } from '@/lib/auth'
import { LogoutButton } from '@/components/layout/LogoutButton'
import { Card } from '@/components/ui/Card'
import { ChevronRight, User, HelpCircle, Bell, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MaisPage() {
  const user = await requireAuth()

  return (
    <div className="px-4 pt-12">
      <h1 className="text-[28px] font-bold text-ios-primary mb-6">Mais</h1>

      {/* Profile */}
      <Card className="mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-ios-primary flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-taquinho" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-semibold text-ios-primary">Minha Conta</p>
          <p className="text-[13px] text-ios-secondary truncate">{user?.email}</p>
        </div>
      </Card>

      {/* Settings sections */}
      <div className="space-y-3 mb-6">
        <p className="text-[11px] font-semibold text-ios-secondary uppercase tracking-wider px-1">
          Configurações
        </p>
        <Card padding="none">
          {[
            { icon: Bell, label: 'Notificações', disabled: true },
            { icon: Shield, label: 'Privacidade', disabled: true },
            { icon: HelpCircle, label: 'Ajuda & Suporte', disabled: true },
          ].map(({ icon: Icon, label, disabled }, i, arr) => (
            <button
              key={label}
              disabled={disabled}
              className={`flex items-center gap-3 w-full px-4 py-3.5 pressable ${
                i < arr.length - 1 ? 'border-b border-ios-border/50' : ''
              } ${disabled ? 'opacity-40' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-ios-fill flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-ios-secondary" />
              </div>
              <span className="flex-1 text-left text-[14px] text-ios-primary">{label}</span>
              <ChevronRight className="w-4 h-4 text-ios-tertiary" />
            </button>
          ))}
        </Card>
      </div>

      {/* App info */}
      <Card className="mb-6 text-center">
        <div className="w-14 h-14 bg-taquinho rounded-2xl mx-auto mb-3 flex items-center justify-center">
          <span className="text-[24px] font-black text-ios-primary">T</span>
        </div>
        <p className="text-[15px] font-semibold text-ios-primary">Taquinho Finance</p>
        <p className="text-[12px] text-ios-secondary mt-1">Versão 1.0.0</p>
      </Card>

      <LogoutButton />
    </div>
  )
}
