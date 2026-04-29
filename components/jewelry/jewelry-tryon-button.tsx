"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { TryOnServiceStatus } from "@/lib/hooks/use-tryon"

interface JewelryTryOnButtonProps {
  jewelryId: string
  status: TryOnServiceStatus | null
}

export function JewelryTryOnButton({ jewelryId, status }: JewelryTryOnButtonProps) {
  const href = `/jewelry/${jewelryId}/try-on`

  const devBadge = (
    <Badge className="text-[9px] h-4 px-1 py-0 leading-none bg-rose-100 text-rose-700 border border-rose-300 font-semibold">
      Dev
    </Badge>
  )

  if (status?.fullFeatures) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-end">{devBadge}</div>
        <Button asChild size="lg" className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0">
          <Link href={href}>
            <Sparkles className="mr-2 h-5 w-5" />
            Essayer ce bijou en AR
          </Link>
        </Button>
        <p className="text-xs text-center text-rose-600">
          Fonctionnalite en cours de developpement — resultats experimentaux.
        </p>
      </div>
    )
  }

  if (status?.previewOnly) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-end">{devBadge}</div>
        <Button asChild size="lg" variant="outline"
          className="w-full border-violet-300 text-violet-700 hover:bg-violet-50 bg-transparent">
          <Link href={href}>
            <Sparkles className="mr-2 h-5 w-5" />
            Essayer ce bijou
          </Link>
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Aperçu rapide disponible · Rendu haute qualité temporairement indisponible
        </p>
      </div>
    )
  }

  if (status && !status.ollama && !status.comfyui) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-end">{devBadge}</div>
        <Button size="lg" disabled className="w-full opacity-50 cursor-not-allowed"
          title="L'essayage virtuel est temporairement indisponible">
          <Sparkles className="mr-2 h-5 w-5" />
          Essayage virtuel indisponible
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Ce service sera bientôt disponible · Consultez les photos du bijou
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-end">{devBadge}</div>
      <Button size="lg" disabled className="w-full bg-violet-600 text-white border-0 opacity-70">
        <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
        Essayer ce bijou...
      </Button>
    </div>
  )
}
