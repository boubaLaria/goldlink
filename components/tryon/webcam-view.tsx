"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Camera, CameraOff, Hand, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TryOn3DRenderer } from "@/lib/utils/tryon-3d-renderer"

const WASM_CDN   = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

const CANVAS_W = 640
const CANVAS_H = 480

interface WebcamViewProps {
  glbUrl?: string
  onCapture: (dataUrl: string) => void
  disabled?: boolean
  facingMode?: "user" | "environment"
}

export function WebcamView({ glbUrl, onCapture, disabled, facingMode = "user" }: WebcamViewProps) {
  const videoRef          = useRef<HTMLVideoElement>(null)
  const canvasRef         = useRef<HTMLCanvasElement>(null)
  const rafRef            = useRef<number | null>(null)
  const renderer3dRef     = useRef<TryOn3DRenderer | null>(null)
  const handLandmarkerRef = useRef<any>(null)
  const lastHandResult    = useRef<any>(null)

  const [cameraState, setCameraState] = useState<"idle" | "loading" | "ready" | "denied">("idle")
  const [rendererReady, setRendererReady] = useState(false)
  const [mpReady, setMpReady] = useState(false)
  const [poseHint, setPoseHint] = useState<string | null>(null)

  // ── Init 3D renderer + MediaPipe Hand Landmarker ──────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // 1. Load 3D renderer
        const { TryOn3DRenderer } = await import("@/lib/utils/tryon-3d-renderer")
        if (cancelled) return
        const r = new TryOn3DRenderer(CANVAS_W, CANVAS_H)
        await r.init(glbUrl ?? null, 1)
        if (cancelled) { r.dispose(); return }
        renderer3dRef.current = r
        setRendererReady(true)

        // 2. Load MediaPipe Hand Landmarker
        const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision")
        if (cancelled) return
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
        if (cancelled) return
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL, delegate: "CPU" },
          runningMode: "VIDEO",
          numHands: 1,
        })
        if (!cancelled) setMpReady(true)
      } catch (err) {
        console.error("[WebcamView] init failed:", err)
      }
    }

    init()
    return () => {
      cancelled = true
      handLandmarkerRef.current?.close()
      renderer3dRef.current?.dispose()
    }
  }, [glbUrl])

  // ── Camera start / stop ───────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraState("loading")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: CANVAS_W, height: CANVAS_H, facingMode },
      })
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraState("ready")
    } catch {
      setCameraState("denied")
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    const video = videoRef.current
    if (video?.srcObject) {
      ;(video.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      video.srcObject = null
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setCameraState("idle")
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  // ── Render loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (cameraState !== "ready") return
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const mirror = facingMode !== "environment"
    let lastDetectTs = 0

    const tick = (now: number) => {
      if (video.readyState < 2) { rafRef.current = requestAnimationFrame(tick); return }

      canvas.width  = CANVAS_W
      canvas.height = CANVAS_H

      // 1. Draw webcam feed
      ctx.save()
      if (mirror) {
        ctx.translate(CANVAS_W, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H)
      ctx.restore()

      // 2. Detect hand landmarks at ~30 fps
      if (handLandmarkerRef.current && now - lastDetectTs > 33) {
        lastHandResult.current = handLandmarkerRef.current.detectForVideo(video, now)
        lastDetectTs = now
      }

      const handLandmarks      = lastHandResult.current?.landmarks      ?? []
      const worldHandLandmarks = lastHandResult.current?.worldLandmarks ?? []
      const hand      = handLandmarks[0]
      const worldHand = worldHandLandmarks[0]

      // 3. Place 3D model on the wrist landmark (landmark 0)
      const r = renderer3dRef.current
      let hint: string | null = null

      if (r?.ready && hand) {
        const wrist  = hand[0]
        const p5     = hand[5]   // index MCP (pixel)
        const p9     = hand[9]   // middle MCP (pixel) — hand axis reference
        const p12    = hand[12]  // middle finger tip — depth reference
        const p17    = hand[17]  // pinky MCP (pixel)

        // ── Pose validation ─────────────────────────────────────────────────
        // 1. Depth check: reject hand too tilted (not flat toward camera)
        const depthDiff = Math.abs(wrist.z - p12.z)
        if (depthDiff > 0.1) {
          hint = "Mettez la main à plat, paume vers la caméra"
          r.hideAll()
          r.render()
        } else {
          // 2. Aspect ratio: reject foreshortened hand (fist, profile view)
          const handHeight_px = Math.sqrt(
            ((wrist.x - p12.x) * CANVAS_W) ** 2 +
            ((wrist.y - p12.y) * CANVAS_H) ** 2,
          )
          const handWidth_px_check = Math.sqrt(
            ((p5.x - p17.x) * CANVAS_W) ** 2 +
            ((p5.y - p17.y) * CANVAS_H) ** 2,
          )
          const aspectRatio = handWidth_px_check > 0 ? handHeight_px / handWidth_px_check : 0

          if (aspectRatio < 1.4) {
            hint = "Ouvrez la main, doigts écartés, poignet visible"
            r.hideAll()
            r.render()
          } else {
            // ── Valid pose → place bracelet ──────────────────────────────────

            // Mirror x coordinate for selfie camera
            const cx = mirror ? (1 - wrist.x) * CANVAS_W : wrist.x * CANVAS_W
            const cy = wrist.y * CANVAS_H

            // Wrist-to-finger angle → rotate bracelet perpendicular to hand axis
            const dx = mirror ? -(p9.x - wrist.x) : (p9.x - wrist.x)
            const dy = p9.y - wrist.y
            const rotZ = Math.atan2(dy * CANVAS_H, dx * CANVAS_W) + Math.PI / 2

            // ── Compute metric scale via worldLandmarks ─────────────────────
            let size_px = Math.min(CANVAS_W, CANVAS_H) * 0.4
            let wristCircum_mm = 0

            if (worldHand) {
              const w5  = worldHand[5]
              const w17 = worldHand[17]
              const handWidth_m = Math.sqrt(
                (w5.x - w17.x) ** 2 +
                (w5.y - w17.y) ** 2 +
                (w5.z - w17.z) ** 2,
              )
              const handWidth_px = Math.sqrt(
                ((p5.x - p17.x) * CANVAS_W) ** 2 +
                ((p5.y - p17.y) * CANVAS_H) ** 2,
              )

              if (handWidth_m > 0.001) {
                const handWidth_mm = handWidth_m * 1000
                const pixelsPerMm  = handWidth_px / handWidth_mm
                wristCircum_mm     = Math.round(handWidth_mm * 2.2)

                // Wrist diameter = circumference / π, + 25mm visual clearance
                const wristDiameter_mm    = wristCircum_mm / Math.PI
                const innerDiameter_mm    = wristDiameter_mm + 25
                const innerDiameter_px    = innerDiameter_mm * pixelsPerMm
                size_px = innerDiameter_px * 1.5

                // DEBUG — log once per second
                if (Math.floor(now / 1000) !== Math.floor((now - 16) / 1000)) {
                  console.log("[tryon debug]", {
                    depthDiff:        depthDiff.toFixed(3),
                    aspectRatio:      aspectRatio.toFixed(2),
                    handWidth_m:      handWidth_m.toFixed(4),
                    handWidth_mm:     handWidth_mm.toFixed(1),
                    handWidth_px:     handWidth_px.toFixed(1),
                    pixelsPerMm:      pixelsPerMm.toFixed(3),
                    wristCircum_mm,
                    innerDiameter_mm: innerDiameter_mm.toFixed(1),
                    innerDiameter_px: innerDiameter_px.toFixed(1),
                    size_px:          size_px.toFixed(1),
                  })
                }
              }
            }

            r.pose(0, cx, cy, size_px, rotZ, 0, Math.PI / 4)
            r.render()
            ctx.drawImage(r.canvas, 0, 0, CANVAS_W, CANVAS_H)

            // 4. Draw wrist measurement badge
            if (wristCircum_mm > 0) {
              const label = `Poignet: ${wristCircum_mm} mm`
              ctx.font = "bold 16px system-ui, sans-serif"
              const textW = ctx.measureText(label).width
              const padX = 10
              const boxW = textW + padX * 2
              const boxH = 28
              const boxX = Math.max(8, Math.min(CANVAS_W - boxW - 8, cx - boxW / 2))
              const boxY = Math.max(8, cy + 30)

              ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
              ctx.beginPath()
              ctx.roundRect(boxX, boxY, boxW, boxH, 6)
              ctx.fill()

              ctx.fillStyle = "#ffd700"
              ctx.textBaseline = "middle"
              ctx.fillText(label, boxX + padX, boxY + boxH / 2)
            }
          }
        }
      } else if (r?.ready) {
        hint = "Montrez votre poignet face à la caméra"
        r.hideAll()
        r.render()
      }

      // 5. Draw pose guide overlay
      if (hint) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
        ctx.beginPath()
        ctx.roundRect(CANVAS_W / 2 - 180, CANVAS_H - 70, 360, 50, 12)
        ctx.fill()

        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 14px system-ui, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(hint, CANVAS_W / 2, CANVAS_H - 45)
        ctx.textAlign = "start"
      }

      // Update React state (throttled to avoid excessive re-renders)
      if (Math.floor(now / 500) !== Math.floor((now - 16) / 500)) {
        setPoseHint(hint)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [cameraState, rendererReady, mpReady, facingMode])

  // ── Capture ───────────────────────────────────────────────────────────────
  const handleCapture = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onCapture(canvas.toDataURL("image/jpeg", 0.92))
  }

  const loading = !rendererReady || !mpReady

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-160 aspect-4/3 rounded-xl overflow-hidden bg-black border">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

        {cameraState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/80">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Autorisez l'accès à la caméra</p>
            <Button onClick={startCamera} disabled={loading}>
              {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Chargement…</>
                : <><Camera className="h-4 w-4 mr-2" />Démarrer la caméra</>
              }
            </Button>
          </div>
        )}

        {cameraState === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}

        {cameraState === "denied" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/80">
            <CameraOff className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground text-center px-4">
              Accès à la caméra refusé.<br />Vérifiez les permissions de votre navigateur.
            </p>
            <Button variant="outline" onClick={startCamera}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        )}
      </div>

      {cameraState === "ready" && (
        <div className="flex flex-col items-center gap-3">
          {poseHint && (
            <div className="flex items-center gap-2 text-sm text-amber-200 bg-amber-900/60 border border-amber-700 rounded-lg px-4 py-2">
              <Hand className="h-4 w-4 shrink-0" />
              <span>{poseHint}</span>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={handleCapture}
              disabled={disabled || !!poseHint}
              className="gold-button text-white border-0 px-8"
            >
              Capturer
            </Button>
            <Button variant="outline" size="lg" onClick={stopCamera}>
              Arrêter
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
