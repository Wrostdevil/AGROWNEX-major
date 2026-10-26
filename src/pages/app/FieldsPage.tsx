import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  ClipboardEdit,
  Droplets,
  Leaf,
  MapPin,
  NotebookPen,
  Pencil,
  Plus,
  Ruler,
  Sprout,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { usePageTitle } from '../../hooks'
import { PageHeader, NoteBlock, EmptyState } from '../../components/ui/shared'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button, LinkButton } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/inputs'
import { useToast } from '../../components/ui/toast'
import {
  addField,
  addObservation,
  removeField,
  updateField,
  useFields,
} from '../../services/fieldService'
import { pushNotification } from '../../services/notificationService'
import { CROPS, cropName } from '../../data/catalog'
import type { CropObservation, FieldProfile } from '../../types'
import {
  formatDate,
  formatShortDate,
  relativeTime,
  todayISO,
} from '../../utils'
import { cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface FieldFormState {
  name: string
  cropId: string
  variety: string
  areaValue: string
  areaUnit: 'acre' | 'hectare'
  plantedOn: string
  soil: string
  irrigation: string
  notes: string
}

const emptyFieldForm: FieldFormState = {
  name: '',
  cropId: 'tomato',
  variety: '',
  areaValue: '',
  areaUnit: 'acre',
  plantedOn: todayISO(),
  soil: '',
  irrigation: '',
  notes: '',
}

interface ObservationFormState {
  observedOn: string
  mood: CropObservation['mood']
  note: string
}

const emptyObservationForm: ObservationFormState = {
  observedOn: todayISO(),
  mood: 'healthy',
  note: '',
}

export function FieldsPage() {
  usePageTitle('Fields & crops')
  const { toast } = useToast()
  const fields = useFields()

  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FieldFormState>(emptyFieldForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [obsFor, setObsFor] = useState<FieldProfile | null>(null)
  const [obsForm, setObsForm] = useState<ObservationFormState>(emptyObservationForm)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // Brief loading state (same pattern as the overview page).
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 450)
    return () => window.clearTimeout(t)
  }, [])

  const totals = useMemo(
    () => ({
      fields: fields.length,
      observations: fields.reduce((s, f) => s + f.observations.length, 0),
    }),
    [fields],
  )

  function openAdd() {
    setEditForm(emptyFieldForm)
    setNameError(null)
    setAddOpen(true)
  }

  function openEdit(f: FieldProfile) {
    setEditForm({
      name: f.name,
      cropId: f.cropId,
      variety: f.variety ?? '',
      areaValue: String(f.areaValue),
      areaUnit: f.areaUnit,
      plantedOn: f.plantedOn,
      soil: f.soil ?? '',
      irrigation: f.irrigation ?? '',
      notes: f.notes ?? '',
    })
    setNameError(null)
    setEditId(f.id)
  }

  function saveField(creating: boolean) {
    if (!editForm.name.trim()) {
      setNameError('Give the field a short name so you can recognise it.')
      return
    }
    const payload = {
      name: editForm.name.trim(),
      cropId: editForm.cropId,
      variety: editForm.variety.trim() || undefined,
      areaValue: Math.max(0, Number(editForm.areaValue) || 0),
      areaUnit: editForm.areaUnit,
      plantedOn: editForm.plantedOn || todayISO(),
      soil: editForm.soil.trim() || undefined,
      irrigation: editForm.irrigation.trim() || undefined,
      notes: editForm.notes.trim() || undefined,
    }
    if (creating) {
      addField(payload)
      pushNotification({
        kind: 'reminder',
        title: 'Field profile saved',
        body: `${payload.name} was added to the field book. No location data was used.`,
        link: { label: 'Open fields', to: '/app/fields' },
      })
      toast({ kind: 'success', title: 'Field saved', body: `${payload.name} is stored on this device.` })
      setAddOpen(false)
    } else if (editId) {
      updateField(editId, payload)
      toast({ kind: 'success', title: 'Field updated', body: 'Record refreshed — changes stay on this device.' })
      setEditId(null)
    }
  }

  function saveObservation() {
    if (!obsFor) return
    if (!obsForm.note.trim()) {
      toast({ kind: 'warning', title: 'Add a short note', body: 'Describe what you saw in one or two lines.' })
      return
    }
    addObservation(obsFor.id, {
      observedOn: obsForm.observedOn || todayISO(),
      note: obsForm.note.trim(),
      mood: obsForm.mood,
    })
    toast({ kind: 'success', title: 'Observation logged', body: 'Added to the field book.' })
    setObsFor(null)
    setObsForm(emptyObservationForm)
  }

  function confirmDelete() {
    if (!deleteId) return
    removeField(deleteId)
    setDeleteId(null)
    setDeleteConfirm(false)
    toast({ kind: 'info', title: 'Field removed', body: 'Recover the starter rows via Settings → Reset workspace data.' })
  }

  return (
    <>
      <PageHeader
        title="Your fields & crops — a private field book"
        description="Record each plot, the crop on it, and dated observations you make while walking the rows. Everything stays in this browser; no GPS or precise location is collected."
        actions={
          <Button onClick={openAdd} leadingIcon={<Plus size={16} />}>
            Add a field
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Fields in this book', value: String(totals.fields), icon: MapPin, sub: 'incl. seeded starter rows' },
          { label: 'Observations logged', value: String(totals.observations), icon: NotebookPen, sub: 'dated field entries' },
          {
            label: 'Crops covered',
            value: String(new Set(fields.map((f) => f.cropId)).size),
            icon: Sprout,
            sub: 'from the crop catalogue',
          },
        ].map((s) => (
          <Card key={s.label} className="px-4.5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand ring-1 ring-inset ring-line" aria-hidden>
                <s.icon size={16} />
              </span>
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-faint">{s.label}</p>
            </div>
            {loading ? (
              <div className="mt-2 h-7 w-14 animate-shimmer rounded bg-surface-3" />
            ) : (
              <p className="tabular mt-2 text-[24px] font-extrabold leading-none text-ink">{s.value}</p>
            )}
            <p className="mt-1.5 text-[11.5px] text-muted">{s.sub}</p>
          </Card>
        ))}
      </div>

      <NoteBlock className="mb-6" tone="info">
        Starter plots are seeded so lists and links across the app stay populated. You can edit or
        remove them freely — Settings → Reset workspace data brings the originals back.
      </NoteBlock>

      {/* Fields grid */}
      {fields.length === 0 ? (
        <EmptyState
          icon={<MapPin size={18} />}
          title="No fields in the book yet"
          description="Add your first plot to start keeping dated crop observations in one place."
          action={<Button onClick={openAdd} leadingIcon={<Plus size={15} />}>Add a field</Button>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {fields.map((f) => (
            <FieldCard
              key={f.id}
              field={f}
              onEdit={() => openEdit(f)}
              onDelete={() => {
                setDeleteId(f.id)
                setDeleteConfirm(true)
              }}
              onObserve={() => {
                setObsFor(f)
                setObsForm(emptyObservationForm)
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <LinkButton to="/app/diagnosis" variant="outline" leadingIcon={<Leaf size={15} />}>
          Assess symptoms from the field
        </LinkButton>
        <LinkButton to="/app/history" variant="ghost">
          Review past assessments
        </LinkButton>
      </div>

      {/* Add dialog */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a field"
        description="Stored in this browser only. Leave anything you'd rather not note blank."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => saveField(true)} leadingIcon={<Plus size={15} />}>Save field</Button>
          </>
        }
      >
        <FieldForm form={editForm} onChange={setEditForm} nameError={nameError} submitOnEnter={() => saveField(true)} />
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={editId !== null}
        onClose={() => setEditId(null)}
        title={`Edit ${editForm.name || 'field'}`}
        description="Adjust the record — the observation history is kept."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
            <Button onClick={() => saveField(false)}>Save changes</Button>
          </>
        }
      >
        <FieldForm form={editForm} onChange={setEditForm} nameError={nameError} submitOnEnter={() => saveField(false)} />
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={deleteConfirm && deleteId !== null}
        onClose={() => {
          setDeleteConfirm(false)
          setDeleteId(null)
        }}
        title="Remove this field?"
        description="Its observations will be removed from the field book too."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirm(false)
                setDeleteId(null)
              }}
            >
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              leadingIcon={<Trash2 size={15} />}
            >
              Remove field
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-muted">
          Removing <strong className="text-ink">{fields.find((f) => f.id === deleteId)?.name ?? 'this field'}</strong> only
          clears local state. No external farm register is affected.
        </p>
      </Dialog>

      {/* Observation dialog */}
      <Dialog
        open={obsFor !== null}
        onClose={() => setObsFor(null)}
        title={`Log an observation — ${obsFor?.name ?? ''}`}
        description="Walk-in note with a date and a general impression."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setObsFor(null)}>Cancel</Button>
            <Button onClick={saveObservation} leadingIcon={<NotebookPen size={15} />}>Log observation</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Observed on" htmlFor="obs-date" required>
            <Input
              id="obs-date"
              type="date"
              value={obsForm.observedOn}
              max={todayISO()}
              onChange={(e) => setObsForm((s) => ({ ...s, observedOn: e.target.value }))}
            />
          </Field>
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-ink">General impression</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'healthy', label: 'Looks healthy' },
                  { id: 'mixed', label: 'Mixed picture' },
                  { id: 'concern', label: 'Concerning patch' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={obsForm.mood === m.id}
                  onClick={() => setObsForm((s) => ({ ...s, mood: m.id }))}
                  className={cn(
                    'rounded-xl px-3.5 py-2 text-[12.5px] font-bold ring-1 ring-inset transition',
                    obsForm.mood === m.id
                      ? m.id === 'healthy'
                        ? 'bg-brand text-on-brand ring-brand'
                        : m.id === 'mixed'
                          ? 'bg-caution text-white ring-caution'
                          : 'bg-danger text-white ring-danger'
                      : 'bg-surface text-muted ring-line hover:text-ink',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="What did you see?" htmlFor="obs-note" hint="Two lines is plenty — e.g. which rows, how spread, wet or dry." required>
            <Textarea
              id="obs-note"
              value={obsForm.note}
              maxLength={400}
              placeholder="Lower leaves on the two west rows show scattered brown spots."
              onChange={(e) => setObsForm((s) => ({ ...s, note: e.target.value }))}
            />
          </Field>
        </div>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Field card with growth meta + observation timeline
// ---------------------------------------------------------------------------

function FieldCard({
  field,
  onEdit,
  onDelete,
  onObserve,
}: {
  field: FieldProfile
  onEdit: () => void
  onDelete: () => void
  onObserve: () => void
}) {
  const [showAllObs, setShowAllObs] = useState(false)
  const plantedTs = new Date(field.plantedOn + 'T00:00:00').getTime()
  const daysPlanted = Math.max(0, Math.round((Date.now() - plantedTs) / 86_400_000))
  const visibleObs = showAllObs ? field.observations : field.observations.slice(0, 3)
  const latestMood = field.observations[0]?.mood

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
      <Card interactive className="flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[16px] font-extrabold text-ink">{field.name}</h3>
              <Badge tone="neutral">
                {cropName(field.cropId)}
              </Badge>
              {latestMood && (
                <Badge tone={latestMood === 'healthy' ? 'brand' : latestMood === 'mixed' ? 'caution' : 'danger'} dot>
                  latest: {latestMood === 'healthy' ? 'healthy' : latestMood === 'mixed' ? 'mixed' : 'concern'}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-[12.5px] text-muted">
              {field.variety ? field.variety + ' · ' : ''}day {daysPlanted} since planting
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <IconBtn label={`Edit ${field.name}`} onClick={onEdit}><Pencil size={14} /></IconBtn>
            <IconBtn label={`Remove ${field.name}`} onClick={onDelete}><Trash2 size={14} /></IconBtn>
          </div>
        </div>

        <div className="mx-5 mt-3.5 grid grid-cols-2 gap-2 rounded-xl bg-surface-2/70 px-3.5 py-3 text-[12px] ring-1 ring-inset ring-line sm:grid-cols-4">
          <MetaCell icon={<Ruler size={13} aria-hidden />} label="Area" value={`${field.areaValue} ${field.areaUnit}`} />
          <MetaCell icon={<CalendarDays size={13} aria-hidden />} label="Planted" value={formatShortDate(field.plantedOn)} />
          <MetaCell icon={<Droplets size={13} aria-hidden />} label="Irrigation" value={field.irrigation ?? '—'} />
          <MetaCell icon={<MapPin size={13} aria-hidden />} label="Soil" value={field.soil ?? '—'} />
        </div>

        {field.notes && (
          <p className="mt-3 px-5 text-[12.5px] leading-relaxed text-muted">
            <span className="font-bold text-ink">Notes: </span>
            {field.notes}
          </p>
        )}

        {/* Observations */}
        <div className="mt-3.5 px-5">
          <div className="flex items-center justify-between">
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-faint">
              Observations ({field.observations.length})
            </p>
            {field.observations.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllObs((v) => !v)}
                className="text-[12px] font-bold text-brand hover:underline"
              >
                {showAllObs ? 'Show less' : `Show all ${field.observations.length}`}
              </button>
            )}
          </div>
          {field.observations.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-line px-3.5 py-4 text-center text-[12px] text-muted">
              No walk-in notes yet for this plot.
            </p>
          ) : (
            <ol className="relative mt-2 space-y-3 border-l border-line pl-4">
              {visibleObs.map((o) => (
                <li key={o.id} className="relative">
                  <span
                    aria-hidden
                    className={cn(
                      'absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface',
                      o.mood === 'healthy' ? 'bg-brand' : o.mood === 'mixed' ? 'bg-caution' : 'bg-danger',
                    )}
                  />
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[12px] font-bold text-ink">{formatDate(o.observedOn)}</p>
                    <p className="text-[10.5px] text-faint">{relativeTime(new Date(o.observedOn + 'T09:00:00').getTime())}</p>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-muted">{o.note}</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 max-lg:mt-3.5">
          <Button size="sm" variant="secondary" onClick={onObserve} leadingIcon={<ClipboardEdit size={14} />}>
            Log observation
          </Button>
          <LinkButton size="sm" variant="ghost" to="/app/diagnosis">
            Diagnose a symptom
          </LinkButton>
        </div>
      </Card>
    </motion.div>
  )
}

function MetaCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-faint">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 truncate text-[12.5px] font-semibold text-ink" title={value}>{value}</p>
    </div>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Add / edit form (shared between create and edit dialogs)
// ---------------------------------------------------------------------------

function FieldForm({
  form,
  onChange,
  nameError,
  submitOnEnter,
}: {
  form: FieldFormState
  onChange: (f: FieldFormState) => void
  nameError: string | null
  submitOnEnter: () => void
}) {
  const crop = CROPS.find((c) => c.id === form.cropId)
  const set = (patch: Partial<FieldFormState>) => onChange({ ...form, ...patch })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        submitOnEnter()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Field name" htmlFor="f-name" error={nameError ?? undefined} required>
          <Input
            id="f-name"
            value={form.name}
            maxLength={60}
            placeholder="North Block"
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field label="Crop" htmlFor="f-crop" required>
          <Select id="f-crop" value={form.cropId} onChange={(e) => set({ cropId: e.target.value, variety: '' })}>
            {CROPS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Area value" htmlFor="f-area" hint="Rough hand measure is fine." required>
          <Input
            id="f-area"
            type="number"
            min={0}
            step={0.1}
            value={form.areaValue}
            placeholder="1.2"
            onChange={(e) => set({ areaValue: e.target.value })}
          />
        </Field>
        <Field label="Unit" htmlFor="f-unit">
          <Select id="f-unit" value={form.areaUnit} onChange={(e) => set({ areaUnit: e.target.value as 'acre' | 'hectare' })}>
            <option value="acre">Acre</option>
            <option value="hectare">Hectare</option>
          </Select>
        </Field>
        <Field label="Planted on" htmlFor="f-planted">
          <Input
            id="f-planted"
            type="date"
            value={form.plantedOn}
            max={todayISO()}
            onChange={(e) => set({ plantedOn: e.target.value })}
          />
        </Field>
      </div>

      <Field
        label="Variety (optional)"
        htmlFor="f-variety"
        hint={crop ? `Varieties on record: ${crop.varieties.join(', ')}` : undefined}
      >
        <Input
          id="f-variety"
          value={form.variety}
          maxLength={60}
          placeholder={crop?.varieties[0] ?? 'Local line'}
          onChange={(e) => set({ variety: e.target.value })}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Soil (optional)" htmlFor="f-soil">
          <Input
            id="f-soil"
            value={form.soil}
            maxLength={80}
            placeholder="Sandy loam"
            onChange={(e) => set({ soil: e.target.value })}
          />
        </Field>
        <Field label="Irrigation (optional)" htmlFor="f-irrigation">
          <Input
            id="f-irrigation"
            value={form.irrigation}
            maxLength={80}
            placeholder="Drip, alternate days"
            onChange={(e) => set({ irrigation: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Notes (optional)" htmlFor="f-notes" hint="Anything you want to remember about this plot this season.">
        <Textarea
          id="f-notes"
          value={form.notes}
          maxLength={300}
          placeholder="Replanted the west support rows after weak germination."
          onChange={(e) => set({ notes: e.target.value })}
        />
      </Field>

      <div className="flex items-center gap-2.5 rounded-xl bg-caution-soft/70 px-4 py-3 ring-1 ring-inset ring-caution/20">
        <TriangleAlert size={15} className="mt-0.5 shrink-0 text-caution" aria-hidden />
        <p className="text-[12px] leading-relaxed text-caution dark:text-dawn-deep">
          AgrowNex never asks for GPS or survey numbers — keep it descriptive ("the plot by the river").
        </p>
      </div>
      {/* enabling submit-on-enter */}
      <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
    </form>
  )
}
