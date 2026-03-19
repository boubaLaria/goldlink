"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Box, RotateCcw, Maximize2, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Providers } from "@/app/providers"
import dynamic from "next/dynamic"

const JewelryViewer3D = dynamic(
  () => import("@/components/jewelry/jewelry-viewer-3d"),
  { ssr: false }
)

const JEWELRY_TYPE_LABELS: Record<string, string> = {
  NECKLACE: "Collier",
  BRACELET: "Bracelet",
  RING:     "Bague",
  EARRINGS: "Boucles d'oreilles",
  PENDANT:  "Pendentif",
  CHAIN:    "Chaîne",
}

type TryOnJewelry = {
  id: string
  title: string
  type: string
  images: string[]
  model3dUrl: string
  owner: { id: string; firstName: string; lastName: string }
}

interface TryOnClientProps {
  jewelry: TryOnJewelry
}

export function TryOnClient({ jewelry }: TryOnClientProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  const typeLabel = JEWELRY_TYPE_LABELS[jewelry.type] ?? jewelry.type
  const modelUrl = jewelry.model3dUrl.startsWith("http")
    ? jewelry.model3dUrl
    : `${typeof window !== "undefined" ? window.location.origin : ""}${jewelry.model3dUrl}`

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-4xl">

            {/* Header */}
            <div className="mb-6">
              <Button variant="ghost" asChild className="mb-4 -ml-2">
                <Link href={`/jewelry/${jewelry.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au bijou
                </Link>
              </Button>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Box className="h-6 w-6 text-violet-600" />
                    Essayage virtuel 3D
                  </h1>
                  <p className="text-muted-foreground mt-1">{jewelry.title}</p>
                </div>
                <Badge variant="outline" className="text-violet-700 border-violet-300">
                  {typeLabel}
                </Badge>
              </div>
            </div>

            {/* Instructions */}
            <div className="flex flex-wrap gap-3 mb-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" />
                Cliquez et faites glisser pour faire pivoter
              </span>
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4" />
                Scroll pour zoomer
              </span>
              {isMobile && (
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  Pincez pour zoomer
                </span>
              )}
            </div>

            {/* 3D Viewer */}
            <div ref={containerRef} className="relative">
              <JewelryViewer3D
                glbUrl={jewelry.model3dUrl}
                className={isFullscreen ? "h-screen" : ""}
              />

              {/* Fullscreen button */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>

              {/* AR button on mobile — uses model-viewer via script tag */}
              {isMobile && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <a
                    href={modelUrl}
                    rel="ar"
                    className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg transition-colors"
                  >
                    <Smartphone className="w-4 h-4" />
                    Voir en réalité augmentée
                  </a>
                </div>
              )}
            </div>

            {/* Info strip */}
            <div className="mt-4 flex items-center gap-3 p-3 bg-muted/50 rounded-lg border text-sm">
              {jewelry.images[0] && (
                <img
                  src={jewelry.images[0]}
                  alt={jewelry.title}
                  className="h-12 w-12 rounded object-cover border shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-1">{jewelry.title}</p>
                <p className="text-xs text-muted-foreground">
                  Modèle 3D interactif — faites tourner le bijou à 360°
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/jewelry/${jewelry.id}`}>Voir les détails</Link>
              </Button>
            </div>

          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
