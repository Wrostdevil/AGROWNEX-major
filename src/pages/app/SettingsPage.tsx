import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Database,
  Download,
  Globe,
  Info,
  Monitor,
  RotateCcw,
  Ruler,
  Save,
  Sparkles,
  SunMoon,
  Volume2,
} from 'lucide-react'
import { usePageTitle } from '../../hooks'
import { PageHeader, NoteBlock, SectionHeading } from '../../components/ui/shared'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Switch } from '../../components/ui/inputs'
import { useToast } from '../../components/ui/toast'
import {
  LANGUAGE_OPTIONS,
  updatePreferences,
  usePreferences,
} from '../../services/preferences'
import { exportWorkspaceData, resetWorkspaceData } from '../../services/dataManagement'
import { REGIONS } from '../../data/catalog'
import { formatDate } from '../../utils'
import { cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

type PrefRow = { title: string; body: string; control: React.ReactNode }

export function SettingsPage() {
  usePageTitle('Settings')
  const { toast } = useToast()
  const prefs = usePreferences()
  const [resetOpen, setResetOpen] = useState(false)

  function patch(p: Parameters<typeof updatePreferences>[0], message: string) {
    updatePreferences(p)
    toast({ kind: 'success', title: message, body: 'Preference saved on this device.' })
  }

  const appearanceRows: PrefRow[] = [
    {
      title: 'Dark mode',
      body: 'Applies immediately across the marketing site and the workspace.',
      control: (
        <Switch
          checked={prefs.theme === 'dark'}
          onChange={(v) => patch({ theme: v ? 'dark' : 'light' }, v ? 'Dark mode on' : 'Light mode on')}
          label="Toggle dark mode"
        />
      ),
    },
    {
      title: 'Reduce motion',
      body: 'Calms transitions and animations app-wide (also honours your OS-level setting).',
      control: (
        <Switch
          checked={prefs.reducedMotion}
          onChange={(v) => patch({ reducedMotion: v }, v ? 'Reduced motion on' : 'Full motion on')}
          label="Toggle reduced motion"
        />
      ),
    },
  ]

  const notifyRows: PrefRow[] = [
    {
      title: 'Community watches',
      body: 'Elevated-count notices from the regions you follow.',
      control: (
        <Switch
          checked={prefs.notifyCommunity}
          onChange={(v) => patch({ notifyCommunity: v }, v ? 'Community notices on' : 'Community notices off')}
          label="Toggle community watch notifications"
        />
      ),
    },
    {
      title: 'Assessment completion notes',
      body: 'Entries after each diagnosis run on this device.',
      control: (
        <Switch
          checked={prefs.notifyAnalysis}
          onChange={(v) => patch({ notifyAnalysis: v }, v ? 'Assessment notes on' : 'Assessment notes off')}
          label="Toggle assessment notifications"
        />
      ),
    },
    {
      title: 'Scouting reminders',
      body: 'Gentle follow-up prompts based on your field observations.',
      control: (
        <Switch
          checked={prefs.notifyReminders}
          onChange={(v) => patch({ notifyReminders: v }, v ? 'Reminders on' : 'Reminders off')}
          label="Toggle reminder notifications"
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Settings"
        description="Preferences are stored on this device. Data export and reset live in the Data section below."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appearance & motion */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}>
          <Card>
            <CardHeader icon={<SunMoon size={17} />} title="Appearance & motion" subtitle="Instant, local, reversible." />
            <CardBody className="space-y-1">
              {appearanceRows.map((row) => (
                <SettingRow key={row.title} row={row} />
              ))}
              <div className="mt-3 rounded-xl bg-surface-2/70 px-3.5 py-3 ring-1 ring-inset ring-line">
                <p className="flex items-center gap-2 text-[12px] font-bold text-ink">
                  <Volume2 size={13} className="text-brand" aria-hidden />
                  Motion level now: {prefs.reducedMotion ? 'calm' : 'standard'}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  Reduced motion keeps charts, dialogs and page transitions but shortens or removes
                  decorative movement. Users with a system "reduced motion" preference get the calm
                  experience automatically.
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Language, units, region */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05, ease }}>
          <Card>
            <CardHeader icon={<Globe size={17} />} title="Language, units & region" subtitle="Localisation preferences." />
            <CardBody className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-ink">Interface language</span>
                <select
                  aria-label="Interface language"
                  value={prefs.language}
                  onChange={(e) => patch({ language: e.target.value as typeof prefs.language }, 'Language preference saved')}
                  className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-[13px] font-semibold text-ink ring-1 ring-inset ring-line"
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l.id} value={l.id}>{l.label}{l.status === 'planned' ? ' — planned' : ''}</option>
                  ))}
                </select>
                {prefs.language !== 'en' && (
                  <p className="mt-1.5 text-[11.5px] text-muted">
                    Marked "planned" — additional languages are in development; the interface stays English meanwhile.
                  </p>
                )}
              </label>

              <div>
                <p className="mb-2 text-[13px] font-semibold text-ink">Measurement units</p>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Measurement units">
                  {(['metric', 'imperial'] as const).map((u) => (
                    <UnitOption
                      key={u}
                      active={prefs.units === u}
                      label={u === 'metric' ? 'Metric' : 'Imperial'}
                      hint={u === 'metric' ? '°C · kg · litre' : '°F · lb · gallon'}
                      onClick={() => patch({ units: u }, u === 'metric' ? 'Metric units' : 'Imperial units')}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[13px] font-semibold text-ink">Preferred area unit</p>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Area unit">
                  {(['acre', 'hectare'] as const).map((u) => (
                    <UnitOption
                      key={u}
                      active={prefs.areaUnit === u}
                      label={u === 'acre' ? 'Acre' : 'Hectare'}
                      hint={u === 'acre' ? '₹/acre cost bands' : '₹/ha cost bands'}
                      onClick={() => patch({ areaUnit: u }, u === 'acre' ? 'Area in acres' : 'Area in hectares')}
                    />
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-ink">Default community region</span>
                <select
                  aria-label="Default community region"
                  value={prefs.defaultRegionId}
                  onChange={(e) => patch({ defaultRegionId: e.target.value }, 'Default region saved')}
                  className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-[13px] font-semibold text-ink ring-1 ring-inset ring-line"
                >
                  {REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} — {r.hint}</option>
                  ))}
                </select>
              </label>
            </CardBody>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1, ease }}>
          <Card>
            <CardHeader
              icon={<Bell size={17} />}
              title="In-app notifications"
              subtitle="Controls which kinds this feed accepts. Delivery stays local."
            />
            <CardBody className="space-y-1">
              {notifyRows.map((row) => (
                <SettingRow key={row.title} row={row} />
              ))}
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-brand-soft px-3.5 py-3 ring-1 ring-inset ring-brand/15">
                <Monitor size={14} className="shrink-0 text-brand" aria-hidden />
                <p className="text-[12px] leading-relaxed text-ink">
                  Notifications never leave this device — these toggles shape the local feed only.
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Data management */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15, ease }}>
          <Card>
            <CardHeader
              icon={<Database size={17} />}
              title="Data on this device"
              subtitle={
                prefs.onboardedAt
                  ? `Workspace first opened ${formatDate(prefs.onboardedAt)} (this browser).`
                  : 'Workspace not yet formally opened — onboarding badge still pending.'
              }
            />
            <CardBody className="space-y-3">
              <p className="text-[13px] leading-relaxed text-muted">
                History records, field books, community reports, saved comparisons and this feed are
                kept in <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[12px] ring-1 ring-inset ring-line">localStorage</code>.
                Nothing leaves the device.
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    exportWorkspaceData()
                    toast({ kind: 'success', title: 'Snapshot exported', body: 'agrownex-workspace-data.json downloaded to your device.' })
                  }}
                  leadingIcon={<Download size={15} />}
                >
                  Export data snapshot (JSON)
                </Button>
                <Button variant="danger" onClick={() => setResetOpen(true)} leadingIcon={<RotateCcw size={15} />}>
                  Reset workspace data
                </Button>
              </div>
              <NoteBlock tone="caution" title="What reset means">
                The starter dataset returns and your locally created records disappear, including the
                tour badge. This cannot be undone — export first if you want a copy.
              </NoteBlock>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* About AgrowNex */}
      <div className="mt-8">
        <SectionHeading
          kicker="About"
          title="What AgrowNex is — exactly"
          description="A short panel on how the system works and what to expect."
        />
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <AboutCard
            icon={<Sparkles size={16} />}
            title="Real working UI"
            body="Routing, forms, validation, charts, dialogs, keyboard access and dark mode are genuinely implemented end to end."
          />
          <AboutCard
            icon={<Info size={16} />}
            title="Local intelligence"
            body="Diagnosis, XAI attributions and ranking run on typed local services until the ML backend is connected — every screen shows which engine produced a result."
          />
          <AboutCard
            icon={<Save size={16} />}
            title="Backend-ready contracts"
            body="Each service stores a typed result that a FastAPI/ML deployment can produce directly, so screens won't change when real data arrives."
          />
        </div>
      </div>

      {/* Reset dialog */}
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset workspace data?"
        description="Single command — history, fields, reports, saved comparisons, notifications, tour badge."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              leadingIcon={<RotateCcw size={14} />}
              onClick={() => {
                resetWorkspaceData()
                setResetOpen(false)
                toast({ kind: 'info', title: 'Workspace data reset', body: 'Starter dataset restored; your local records were cleared.' })
              }}
            >
              Reset now
            </Button>
          </>
        }
      >
        <div className="space-y-2.5 text-[13.5px] leading-relaxed text-muted">
          <p>
            This clears all local stores and restores the starter dataset: seeded assessments, fields,
            community reports, watch artefacts and the notification feed.
          </p>
          <p className="rounded-xl bg-caution-soft/70 px-3.5 py-2.5 text-caution ring-1 ring-inset ring-caution/20 dark:text-dawn-deep">
            Not reversible on this device. If you want to keep a copy, use "Export data snapshot" first.
          </p>
        </div>
      </Dialog>
    </>
  )
}

function SettingRow({ row }: { row: PrefRow }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-bold text-ink">{row.title}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{row.body}</p>
      </div>
      <div className="shrink-0">{row.control}</div>
    </div>
  )
}

function UnitOption({ active, label, hint, onClick }: { active: boolean; label: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'rounded-xl px-3.5 py-2.5 text-left ring-1 ring-inset transition',
        active ? 'bg-brand text-on-brand ring-brand' : 'bg-surface-2 text-ink ring-line hover:ring-line-strong',
      )}
    >
      <span className="flex items-center gap-1.5 text-[13px] font-bold">
        <Ruler size={13} aria-hidden />
        {label}
      </span>
      <span className={cn('mt-0.5 block text-[11px]', active ? 'text-on-brand/80' : 'text-muted')}>{hint}</span>
    </button>
  )
}

function AboutCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card interactive className="px-5 py-5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand ring-1 ring-inset ring-brand/20" aria-hidden>
        {icon}
      </span>
      <p className="mt-3 text-[14px] font-bold text-ink">{title}</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{body}</p>
    </Card>
  )
}
