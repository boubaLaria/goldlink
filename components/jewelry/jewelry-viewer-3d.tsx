'use client'

import { Suspense, Component, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Stage } from '@react-three/drei'
import { Box, ImageOff, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

function LoadingFallback() {
  return (
    <div className="w-full aspect-square bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-3 text-white/50">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-2 border-white/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
        <Box className="absolute inset-0 m-auto w-5 h-5 text-white/40" />
      </div>
      <span className="text-sm">Chargement du modèle 3D...</span>
    </div>
  )
}

interface ErrorStateProps {
  onRetry: () => void
  onFallback: () => void
}

function ErrorState({ onRetry, onFallback }: ErrorStateProps) {
  return (
    <div className="w-full aspect-square bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-4 text-white/60 p-6">
      <div className="rounded-full bg-white/5 p-4">
        <ImageOff className="w-10 h-10 opacity-40" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-white/70">Modèle 3D indisponible</p>
        <p className="text-xs opacity-50">Le fichier n'a pas pu être chargé</p>
      </div>
      <div className="flex gap-2 mt-1">
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-white/60 hover:text-white hover:border-white/40 bg-transparent"
          onClick={onRetry}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Réessayer
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-white/60 hover:text-white hover:border-white/40 bg-transparent"
          onClick={onFallback}
        >
          Voir les photos
        </Button>
      </div>
    </div>
  )
}

interface GLBErrorBoundaryProps {
  children: ReactNode
  onError?: () => void
  url: string
}

interface GLBErrorBoundaryState {
  hasError: boolean
  key: number
}

class GLBErrorBoundary extends Component<GLBErrorBoundaryProps, GLBErrorBoundaryState> {
  constructor(props: GLBErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, key: 0 }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  handleRetry = () => {
    this.setState((s) => ({ hasError: false, key: s.key + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          onRetry={this.handleRetry}
          onFallback={() => this.props.onError?.()}
        />
      )
    }
    return <div key={this.state.key}>{this.props.children}</div>
  }
}

interface JewelryViewer3DProps {
  glbUrl: string
  className?: string
  onError?: () => void
}

export default function JewelryViewer3D({ glbUrl, className = '', onError }: JewelryViewer3DProps) {
  return (
    <GLBErrorBoundary url={glbUrl} onError={onError}>
      <div className={`w-full aspect-square bg-zinc-900 rounded-xl overflow-hidden ${className}`}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.8}>
              <Model url={glbUrl} />
            </Stage>
            <OrbitControls
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.5}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 1.5}
            />
          </Suspense>
        </Canvas>
      </div>
    </GLBErrorBoundary>
  )
}
