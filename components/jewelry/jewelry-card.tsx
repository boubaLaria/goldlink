"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, MapPin, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Jewelry } from "@/lib/types"
import { formatPrice, formatWeight, formatPurity } from "@/lib/utils/format"

interface JewelryCardProps {
  jewelry: Jewelry
  onFavorite?: () => void
  isFavorite?: boolean
}

export function JewelryCard({ jewelry, onFavorite, isFavorite = false }: JewelryCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/jewelry/${jewelry.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={jewelry.images[0] || "/placeholder.svg?height=400&width=400"}
            alt={jewelry.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {onFavorite && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.preventDefault()
                onFavorite()
              }}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          )}
          <div className="absolute top-2 left-2 flex gap-2">
            {jewelry.listingType.includes("rent") && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                Location
              </Badge>
            )}
            {jewelry.listingType.includes("sale") && (
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                Vente
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/jewelry/${jewelry.id}`}>
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 hover:text-primary transition-colors">
            {jewelry.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span>{jewelry.location}</span>
        </div>

        <div className="flex items-center gap-4 text-sm mb-3">
          <span className="font-medium">{formatWeight(jewelry.weight)}</span>
          <span className="font-medium">{formatPurity(jewelry.purity)}</span>
          {jewelry.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{jewelry.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({jewelry.reviewCount})</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {jewelry.rentPricePerDay && (
            <p className="text-sm">
              <span className="font-semibold text-primary">{formatPrice(jewelry.rentPricePerDay)}</span>
              <span className="text-muted-foreground">/jour</span>
            </p>
          )}
          {jewelry.salePrice && (
            <p className="text-sm">
              <span className="font-semibold">{formatPrice(jewelry.salePrice)}</span>
              <span className="text-muted-foreground"> à l'achat</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
