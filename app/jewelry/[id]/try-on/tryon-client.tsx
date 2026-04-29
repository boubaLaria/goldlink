"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, Camera, Smartphone, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Providers } from "@/app/providers"
import QRCode from "react-qr-code"

const WebcamView = dynamic(
  () => import("@/components/tryon/webcam-view").then(m => ({ default: m.WebcamView })),
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
  model3dUrl: string | null
  owner: { id: string; firstName: string; lastName: string }
}

interface TryOnClientProps {
  jewelry: TryOnJewelry
}

function CaptureResult({ dataUrl, onRetry }: { dataUrl: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <img
        src={dataUrl}
        alt="Résultat essayage"
        className="w-full max-w-lg rounded-xl border shadow"
      />
      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetry}>Nouvel essayage</Button>
        <Button asChild>
          <a href={dataUrl} download="essayage-goldlink.jpg">Télécharger</a>
        </Button>
      </div>
    </div>
  )
}

// ── Mobile view — caméra plein écran, caméra arrière ──────────────────────────
function MobileTryOn({ jewelry }: { jewelry: TryOnJewelry }) {
  const [capture, setCapture] = useState<string | null>(null)

  return (
    <Providers>
      <div className="fixed inset-0 bg-black flex flex-col">
        {capture ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
            <CaptureResult dataUrl={capture} onRetry={() => setCapture(null)} />
          </div>
        ) : (
          <>
            <WebcamView
              glbUrl={jewelry.model3dUrl ?? undefined}
              onCapture={setCapture}
              facingMode="environment"
            />
            <div className="absolute top-4 left-4">
              <Button asChild variant="ghost" size="sm" className="bg-black/40 text-white hover:bg-black/60">
                <Link href={`/jewelry/${jewelry.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </Providers>
  )
}

// ── Desktop view — onglets QR code + Webcam ───────────────────────────────────
function DesktopTryOn({ jewelry }: { jewelry: TryOnJewelry }) {
  const [capture, setCapture] = useState<string | null>(null)
  const typeLabel = JEWELRY_TYPE_LABELS[jewelry.type] ?? jewelry.type

  const pageUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/jewelry/${jewelry.id}/try-on`

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-3xl">

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
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold">Essayage virtuel</h1>
                    <Badge className="text-[10px] h-5 px-1.5 py-0 leading-none bg-rose-100 text-rose-700 border border-rose-300 font-semibold">
                      Dev
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{jewelry.title}</p>
                  <p className="text-xs text-rose-600 mt-1">
                    Fonctionnalite experimentale — en cours de developpement.
                  </p>
                </div>
                <Badge variant="outline" className="text-violet-700 border-violet-300">
                  {typeLabel}
                </Badge>
              </div>
            </div>

            {capture ? (
              <CaptureResult dataUrl={capture} onRetry={() => setCapture(null)} />
            ) : (
              <Tabs defaultValue="qr">
                <TabsList className="mb-6">
                  <TabsTrigger value="qr" className="flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4" />
                    Sur mobile
                  </TabsTrigger>
                  <TabsTrigger value="webcam" className="flex items-center gap-1.5">
                    <Camera className="h-4 w-4" />
                    Webcam
                  </TabsTrigger>
                </TabsList>

                {/* QR code tab */}
                <TabsContent value="qr">
                  <div className="flex flex-col items-center gap-6 py-8">
                    <div className="text-center space-y-2">
                      <p className="font-semibold text-lg">Essayez sur votre téléphone</p>
                      <p className="text-muted-foreground text-sm max-w-sm">
                        Scannez ce QR code avec votre téléphone pour utiliser la caméra arrière
                        et obtenir un résultat plus précis.
                      </p>
                    </div>
                    {pageUrl && (
                      <div className="p-4 bg-white rounded-2xl shadow border">
                        <QRCode value={pageUrl} size={200} />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{pageUrl}</p>
                  </div>
                </TabsContent>

                {/* Webcam tab */}
                <TabsContent value="webcam">
                  {/* Warning */}
                  <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Résultat approximatif sur webcam. Pour un meilleur rendu, utilisez
                      l'option <strong>Sur mobile</strong> ci-dessus.
                    </span>
                  </div>

                  <WebcamView
                    glbUrl={jewelry.model3dUrl ?? undefined}
                    onCapture={setCapture}
                    facingMode="user"
                  />
                </TabsContent>
              </Tabs>
            )}

          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}

// ── Root — routing mobile/desktop + type guard ────────────────────────────────
export function TryOnClient({ jewelry }: TryOnClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768)
    setHydrated(true)
  }, [])

  // Type non supporté → bientôt disponible
  if (jewelry.type !== "BRACELET") {
    const typeLabel = JEWELRY_TYPE_LABELS[jewelry.type] ?? jewelry.type
    return (
      <Providers>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center py-16">
            <div className="text-center space-y-4 max-w-sm px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">Bientôt disponible</h2>
              <p className="text-muted-foreground text-sm">
                L'essayage virtuel pour les <strong>{typeLabel.toLowerCase()}s</strong> est
                en cours de développement. Seuls les bracelets sont disponibles pour le moment.
              </p>
              <Button asChild variant="outline">
                <Link href={`/jewelry/${jewelry.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au bijou
                </Link>
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </Providers>
    )
  }

  // Attendre l'hydratation avant de décider mobile/desktop
  if (!hydrated) return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )

  if (isMobile) return <MobileTryOn jewelry={jewelry} />
  return <DesktopTryOn jewelry={jewelry} />
}
