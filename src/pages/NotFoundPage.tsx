import { Link } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { usePageTitle } from '../hooks'
import { Logo } from '../components/layout/Logo'

export function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto w-fit">
          <Logo />
        </div>
        <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Sprout size={26} aria-hidden />
        </div>
        <h1 className="mt-6 text-[26px] font-extrabold tracking-tight text-ink">This field is unplanted</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
          The page you were looking for doesn't exist in this build. Seed data does not grow
          here — try the public site or the workspace instead.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/" className="rounded-xl bg-brand px-5 py-3 text-[14px] font-bold text-on-brand transition hover:bg-brand-strong">
            Back to home
          </Link>
          <Link to="/app" className="rounded-xl bg-surface px-5 py-3 text-[14px] font-bold text-ink ring-1 ring-inset ring-line-strong transition hover:ring-brand/40">
            Open workspace
          </Link>
        </div>
      </div>
    </div>
  )
}
