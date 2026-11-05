import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Loader2, RotateCcw, SwitchCamera, VideoOff } from 'lucide-react'
import { Dialog } from './Dialog'
import { Button } from './Button'
import { cn } from '../../utils'

interface CameraCaptureProps {
  open: boolean
  onClose: () => void
  /** Called with the captured photo as a JPEG File, ready for validation + downscale. */
  onCapture: (file: File) => void
}

type Facing = 'environment' | 'user'
type Phase = 'starting' | 'live' | 'frozen' | 'error'

/**
 * CameraCapture — live camera preview in a dialog; snap a photo and hand it
 * back as a File. Wraps the shared Dialog (portal + focus trap + Escape +
 * scroll lock). Gracefully degrades when permission is denied or no camera
 * exists, pointing at the drag & drop path instead.
 */
export function CameraCapture({ open, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const facingRef = useRef<Facing>('environment')
  const [facing, setFacing] = useState<Facing>('environment')
  const [phase, setPhase] = useState<Phase>('starting')
  const [error, setError] = useState<string | null>(null)
  const [shot, setShot] = useState<string | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startStream = useCallback(async () => {
    setPhase('starting')
    setError(null)
    stopStream()
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new DOMException('unsupported', 'NotSupportedError')
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingRef.current } },
          audio: false,
        })
      } catch {
        // Some desktop/USB setups reject facingMode constraints — retry with any camera.
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }
      streamRef.current = stream
      const v = videoRef.current
      if (v) {
        v.srcObject = stream
        try {
          await v.play()
        } catch {
          /* autoplay can hiccup before peer metadata — the next tick recovers */
        }
      }
      setPhase('live')
    } catch (e) {
      const name = e instanceof DOMException ? e.name : ''
      setError(
        name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in your browser settings, then try again — or use drag & drop instead.'
          : 'No usable camera was found on this device. Use the drag & drop or “Choose from device” options instead.',
      )
      setPhase('error')
    }
  }, [stopStream])

  useEffect(() => {
    if (open) {
      setError(null)
      setShot(null)
      facingRef.current = 'environment'
      setFacing('environment')
      void startStream()
    } else {
      stopStream()
    }
    return () => stopStream()
  }, [open, startStream, stopStream])

  function flipCamera() {
    facingRef.current = facingRef.current === 'environment' ? 'user' : 'environment'
    setFacing(facingRef.current)
    void startStream()
  }

  function capture() {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Mirror the frame for the front camera, matching what the user saw live.
    if (facingRef.current === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(v, 0, 0)
    setShot(canvas.toDataURL('image/jpeg', 0.92))
    setPhase('frozen')
    stopStream() // power down the sensor while the user reviews the frame
  }

  function retake() {
    setShot(null)
    void startStream()
  }

  function usePhoto() {
    if (!shot) return
    const [meta, b64] = shot.split(',')
    const mime = meta?.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    onCapture(new File([bytes], `crop-photo-${Date.now()}.jpg`, { type: mime }))
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Take a photo"
      description="Aim at the affected area — a close-up of a leaf in good light reads best."
      size="md"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          {phase === 'frozen' ? (
            <>
              <Button variant="outline" size="md" leadingIcon={<RotateCcw size={15} />} onClick={retake}>
                Retake
              </Button>
              <Button size="md" onClick={usePhoto}>
                Use this photo
              </Button>
            </>
          ) : phase === 'error' ? (
            <>
              <Button variant="ghost" size="md" onClick={onClose}>
                Close
              </Button>
              <Button variant="outline" size="md" onClick={() => void startStream()}>
                Try again
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="md"
                leadingIcon={<SwitchCamera size={15} />}
                onClick={flipCamera}
                disabled={phase !== 'live'}
              >
                Flip camera
              </Button>
              <Button size="md" leadingIcon={<Camera size={16} />} onClick={capture} disabled={phase !== 'live'}>
                Capture
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-forest-950 ring-1 ring-inset ring-line">
        {/* Live preview */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn('h-full w-full object-cover', phase !== 'live' && 'invisible')}
          style={phase === 'live' && facing === 'user' ? { transform: 'scaleX(-1)' } : undefined}
        />

        {/* Frozen review frame */}
        {phase === 'frozen' && shot && (
          <img src={shot} alt="Captured crop photo awaiting confirmation" className="absolute inset-0 h-full w-full object-cover" />
        )}

        {/* Starting spinner */}
        {phase === 'starting' && (
          <div className="absolute inset-0 grid place-items-center text-[12.5px] font-semibold text-sage-300">
            <span className="flex items-center gap-2">
              <Loader2 size={15} className="animate-spin" /> Starting camera…
            </span>
          </div>
        )}

        {/* Error state */}
        {phase === 'error' && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-sage-300" aria-hidden>
                <VideoOff size={20} />
              </span>
              <p className="text-[13px] leading-relaxed text-sage-300">{error}</p>
            </div>
          </div>
        )}

        {phase === 'live' && (
          <p className="absolute left-3 top-3 rounded-lg bg-forest-950/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-sage-300" aria-hidden>
            {facing === 'environment' ? 'Rear camera' : 'Front camera'}
          </p>
        )}
      </div>
    </Dialog>
  )
}
