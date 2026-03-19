'use client'

import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Camera } from 'lucide-react'

interface WebARViewProps {
  glbUrl: string
  onClose: () => void
}

/**
 * WebAR try-on view.
 * Currently a placeholder ready for DeepAR or Snap Camera Kit SDK integration.
 *
 * TODO: Initialize AR SDK in useEffect with `containerRef.current`
 * - DeepAR: https://www.deepar.ai/
 * - Snap Camera Kit: https://developers.snap.com/camera-kit
 * - 8thWall: https://www.8thwall.com/
 */
export default function WebARView({ glbUrl, onClose }: WebARViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // TODO: Initialize AR SDK here
    // Example with DeepAR:
    // const ar = await DeepAR({ licenseKey: '...', canvas: containerRef.current })
    // ar.loadAsset(glbUrl)
    // return () => ar.destroy()
    console.log('[WebAR] Ready to init AR SDK with model:', glbUrl)
  }, [glbUrl])

  return (
    <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden">
      {/* AR container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Placeholder overlay until SDK is integrated */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
        <Camera className="w-16 h-16 opacity-30" />
        <p className="text-lg font-semibold opacity-70">Essayage AR 3D</p>
        <p className="text-sm opacity-50 text-center max-w-xs px-4">
          L'intégration AR (DeepAR / Snap Camera Kit) sera disponible prochainement.
        </p>
        <div className="mt-2 text-xs opacity-40 font-mono bg-white/10 px-3 py-1 rounded">
          Modèle : {glbUrl.split('/').pop()}
        </div>
      </div>

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 text-white bg-black/40 hover:bg-black/60"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </Button>
    </div>
  )
}
