"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, Camera, ImageIcon, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { WebcamView } from "@/components/tryon/webcam-view"
import { PhotoUploadView } from "@/components/tryon/photo-upload-view"
import { TryOnResultPanel } from "@/components/tryon/tryon-result-panel"
import { useTryOn } from "@/lib/hooks/use-tryon"
import { useAuth } from "@/lib/hooks/use-auth"
import { Providers } from "@/app/providers"
import Link from "next/link"
import type { TryOnMode } from "@/lib/types"

const TRYON_TYPE_LABELS: Record<string, string> = {
  FACE:   "Boucles d'oreilles",
  NECK:   "Collier / Pendentif",
  WRIST:  "Bracelet",
  FINGER: "Bague",
  MULTI:  "Parure",
}

type TryOnJewelry = {
  id: string
  title: string
  images: string[]
  tryOnType: string
  tryOnImageUrl: string
  owner: { id: string; firstName: string; lastName: string }
}

interface TryOnClientProps {
  jewelry: TryOnJewelry
}

type Step = "capture" | "rendering"

export function TryOnClient({ jewelry }: TryOnClientProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { serviceStatus, session, sessionLoading, error, checkStatus, start, deleteSession, clearSession } = useTryOn()

  const [step, setStep] = useState<Step>("capture")
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"webcam" | "photo">("webcam")

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push(`/login?redirect=/jewelry/${jewelry.id}/try-on`)
  }, [user, authLoading, jewelry.id, router])

  // Sync step with session status
  useEffect(() => {
    if (session) setStep("rendering")
  }, [session])

  const handleCapture = async (dataUrl: string) => {
    setCapturedDataUrl(dataUrl)
    const mode: TryOnMode = activeTab === "webcam" ? "WEBCAM" : "UPLOAD"
    try {
      await start(jewelry.id, dataUrl, mode)
      // step transitions to "rendering" via useEffect above
    } catch {
      // error state handled by useTryOn
    }
  }

  const handleRetry = () => {
    if (session) deleteSession(session.id)
    else clearSession()
    setCapturedDataUrl(null)
    setStep("capture")
  }

  if (authLoading || !user) return null

  const tryOnLabel = TRYON_TYPE_LABELS[jewelry.tryOnType] ?? jewelry.tryOnType
  const isFullFeatures = serviceStatus?.fullFeatures ?? false
  const isPreviewOnly  = serviceStatus?.previewOnly  ?? true
  const bothDown       = serviceStatus && !serviceStatus.ollama && !serviceStatus.comfyui

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-3xl">

            {/* Back + title */}
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
                    <Sparkles className="h-6 w-6 text-violet-600" />
                    Essayage virtuel
                  </h1>
                  <p className="text-muted-foreground mt-1">{jewelry.title}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-violet-700 border-violet-300">
                    {tryOnLabel}
                  </Badge>
                  {isFullFeatures && (
                    <Badge className="bg-green-100 text-green-700 border-green-300 border">
                      IA complète
                    </Badge>
                  )}
                  {isPreviewOnly && !bothDown && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-300 border">
                      Aperçu uniquement
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Jewelry preview strip */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-6 border">
              {jewelry.images[0] ? (
                <img src={jewelry.images[0]} alt={jewelry.title} className="h-12 w-12 rounded object-cover shrink-0 border" />
              ) : (
                <div className="h-12 w-12 rounded bg-muted border shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{jewelry.title}</p>
                <p className="text-xs text-muted-foreground">{tryOnLabel}</p>
              </div>
              <img src={jewelry.tryOnImageUrl} alt="Bijou" className="h-12 w-12 rounded object-contain border bg-white shrink-0" />
            </div>

            {/* Preview-only warning */}
            {isPreviewOnly && !bothDown && step === "capture" && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6 text-sm text-amber-800">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>
                  <strong>Aperçu uniquement</strong> — Le rendu IA haute qualité est temporairement
                  indisponible. Vous pouvez tout de même visualiser le bijou en temps réel.
                </p>
              </div>
            )}

            {/* Error from session start */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* ── STEP: Capture ── */}
            {step === "capture" && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="mb-6 w-full">
                  <TabsTrigger value="webcam" className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Caméra en direct
                  </TabsTrigger>
                  <TabsTrigger value="photo" className="flex-1">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Importer une photo
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="webcam">
                  <WebcamView
                    tryOnType={jewelry.tryOnType}
                    jewelryImageUrl={jewelry.tryOnImageUrl}
                    onCapture={handleCapture}
                    disabled={sessionLoading || (!isFullFeatures && !isPreviewOnly)}
                  />
                </TabsContent>

                <TabsContent value="photo">
                  <PhotoUploadView
                    tryOnType={jewelry.tryOnType}
                    jewelryImageUrl={jewelry.tryOnImageUrl}
                    onCapture={handleCapture}
                    disabled={sessionLoading || (!isFullFeatures && !isPreviewOnly)}
                  />
                </TabsContent>
              </Tabs>
            )}

            {/* ── STEP: Rendering / Result ── */}
            {step === "rendering" && session && (
              <TryOnResultPanel
                session={session}
                capturedImageUrl={capturedDataUrl ?? undefined}
                onRetry={handleRetry}
                onDelete={() => { deleteSession(session.id); handleRetry() }}
              />
            )}

            {/* Loading state while submitting */}
            {step === "rendering" && !session && sessionLoading && (
              <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
                <Sparkles className="h-5 w-5 animate-pulse text-violet-500" />
                Envoi de la photo…
              </div>
            )}

          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
