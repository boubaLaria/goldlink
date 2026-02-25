"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Calendar, MapPin, Star, Shield, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/hooks/use-auth"
import { formatPrice, formatWeight } from "@/lib/utils/format"
import { formatDate } from "@/lib/utils/date"
import Link from "next/link"

type Owner = {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  rating: number
  verified: boolean
}

type ReviewWithReviewer = {
  id: string
  rating: number
  comment: string
  createdAt: Date | string
  reviewer: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
}

type ApiJewelry = {
  id: string
  title: string
  description: string
  images: string[]
  type: string
  weight: number
  purity: string
  estimatedValue: number
  listingTypes: string[]
  rentPricePerDay: number | null
  salePrice: number | null
  available: boolean
  location: string
  views: number
  rating: number
  reviewCount: number
  owner: Owner
  reviews: ReviewWithReviewer[]
}

interface JewelryDetailClientProps {
  jewelry: ApiJewelry
}

export function JewelryDetailClient({ jewelry }: JewelryDetailClientProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [selectedImage, setSelectedImage] = useState(0)

  const owner = jewelry.owner

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <Image
                src={jewelry.images[selectedImage] || "/placeholder.svg?height=600&width=600"}
                alt={jewelry.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {jewelry.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? "border-primary" : "border-transparent"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg?height=150&width=150"}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex gap-2 mb-3">
                {jewelry.listingTypes.includes("RENT") && (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    Location
                  </Badge>
                )}
                {jewelry.listingTypes.includes("SALE") && (
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    Vente
                  </Badge>
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
                    <span className="text-3xl font-bold text-primary">{formatPrice(jewelry.rentPricePerDay)}</span>
                    <span className="text-muted-foreground">/jour</span>
                  </div>
                )}
                {jewelry.salePrice && (
                  <div>
                    <span className="text-2xl font-bold">{formatPrice(jewelry.salePrice)}</span>
                    <span className="text-muted-foreground"> prix de vente</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Caractéristiques</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Poids</p>
                  <p className="font-semibold">{formatWeight(jewelry.weight)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pureté</p>
                  <p className="font-semibold">{jewelry.purity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-semibold capitalize">{jewelry.type.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valeur estimée</p>
                  <p className="font-semibold">{formatPrice(jewelry.estimatedValue)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{jewelry.description}</p>
            </div>

            <Separator />

            {/* Owner Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={owner.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {owner.firstName[0]}
                        {owner.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {owner.firstName} {owner.lastName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {owner.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Vérifié
                          </Badge>
                        )}
                        {owner.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{owner.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {currentUser && currentUser.id !== owner.id && (
                    <Button variant="outline" size="sm" asChild className="bg-transparent">
                      <Link href={`/messages?user=${owner.id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contacter
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
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
                  <Link href={`/messages?user=${owner.id}&jewelry=${jewelry.id}`}>Faire une offre</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        {jewelry.reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Avis ({jewelry.reviews.length})</h2>
            <div className="space-y-4">
              {jewelry.reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={review.reviewer.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {review.reviewer.firstName[0]}
                          {review.reviewer.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold">
                              {review.reviewer.firstName} {review.reviewer.lastName}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
