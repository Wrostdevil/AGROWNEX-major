import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Info, Stethoscope } from 'lucide-react'
import { usePageTitle } from '../../hooks'
import { NoteBlock, PageHeader } from '../../components/ui/shared'
import { Stepper, Skeleton } from '../../components/ui/extra'
import { Field, Input, Select, Textarea } from '../../components/ui/inputs'
import { Button, LinkButton } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toast'
import { ENVIRONMENT_OPTIONS, CROPS } from '../../data/catalog'
import { analyzeCrop, validateImageFile } from '../../services/cropAnalysisService'
import { SymptomPicker, DropzoneImage } from '../../features/diagnosis/SymptomPicker'
import { AnalysisStages } from '../../features/diagnosis/AnalysisStages'
import { ResultPanel } from '../../features/diagnosis/ResultPanel'
import type { CropAnalysisInput, CropAnalysisResult, EnvironmentFactors } from '../../types'
import { fileToDownscaledDataURL } from '../../utils/image'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const schema = z.object({
  cropId: z.string().min(1, 'Choose the crop'),
  variety: z.string().optional(),
  humidity: z.string().optional(),
  recentRainfall: z.string().optional(),
  temperatureBand: z.string().optional(),
  soilMoisture: z.string().optional(),
  drainage: z.string().optional(),
  growthStage: z.string().optional(),
  notes: z.string().max(400, 'Keep notes under 400 characters').optional(),
})

type FormValues = z.infer<typeof schema>

const STEPS: string[] = ['Crop information', 'Analysis', 'Results']

export function DiagnosisPage() {
  usePageTitle('Crop diagnosis')
  const { toast } = useToast()
  const [stage, setStage] = useState(0)
  const [result, setResult] = useState<CropAnalysisResult | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageStored, setImageStored] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [symptomIds, setSymptomIds] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileRef = useRef<File | null>(null)

  const {
    register,
    watch,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onSubmit' })

  const cropId = watch('cropId')
  const selectedCrop = CROPS.find((c) => c.id === cropId) ?? CROPS[0]

  const toggleSymptom = (id: string) => {
    setSubmitError(null)
    setSymptomIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  async function handleImage(file: File) {
    const err = validateImageFile(file)
    if (err) {
      setImageError(err)
      return
    }
    setImageError(null)
    setImageBusy(true)
    fileRef.current = file
    try {
      const previewURL = URL.createObjectURL(file)
      setImagePreview(previewURL)
      const downscaled = await fileToDownscaledDataURL(file)
      setImageStored(downscaled)
      toast({ kind: 'success', title: 'Image ready', body: 'Preview stored locally and downscaled for context.' })
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'Could not process that image.')
      setImagePreview(null)
      setImageStored(null)
    } finally {
      setImageBusy(false)
    }
  }

  function removeImage() {
    fileRef.current = null
    setImagePreview(null)
    setImageStored(null)
    setImageError(null)
  }

  function resetAll(message?: string) {
    setStage(0)
    setResult(null)
    setSymptomIds([])
    resetForm()
    removeImage()
    setSubmitError(null)
    if (message) toast({ kind: 'info', title: message })
  }

  const onSubmit = (values: FormValues) => {
    if (symptomIds.length === 0) {
      setSubmitError('Select at least one observed symptom — the analysis needs an observation to explain.')
      return
    }
    setSubmitError(null)
    setStage(1)
    const environment: Partial<EnvironmentFactors> = {}
    if (values.humidity) environment.humidity = values.humidity as EnvironmentFactors['humidity']
    if (values.recentRainfall) environment.recentRainfall = values.recentRainfall as EnvironmentFactors['recentRainfall']
    if (values.temperatureBand) environment.temperatureBand = values.temperatureBand as EnvironmentFactors['temperatureBand']
    if (values.soilMoisture) environment.soilMoisture = values.soilMoisture as EnvironmentFactors['soilMoisture']
    if (values.drainage) environment.drainage = values.drainage as EnvironmentFactors['drainage']
    if (values.growthStage) environment.growthStage = values.growthStage as EnvironmentFactors['growthStage']

    const input: CropAnalysisInput = {
      cropId: values.cropId,
      cropName: CROPS.find((c) => c.id === values.cropId)?.name ?? 'Crop',
      variety: values.variety?.trim() || undefined,
      symptomIds,
      environment,
      imageId: imageStored ?? undefined,
      notes: values.notes?.trim() || undefined,
    }
    void analyzeCrop(input)
      .then((out) => {
        setResult(out.result)
        setStage(2)
        if (out.pipeline === 'ml-service') {
          toast({
            kind: 'success',
            title: 'Model assessment ready',
            body: 'Produced by the backend ML service — probability is the model posterior, not a certified diagnosis.',
          })
        } else {
          toast({
            kind: 'info',
            title: 'Local assessment ready',
            body: 'The backend model was unreachable, so the local analysis engine produced this result.',
          })
        }
      })
      .catch(() => {
        setStage(0)
        toast({ kind: 'warning', title: 'Analysis failed', body: 'Please try again.' })
      })
  }

  return (
    <>
      <PageHeader
        title="Crop diagnosis"
        description="Describe what you observe on the plant. The analysis then walks your submission through each stage and returns an assessment with its drivers and uncertainty."
        actions={
          stage === 0 ? (
            <span className="hidden rounded-xl bg-surface-2 px-3.5 py-2 text-[12px] font-semibold text-muted ring-1 ring-inset ring-line sm:block">
              Step 1 of 3 · crop information
            </span>
          ) : stage === 1 ? (
            <span className="hidden rounded-xl bg-surface-2 px-3.5 py-2 text-[12px] font-semibold text-muted ring-1 ring-inset ring-line sm:block">
              Step 2 of 3 · analysis
            </span>
          ) : (
            <span className="hidden rounded-xl bg-surface-2 px-3.5 py-2 text-[12px] font-semibold text-muted ring-1 ring-inset ring-line sm:block">
              Step 3 of 3 · results
            </span>
          )
        }
      />

      {stage !== 1 && !result && (
        <div className="mb-6 max-w-xl">
          <Stepper className="sm:mx-auto w-full sm:w-[520px]" steps={STEPS} current={stage} />
        </div>
      )}
      {stage === 1 && (
        <div className="mb-6 max-w-xl">
          <Stepper className="sm:mx-auto w-full sm:w-[520px]" steps={STEPS} current={1} />
        </div>
      )}

      {stage === 0 && (
        <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            {/* Crop info */}
            <section aria-label="Crop information" className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line sm:p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
                <Stethoscope size={16} className="text-brand" aria-hidden /> 1 · What are you growing?
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Crop type" htmlFor="cropId" required error={errors.cropId?.message}>
                  <Select id="cropId" defaultValue="tomato" {...register('cropId')} aria-invalid={Boolean(errors.cropId)}>
                    {CROPS.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={`Variety (optional)`} htmlFor="variety" hint={`e.g. ${selectedCrop.varieties[0]} — free text is fine`}>
                  <Input id="variety" placeholder="Local line / hybrid name" {...register('variety')} />
                </Field>
              </div>
            </section>

            {/* Symptoms */}
            <section aria-label="Observed symptoms" className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line sm:p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
                <Stethoscope size={16} className="text-brand" aria-hidden /> 2 · What do you observe? <span className="text-danger">*</span>
              </h2>
              <p className="mt-1 text-[12.5px] text-muted">Pick everything that is clearly present — more signals make these explanations sharper.</p>
              <div className="mt-4">
                <SymptomPicker selected={symptomIds} onToggle={toggleSymptom} />
              </div>
              {submitError && (
                <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] font-semibold text-danger" role="alert">{submitError}</p>
              )}
            </section>
          </div>

          <div className="space-y-6">
            {/* Environment */}
            <section aria-label="Environment context" className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line sm:p-6">
              <h2 className="text-[15px] font-bold text-ink">3 · Conditions <span className="text-[11px] font-semibold normal-case text-faint">(all optional)</span></h2>
              <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <Field label="Humidity" htmlFor="humidity">
                  <Select id="humidity" defaultValue="" {...register('humidity')}>
                    <option value="">Not sure / skip</option>
                    {ENVIRONMENT_OPTIONS.humidity.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Recent rain" htmlFor="rain">
                  <Select id="rain" defaultValue="" {...register('recentRainfall')}>
                    <option value="">Not sure / skip</option>
                    {ENVIRONMENT_OPTIONS.recentRainfall.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Temperature" htmlFor="temp">
                  <Select id="temp" defaultValue="" {...register('temperatureBand')}>
                    <option value="">Not sure / skip</option>
                    {ENVIRONMENT_OPTIONS.temperatureBand.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Soil moisture" htmlFor="soil">
                  <Select id="soil" defaultValue="" {...register('soilMoisture')}>
                    <option value="">Not sure / skip</option>
                    {ENVIRONMENT_OPTIONS.soilMoisture.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Drainage" htmlFor="drain">
                  <Select id="drain" defaultValue="" {...register('drainage')}>
                    <option value="">Not sure / skip</option>
                    {ENVIRONMENT_OPTIONS.drainage.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Growth stage" htmlFor="stage">
                  <Select id="stage" defaultValue="" {...register('growthStage')}>
                    <option value="">Not sure / skip</option>
                    {ENVIRONMENT_OPTIONS.growthStage.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </section>

            {/* Image */}
            <section aria-label="Optional image" className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line sm:p-6">
              <h2 className="text-[15px] font-bold text-ink">4 · A close-up helps (optional)</h2>
              <p className="mt-1 text-[12.5px] text-muted">Stored locally, downscaled — image recognition isn't part of this analysis.</p>
              <div className="mt-4">
                <DropzoneImage preview={imagePreview} fileName={fileRef.current?.name ?? null} busy={imageBusy} error={imageError} onSelectFile={handleImage} onRemove={removeImage} />
              </div>
            </section>

            {/* Notes */}
            <section aria-label="Additional notes" className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line sm:p-6">
              <Field label="Additional notes" htmlFor="notes" hint="Where did it start? How fast did it spread? Anything you already tried." error={errors.notes?.message}>
                <Textarea id="notes" placeholder="e.g. Started on lower leaves 10 days ago, spread after the rains…" {...register('notes')} />
              </Field>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-start gap-2 max-w-xs text-[11.5px] leading-relaxed text-faint">
                <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
                Submitting runs the analysis. Results are stored in your history.
              </p>
              <Button type="submit" size="lg" trailingIcon={<ArrowRight size={16} />}>
                Run assessment
              </Button>
            </div>
            <LinkButton to="/app" variant="ghost" size="sm" leadingIcon={<ArrowLeft size={14} />}>
              Back to overview
            </LinkButton>
          </div>
        </motion.form>
      )}

      {stage === 1 && (
        <div className="rounded-3xl bg-surface p-6 shadow-card ring-1 ring-inset ring-line">
          <AnalysisStages onDone={() => { /* result arrives via promise; stages pace the reveal */ }} />
          <div className="mx-auto max-w-md">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
        </div>
      )}

      {stage === 2 && result && <ResultPanel result={result} onReset={() => resetAll('Form cleared — ready for another assessment.')} />}

      {stage === 0 && (
        <NoteBlock className="mt-6" tone="info" title="What this analysis does not do">
          Assessments are decision support, not a diagnosis. Image recognition isn't part of the
          pipeline, and nothing is collected beyond this device. Every result carries an uncertainty
          note, so weigh it against what you actually see in the field.
        </NoteBlock>
      )}
    </>
  )
}
