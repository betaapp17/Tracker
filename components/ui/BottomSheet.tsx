'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // Close on backdrops tap
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 sheet-backdrop transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sheet — willChange only when open so we don't hold GPU layers for every mounted sheet */}
      <div
        ref={sheetRef}
        style={{ willChange: open ? 'transform' : 'auto' }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-sheet',
          'transform transition-transform duration-250 ease-out',
          'max-h-[92dvh] flex flex-col',
          open ? 'translate-y-0' : 'translate-y-full',
          className
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-ios-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <h2 className="text-[17px] font-semibold text-ios-primary">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-ios-fill flex items-center justify-center pressable"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-ios-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-safe">
          {children}
        </div>
      </div>
    </>
  )
}
