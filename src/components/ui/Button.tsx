import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dark'
type Size = 'sm' | 'md' | 'lg'

 export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 select-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
    size === 'sm' && 'px-3 py-1.5 text-[13px]',
    size === 'md' && 'px-4 py-2.5 text-sm',
    size === 'lg' && 'px-6 py-3.5 text-[15px]',
    variant === 'primary' &&
      'bg-brand text-on-brand shadow-[0_1px_2px_rgb(16_42_36/0.15),0_10px_24px_-10px_rgb(38_122_86/0.45)] hover:bg-brand-strong',
    variant === 'secondary' &&
      'bg-brand-soft text-brand hover:bg-brand-soft/70 ring-1 ring-inset ring-brand/15',
    variant === 'outline' && 'bg-surface text-ink ring-1 ring-inset ring-line hover:ring-line-strong hover:bg-surface-2/60',
    variant === 'ghost' && 'bg-transparent text-muted hover:text-ink hover:bg-surface-2/70',
    variant === 'danger' && 'bg-danger text-white hover:brightness-95',
    className,
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', leadingIcon, trailingIcon, className, children, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={buttonClasses(variant, size, className)} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
})

export interface LinkButtonProps extends Omit<LinkProps, 'to'> {
  to: string
  variant?: Variant
  size?: Size
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export function LinkButton({ to, variant = 'primary', size = 'md', leadingIcon, trailingIcon, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link to={to} className={buttonClasses(variant, size, className)} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  )
}
