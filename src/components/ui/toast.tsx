import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '../../utils'

type ToastKind = 'success' | 'info' | 'warning'

interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  body?: string
}

interface ToastContextValue {
  toast: (t: { kind?: ToastKind; title: string; body?: string }) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let toastSeq = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timers = useRef<Map<number, number>>(new Map())

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    ({ kind = 'info', title, body }: { kind?: ToastKind; title: string; body?: string }) => {
      const id = toastSeq++
      setItems((prev) => [...prev.slice(-3), { id, kind, title, body }])
      const timer = window.setTimeout(() => dismiss(id), 4200)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl bg-forest-900 px-4 py-3 text-ivory shadow-lift ring-1 ring-inset ring-white/10"
            >
              <span className={cn('mt-0.5 shrink-0', t.kind === 'success' && 'text-sage-400', t.kind === 'warning' && 'text-dawn-deep', t.kind === 'info' && 'text-sage-300')}>
                {t.kind === 'success' ? <CheckCircle2 size={17} /> : t.kind === 'warning' ? <TriangleAlert size={17} /> : <Info size={17} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-snug">{t.title}</p>
                {t.body && <p className="mt-0.5 text-xs leading-relaxed text-sage-300/85">{t.body}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-sage-300/70 transition hover:bg-white/10 hover:text-ivory"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
