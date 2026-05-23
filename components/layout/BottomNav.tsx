'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, Car, BarChart2, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/inicio',     label: 'Início',     icon: Home },
  { href: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { href: '/veiculos',   label: 'Veículos',   icon: Car },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/mais',       label: 'Mais',       icon: MoreHorizontal },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-ios-border">
      <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/inicio' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 pressable',
                'min-h-[49px]'
              )}
            >
              <Icon
                className={cn('w-6 h-6 transition-colors', active ? 'text-ios-primary' : 'text-ios-tertiary')}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={cn(
                'text-[10px] font-medium transition-colors',
                active ? 'text-ios-primary' : 'text-ios-tertiary'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
