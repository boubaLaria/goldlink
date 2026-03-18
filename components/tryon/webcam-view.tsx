"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Camera, CameraOff, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { drawJewelryOverlay, loadImage, needsFace, needsHand } from "@/lib/utils/tryon-overlay"

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

const CANVAS_W = 640
const CANVAS_H = 480

interface WebcamViewProps {
  tryOnType: string
  jewelryImageUrl: string
  onCapture: (dataUrl: string) => void
  disabled?: boolean
}

export function WebcamView({ tryOnType, jewelryImageUrl, onCapture, disabled }: WebcamViewProps) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number | null>(null)
  const faceLandmarkerRef = useRef<any>(null)
  const handLandmarkerRef = useRef<any>(null)
  const jewelryImgRef     = useRef<HTMLImageElement | null>(null)
  const lastFaceResult    = useRef<any>(null)
  const lastHandResult    = useRef<any>(null)

  const [cameraState, setCameraState] = useState<"idle" | "loading" | "ready" | "denied">("idle")
  const [mpState, setMpState] = useState<"loading" | "ready" | "error">("loading")

  // ── Load MediaPipe + jewelry image ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Load jewelry image
        jewelryImgRef.current = await loadImage(jewelryImageUrl)

        // Dynamic import of MediaPipe (avoids SSR issues)
        const { FaceLandmarker, HandLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        )
        if (cancelled) return

        const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
        if (cancelled) return

        if (needsFace(tryOnType)) {
          faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
            runningMode: "VIDEO",
            numFaces: 1,
          })
        }
        if (needsHand(tryOnType)) {
          handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: HAND_MODEL, delegate: "GPU" },
            runningMode: "VIDEO",
            numHands: 2,
          })
        }
        if (!cancelled) setMpState("ready")
      } catch (err) {
        console.error("[WebcamView] MediaPipe init failed:", err)
        if (!cancelled) setMpState("error")
      }
    }

    init()
    return () => {
      cancelled = true
      faceLandmarkerRef.current?.close()
      handLandmarkerRef.current?.close()
    }
  }, [tryOnType, jewelryImageUrl])

  // ── Start webcam ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraState("loading")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: CANVAS_W, height: CANVAS_H, facingMode: "user" },
      })
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraState("ready")
    } catch {
      setCameraState("denied")
    }
  }, [])

  // Stop webcam stream
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

  // ── Detection + drawing loop ───────────────────────────────────────────────
  useEffect(() => {
    if (cameraState !== "ready" || mpState !== "ready") return
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let lastTs = 0

    const tick = (now: number) => {
      if (video.readyState < 2) { rafRef.current = requestAnimationFrame(tick); return }

      const W = CANVAS_W
      const H = CANVAS_H
      canvas.width  = W
      canvas.height = H

      // Draw flipped video (selfie view)
      ctx.save()
      ctx.translate(W, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, W, H)
      ctx.restore()

      // Run detectors (throttle to ≤30 fps)
      if (now - lastTs > 33) {
        if (faceLandmarkerRef.current) {
          lastFaceResult.current = faceLandmarkerRef.current.detectForVideo(video, now)
        }
        if (handLandmarkerRef.current) {
          lastHandResult.current = handLandmarkerRef.current.detectForVideo(video, now)
        }
        lastTs = now
      }

      // Draw jewelry overlay
      if (jewelryImgRef.current) {
        drawJewelryOverlay(
          ctx,
          jewelryImgRef.current,
          W, H,
          tryOnType,
          lastFaceResult.current?.faceLandmarks ?? [],
          lastHandResult.current?.landmarks      ?? [],
          true, // mirror = selfie view
        )
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [cameraState, mpState, tryOnType])

  // ── Capture ───────────────────────────────────────────────────────────────
  const handleCapture = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onCapture(canvas.toDataURL("image/jpeg", 0.92))
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera / Canvas area */}
      <div className="relative w-full max-w-[640px] aspect-[4/3] rounded-xl overflow-hidden bg-black border">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

        {/* Overlay states */}
        {cameraState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/80">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Autorisez l'accès à la caméra</p>
            <Button onClick={startCamera} disabled={mpState === "loading"}>
              {mpState === "loading"
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Chargement IA...</>
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

        {cameraState === "ready" && mpState === "loading" && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            <Loader2 className="h-3 w-3 animate-spin" />
            Chargement détection…
          </div>
        )}
      </div>

      {/* Controls */}
      {cameraState === "ready" && (
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={handleCapture}
            disabled={disabled || mpState !== "ready"}
            className="gold-button text-white border-0 px-8"
          >
            Capturer
          </Button>
          <Button variant="outline" size="lg" onClick={stopCamera}>
            Arrêter
          </Button>
        </div>
      )}
    </div>
  )
}
