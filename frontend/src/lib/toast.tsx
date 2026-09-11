import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  ToastProvider as RadixToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/ui/toast'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

export type ToastVariant = 'default' | 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let globalToastHandler: ((options: Omit<ToastItem, 'id'>) => void) | null = null

export function showToast(title: string, variant: ToastVariant = 'default', description?: string) {
  if (globalToastHandler) {
    globalToastHandler({ title, description, variant })
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 3000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, title, description, variant, duration }])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  globalToastHandler = toast

  const success = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'success' })
    },
    [toast]
  )

  const error = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'error' })
    },
    [toast]
  )

  const info = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'info' })
    },
    [toast]
  )

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      <RadixToastProvider swipeDirection="down">
        {children}
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            onOpenChange={(open) => {
              if (!open) removeToast(t.id)
            }}
          >
            <div className="flex items-start gap-3">
              {t.variant === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              {t.variant === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              {t.variant === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
              <div className="grid gap-0.5">
                <ToastTitle>{t.title}</ToastTitle>
                {t.description && <ToastDescription>{t.description}</ToastDescription>}
              </div>
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
