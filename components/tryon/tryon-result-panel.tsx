"use client"

import { Loader2, CheckCircle2, AlertCircle, Download, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { TryOnSession } from "@/lib/types"

interface TryOnResultPanelProps {
  session: TryOnSession
  capturedImageUrl?: string   // thumbnail of captured photo
  onRetry: () => void
  onDelete?: () => void
}

const MESSAGES = {
  PENDING:    { text: "En attente de traitement…",  icon: "spin"  },
  PROCESSING: { text: "Génération du rendu IA…",    icon: "spin"  },
  DONE:       { text: "Rendu généré avec succès !",  icon: "ok"    },
  FAILED:     { text: "Le rendu a échoué.",          icon: "error" },
}

export function TryOnResultPanel({
  session, capturedImageUrl, onRetry, onDelete,
}: TryOnResultPanelProps) {
  const info = MESSAGES[session.status] ?? MESSAGES.PENDING

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[640px] mx-auto">
      {/* Status bar */}
      <div className={`w-full flex items-center gap-3 rounded-lg p-4 border
        ${session.status === "DONE"   ? "bg-green-50 border-green-200"
        : session.status === "FAILED" ? "bg-red-50 border-red-200"
        : "bg-violet-50 border-violet-200"}`}>
        {info.icon === "spin" && (
          <Loader2 className="h-5 w-5 text-violet-600 animate-spin shrink-0" />
        )}
        {info.icon === "ok" && (
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        )}
        {info.icon === "error" && (
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
        )}
        <p className={`text-sm font-medium
          ${session.status === "DONE"   ? "text-green-700"
          : session.status === "FAILED" ? "text-red-700"
          : "text-violet-700"}`}>
          {info.text}
        </p>
        {(session.status === "PENDING" || session.status === "PROCESSING") && (
          <span className="ml-auto text-xs text-violet-500">Mise à jour toutes les 2.5s</span>
        )}
      </div>

      {/* Images side-by-side */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Input photo (thumbnail) */}
        {capturedImageUrl && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-[4/3] bg-muted">
                <img src={capturedImageUrl} alt="Photo capturée" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                  Photo originale
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Output image */}
        <Card className={`overflow-hidden ${!capturedImageUrl ? "col-span-2 max-w-[400px] mx-auto" : ""}`}>
          <CardContent className="p-0">
            <div className="relative aspect-[4/3] bg-muted flex items-center justify-center">
              {session.status === "DONE" && session.outputImageUrl ? (
                <>
                  <img
                    src={session.outputImageUrl}
                    alt="Essayage virtuel"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                    Rendu IA
                  </div>
                </>
              ) : session.status === "FAILED" ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="text-xs text-center">Rendu non disponible</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground p-4">
                  <div className="relative">
                    <Sparkles className="h-8 w-8 text-violet-400 animate-pulse" />
                  </div>
                  <p className="text-xs text-center text-violet-600">
                    {session.status === "PROCESSING" ? "Génération en cours…" : "En attente…"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center flex-wrap">
        {session.status === "DONE" && session.outputImageUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={session.outputImageUrl} download="essayage-goldlink.jpg" target="_blank" rel="noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Nouvel essayage
        </Button>
        {onDelete && session.status !== "PENDING" && session.status !== "PROCESSING" && (
          <Button variant="ghost" size="sm" className="text-muted-foreground"
            onClick={onDelete}>
            Supprimer ce résultat
          </Button>
        )}
      </div>
    </div>
  )
}
