import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils'

// ---------------------------------------------------------------------------
// Field wrapper (label + control + hint/error)
// ---------------------------------------------------------------------------

export interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn('w-full', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-semibold text-ink">
        {label}
        {required && <span className="text-danger" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const controlBase =
  'w-full rounded-xl border-0 bg-surface ring-1 ring-inset ring-line text-[14px] text-ink placeholder:text-faint transition-shadow duration-150 focus:ring-2 focus:ring-brand focus:outline-none disabled:opacity-60'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(controlBase, 'px-3.5 py-2.5', className)} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn(controlBase, 'appearance-none pr-9 pl-3.5 py-2.5 bg-no-repeat', className)}
      style={{
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2369736C\' stroke-width=\'2.5\' stroke-linecap=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-9%27/%3E%3C/svg%3E")',
        backgroundPosition: 'right 0.8rem center',
      }}
      {...rest}
    >
      {children}
    </select>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(controlBase, 'px-3.5 py-2.5 min-h-[96px] resize-y', className)} {...rest} />
})

// ---------------------------------------------------------------------------
// Switch (accessible toggle)
// ---------------------------------------------------------------------------

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
}

export function Switch({ checked, onChange, label, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-brand' : 'bg-surface-3 ring-1 ring-inset ring-line',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform duration-200',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  hint?: ReactNode
}

export function Slider({ className, label, hint, id, ...rest }: SliderProps) {
  return (
    <div>
      {label && <div className="mb-2 flex items-center justify-between text-[13px] font-semibold text-ink">{label}</div>}
      <input id={id} type="range" className={cn('w-full', className)} {...rest} />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}
