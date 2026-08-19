import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const styles = {
  success: { icon: CheckCircle2, accent: 'border-emerald-500', iconClass: 'text-emerald-600', title: 'Success' },
  error: { icon: AlertCircle, accent: 'border-red-500', iconClass: 'text-red-600', title: 'Something needs attention' },
  warning: { icon: AlertTriangle, accent: 'border-amber-500', iconClass: 'text-amber-600', title: 'Please note' },
  info: { icon: Info, accent: 'border-sky-500', iconClass: 'text-sky-600', title: 'Information' },
}

const defaultDuration = { success: 5000, error: 7000, warning: 7000, info: 5500 }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback((input, options = {}) => {
    const toast = typeof input === 'string' ? { message: input, ...options } : input
    if (!toast?.message) return null

    const type = styles[toast.type] ? toast.type : 'info'
    const id = nextId.current++
    const duration = toast.duration ?? defaultDuration[type]

    setToasts((current) => {
      const duplicate = current.find((item) => item.type === type && item.message === toast.message)
      if (duplicate) return current
      return [...current.slice(-3), { id, type, title: toast.title, message: toast.message }]
    })

    if (duration > 0) {
      timers.current.set(id, window.setTimeout(() => dismiss(id), duration))
    }
    return id
  }, [dismiss])

  const api = useMemo(() => ({
    show,
    dismiss,
    success: (message, options) => show(message, { ...options, type: 'success' }),
    error: (message, options) => show(message, { ...options, type: 'error' }),
    warning: (message, options) => show(message, { ...options, type: 'warning' }),
    info: (message, options) => show(message, { ...options, type: 'info' }),
  }), [dismiss, show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[1000] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const design = styles[toast.type]
          const Icon = design.icon
          return (
            <div key={toast.id} role={toast.type === 'error' ? 'alert' : 'status'} className={`pointer-events-auto border-l-4 ${design.accent} bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.20)] ring-1 ring-black/5`}>
              <div className="flex items-start gap-3">
                <Icon size={20} className={`mt-0.5 shrink-0 ${design.iconClass}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-charcoal">{toast.title || design.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-5 text-muted">{toast.message}</p>
                </div>
                <button type="button" onClick={() => dismiss(toast.id)} className="shrink-0 p-1 text-muted transition hover:text-charcoal" aria-label="Dismiss message">
                  <X size={17} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
