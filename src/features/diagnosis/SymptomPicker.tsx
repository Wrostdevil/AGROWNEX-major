import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, ImagePlus } from 'lucide-react'
import { SYMPTOM_GROUPS } from '../../data/catalog'
import { cn } from '../../utils'

/**
 * Grouped symptom chip picker with at-least-one requirement signalled purely
 * via helper text + validation (the aria-live copy handles screen readers).
 */
export function SymptomPicker({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      {SYMPTOM_GROUPS.map((group) => (
        <div key={group.key}>
          <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-faint">
            {group.label}
            <span className="text-[10px] font-semibold normal-case tracking-normal">
              {selected.filter((id) => group.symptoms.some((s) => s.id === id)).length} selected
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {group.symptoms.map((s) => {
              const active = selected.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onToggle(s.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold ring-1 ring-inset transition-all duration-150',
                    active
                      ? 'bg-brand text-on-brand ring-brand shadow-[0_6px_16px_-6px_rgb(38_122_86/0.5)]'
                      : 'bg-surface text-muted ring-line hover:ring-line-strong hover:text-ink',
                  )}
                >
                  {active && <Check size={13} aria-hidden />}
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <p className="text-[12px] leading-relaxed text-muted" aria-live="polite">
        {selected.length === 0
          ? 'Select at least one observation for the analysis.'
          : `${selected.length} observation${selected.length > 1 ? 's' : ''} noted — you can add more or continue.`}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Image dropzone
// ---------------------------------------------------------------------------

export interface DropzoneImageProps {
  preview: string | null
  fileName: string | null
  busy: boolean
  error: string | null
  onSelectFile: (file: File) => void
  onRemove: () => void
}

export function DropzoneImage({ preview, fileName, busy, error, onSelectFile, onRemove }: DropzoneImageProps) {
  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files?.[0]
          if (f) onSelectFile(f)
        }}
        className={cn(
          'relative rounded-2xl border-2 border-dashed p-5 text-center transition-colors',
          error ? 'border-danger/50 bg-danger-soft/40' : 'border-line-strong bg-surface-2/50 hover:border-brand/50 hover:bg-brand-soft/40',
        )}
      >
        {preview ? (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4">
              <img src={preview} alt="Selected crop area preview" className="h-24 w-24 rounded-xl object-cover ring-1 ring-line" />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[13px] font-bold text-ink">{fileName}</p>
                <p className="mt-0.5 text-[11.5px] text-muted">Stored downscaled on this device · used for context only</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="text-[12px] font-bold text-brand hover:underline" onClick={onRemove}>
                    Remove image
                  </button>
                  <label className="cursor-pointer text-[12px] font-bold text-muted hover:text-ink">
                    Replace
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelectFile(f) }} />
                  </label>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-2">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-brand ring-1 ring-inset ring-line">
              <ImagePlus size={19} aria-hidden />
            </span>
            <p className="mt-1 text-[13px] font-bold text-ink">Drag & drop an image, or browse</p>
            <p className="text-[11.5px] text-muted">Optional · JPG / PNG / WebP · up to 5 MB · a leaf close-up works best</p>
            <label className="mt-1.5 cursor-pointer rounded-xl bg-surface px-4 py-2 text-[12.5px] font-bold text-brand ring-1 ring-inset ring-brand/25 transition hover:bg-brand hover:text-on-brand">
              Choose image
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelectFile(f) }} />
            </label>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-surface/80 text-[12px] font-semibold text-muted">
            <span className="flex items-center gap-2"><ChevronDown size={14} className="animate-bounce" /> Preparing preview…</span>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-[12.5px] font-medium text-danger" role="alert">{error}</p>
      )}
    </div>
  )
}
