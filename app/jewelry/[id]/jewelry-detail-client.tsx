"use client"

import { useState, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, MapPin, Star, Pencil, Trash2, Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/hooks/use-auth"
import { useJewelry } from "@/lib/hooks/use-jewelry"
import { formatPriceWithCurrency, getCurrencyLocale, formatWeight } from "@/lib/utils/format"
import { JewelryImageGallery } from "@/components/jewelry/jewelry-image-gallery"
import { JewelryOwnerCard } from "@/components/jewelry/jewelry-owner-card"
import { JewelryReviews } from "@/components/jewelry/jewelry-reviews"
import Link from "next/link"
import { toast } from "sonner"

const JewelryViewer3D = lazy(() => import("@/components/jewelry/jewelry-viewer-3d"))
const WebARView = lazy(() => import("@/components/jewelry/web-ar-view"))

type Owner = {
  id: string; firstName: string; lastName: string
  avatar: string | null; rating: number; verified: boolean
}

type ReviewWithReviewer = {
  id: string; rating: number; comment: string; createdAt: Date | string
  reviewer: { id: string; firstName: string; lastName: string; avatar: string | null }
}

export type ApiJewelry = {
  id: string; title: string; description: string; images: string[]
  type: string; weight: number; purity: string; estimatedValue: number
  listingTypes: string[]; rentPricePerDay: number | null; salePrice: number | null
  available: boolean; location: string; country: string; currency: string
  views: number; rating: number; reviewCount: number
  model3dUrl?: string | null
  owner: Owner; reviews: ReviewWithReviewer[]
}

interface JewelryDetailClientProps {
  jewelry: ApiJewelry
}

export function JewelryDetailClient({ jewelry }: JewelryDetailClientProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { delete: deleteJewelry } = useJewelry()
  const [show3DViewer, setShow3DViewer] = useState(false)
  const [showARTryOn, setShowARTryOn] = useState(false)

  const handle3DError = () => {
    setShow3DViewer(false)
    toast.error("Le modèle 3D n'a pas pu être chargé", {
      description: "Retour aux photos du bijou",
    })
  }

  const canEdit = currentUser && (currentUser.id === jewelry.owner.id || currentUser.role === "ADMIN")
  const itemCurrency = jewelry.currency || "EUR"
  const locale = getCurrencyLocale(itemCurrency)

  async function handleDelete() {
    if (!confirm("Supprimer ce bijou ? Cette action est irréversible.")) return
    try {
      await deleteJewelry(jewelry.id)
      router.push("/catalog")
    } catch {
      alert("Erreur lors de la suppression.")
    }
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: 3D viewer (if GLB available) or image gallery */}
          <div className="space-y-3">
            {jewelry.model3dUrl && show3DViewer ? (
              <Suspense fallback={
                <div className="w-full aspect-square bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-3 text-white/50">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-2 border-white/20 rounded-full" />
                    <div className="absolute inset-0 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    <Box className="absolute inset-0 m-auto w-5 h-5 text-white/40" />
                  </div>
                  <span className="text-sm">Chargement du modèle 3D...</span>
                </div>
              }>
                <JewelryViewer3D glbUrl={jewelry.model3dUrl} onError={handle3DError} />
              </Suspense>
            ) : (
              <JewelryImageGallery images={jewelry.images} title={jewelry.title} />
            )}
            {jewelry.model3dUrl && (
              <div className="flex gap-2">
                <Button
                  variant={show3DViewer ? "default" : "outline"}
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => setShow3DViewer(true)}
                >
                  <Box className="w-4 h-4 mr-2" />
                  Vue 3D
                </Button>
                <Button
                  variant={!show3DViewer ? "default" : "outline"}
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => setShow3DViewer(false)}
                >
                  Photos
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-violet-300 text-violet-700 hover:bg-violet-50 bg-transparent"
                >
                  <Link href={`/jewelry/${jewelry.id}/try-on`}>
                    Essayer
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Title + badges + rating */}
            <div>
              <div className="flex gap-2 mb-3">
                {jewelry.listingTypes.includes("RENT") && (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">Location</Badge>
                )}
                {jewelry.listingTypes.includes("SALE") && (
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">Vente</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4">{jewelry.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                {jewelry.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{jewelry.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({jewelry.reviewCount} avis)</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{jewelry.location}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 mb-6">
                {jewelry.rentPricePerDay && (
                  <div>
                    <span className="text-3xl font-bold text-primary">
                      {formatPriceWithCurrency(jewelry.rentPricePerDay, itemCurrency, locale)}
                    </span>
                    <span className="text-muted-foreground">/jour</span>
                  </div>
                )}
                {jewelry.salePrice && (
                  <div>
                    <span className="text-2xl font-bold">
                      {formatPriceWithCurrency(jewelry.salePrice, itemCurrency, locale)}
                    </span>
                    <span className="text-muted-foreground"> prix de vente</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Characteristics */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Caractéristiques</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Poids", value: formatWeight(jewelry.weight) },
                  { label: "Pureté", value: jewelry.purity },
                  { label: "Type", value: jewelry.type.toLowerCase() },
                  { label: "Valeur estimée", value: formatPriceWithCurrency(jewelry.estimatedValue, itemCurrency, locale) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-semibold capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{jewelry.description}</p>
            </div>

            <Separator />

            <JewelryOwnerCard owner={jewelry.owner} currentUserId={currentUser?.id} />

            {/* Booking / offer actions */}
            <div className="flex gap-4">
              {jewelry.listingTypes.includes("RENT") && (
                <Button asChild className="flex-1" size="lg">
                  <Link href={`/booking/${jewelry.id}`}>
                    <Calendar className="mr-2 h-5 w-5" />
                    Réserver
                  </Link>
                </Button>
              )}
              {jewelry.listingTypes.includes("SALE") && (
                <Button asChild variant="outline" className="flex-1 bg-transparent" size="lg">
                  <Link href={`/messages?user=${jewelry.owner.id}&jewelry=${jewelry.id}`}>
                    Faire une offre
                  </Link>
                </Button>
              )}
            </div>

            {jewelry.model3dUrl && (
              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowARTryOn(true)}
              >
                <Box className="mr-2 h-5 w-5" />
                Essayer en 3D
              </Button>
            )}

            {canEdit && (
              <div className="flex gap-3 pt-2 border-t">
                <Button asChild variant="outline" size="sm" className="bg-transparent">
                  <Link href={`/jewelry/${jewelry.id}/edit`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        </div>

        <JewelryReviews reviews={jewelry.reviews} />
      </div>

      {/* WebAR modal */}
      {showARTryOn && jewelry.model3dUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <Suspense fallback={
              <div className="w-full h-[600px] bg-black rounded-xl flex items-center justify-center text-white">
                Chargement...
              </div>
            }>
              <WebARView glbUrl={jewelry.model3dUrl} onClose={() => setShowARTryOn(false)} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}
