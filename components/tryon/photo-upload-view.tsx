"use client"

import { useRef, useState, useCallback } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { drawJewelryOverlay, loadImage, needsFace, needsHand } from "@/lib/utils/tryon-overlay"

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

interface PhotoUploadViewProps {
  tryOnType: string
  jewelryImageUrl: string
  onCapture: (dataUrl: string) => void
  disabled?: boolean
}

export function PhotoUploadView({ tryOnType, jewelryImageUrl, onCapture, disabled }: PhotoUploadViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [processing, setProcessing] = useState(false)
  const [hasPhoto, setHasPhoto] = useState(false)

  const processPhoto = useCallback(async (file: File) => {
    if (!canvasRef.current) return
    setProcessing(true)
    setHasPhoto(false)

    try {
      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      // Load user photo
      const userImgUrl = URL.createObjectURL(file)
      const userImg    = await loadImage(userImgUrl)
      const jewelryImg = await loadImage(jewelryImageUrl)
      URL.revokeObjectURL(userImgUrl)

      const W = userImg.naturalWidth
      const H = userImg.naturalHeight
      canvasRef.current.width  = W
      canvasRef.current.height = H

      // Draw photo on canvas
      ctx.drawImage(userImg, 0, 0, W, H)

      // Load MediaPipe and run detection
      const { FaceLandmarker, HandLandmarker, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      )
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN)

      let faceLandmarks: any[][] = []
      let handLandmarks: any[][] = []

      if (needsFace(tryOnType)) {
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
          runningMode: "IMAGE",
          numFaces: 1,
        })
        const result = faceLandmarker.detect(userImg)
        faceLandmarks = result.faceLandmarks ?? []
        faceLandmarker.close()
      }

      if (needsHand(tryOnType)) {
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL, delegate: "GPU" },
          runningMode: "IMAGE",
          numHands: 2,
        })
        const result = handLandmarker.detect(userImg)
        handLandmarks = result.landmarks ?? []
        handLandmarker.close()
      }

      // Draw overlay (no mirror for uploaded photos)
      drawJewelryOverlay(ctx, jewelryImg, W, H, tryOnType, faceLandmarks, handLandmarks, false)
      setHasPhoto(true)
    } catch (err) {
      console.error("[PhotoUploadView] processing failed:", err)
    } finally {
      setProcessing(false)
    }
  }, [tryOnType, jewelryImageUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processPhoto(file)
  }

  const handleCapture = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onCapture(canvas.toDataURL("image/jpeg", 0.92))
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Canvas preview */}
      <div className="relative w-full max-w-[640px] rounded-xl overflow-hidden bg-muted border min-h-[200px] flex items-center justify-center">
        <canvas ref={canvasRef} className={`w-full h-auto ${hasPhoto ? "block" : "hidden"}`} />
        {!hasPhoto && !processing && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground p-8">
            <Upload className="h-10 w-10 opacity-40" />
            <p className="text-sm text-center">
              Importez une photo de vous<br />
              <span className="text-xs">Le bijou sera positionné automatiquement</span>
            </p>
          </div>
        )}
        {processing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-3">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
            <p className="text-white text-sm">Analyse en cours…</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <label className="cursor-pointer">
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
          <Button variant="outline" size="lg" asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {hasPhoto ? "Changer de photo" : "Choisir une photo"}
            </span>
          </Button>
        </label>

        {hasPhoto && (
          <Button
            size="lg"
            onClick={handleCapture}
            disabled={disabled || processing}
            className="gold-button text-white border-0 px-8"
          >
            Essayer ce bijou
          </Button>
        )}
      </div>
    </div>
  )
}
