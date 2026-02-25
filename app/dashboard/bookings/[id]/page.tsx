"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, Shield, User, Phone, Mail, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Providers } from "@/app/providers"
import { useAuth } from "@/lib/hooks/use-auth"
import { useBookings } from "@/lib/hooks/use-bookings"
import { formatPrice, formatPriceWithCurrency, getCurrencyLocale } from "@/lib/utils/format"
import { formatDate } from "@/lib/utils/date"
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from "@/lib/services/booking.service"
import { useToast } from "@/hooks/use-toast"

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { getById, updateStatus } = useBookings()
  const { toast } = useToast()

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const id = params.id as string

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login")
    }
  }, [authLoading, currentUser, router])

  useEffect(() => {
    if (currentUser && id) {
      setLoading(true)
      getById(id).then((data) => {
        setBooking(data)
        setLoading(false)
      })
    }
  }, [currentUser, id, getById])

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true)
      const updated = await updateStatus(id, newStatus)
      setBooking(updated)
      toast({
        title: "Statut mis à jour",
        description: `La réservation est maintenant : ${BOOKING_STATUS_LABELS[newStatus.toLowerCase()]}`,
      })
    } catch {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut", variant: "destructive" })
    } finally {
      setUpdating(false)
    }
  }

  if (authLoading || loading) {
    return (
      <Providers>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Chargement...</p>
          </main>
          <Footer />
        </div>
      </Providers>
    )
  }

  if (!booking) {
    return (
      <Providers>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Réservation introuvable.</p>
          </main>
          <Footer />
        </div>
      </Providers>
    )
  }

  const userCurrency = currentUser?.currency || 'MAD'
  const locale = getCurrencyLocale(userCurrency)
  const status = booking.status?.toLowerCase()
  const isOwner = currentUser?.id === booking.ownerId
  const jewelry = booking.jewelry
  const renter = booking.renter
  const owner = booking.owner

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>

            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">Détails de la réservation</h1>
              <Badge className={BOOKING_STATUS_COLORS[status] ?? ""}>
                {BOOKING_STATUS_LABELS[status] ?? status}
              </Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main info */}
              <div className="lg:col-span-2 space-y-6">

                {/* Jewelry */}
                {jewelry && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Bijou</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={jewelry.images?.[0] || "/placeholder.svg"}
                            alt={jewelry.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Link
                            href={`/jewelry/${jewelry.id}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {jewelry.title}
                          </Link>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {jewelry.location}
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {jewelry.type?.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Dates */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Période de location</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Du</p>
                        <p className="font-medium">{formatDate(booking.startDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Au</p>
                        <p className="font-medium">{formatDate(booking.endDate)}</p>
                      </div>
                    </div>
                    {booking.insurance && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                        <Shield className="h-4 w-4" />
                        Assurance incluse
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Renter */}
                {renter && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Locataire</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={renter.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {renter.firstName?.[0]}{renter.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{renter.firstName} {renter.lastName}</p>
                          {renter.rating > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {renter.rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {renter.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {renter.email}
                            </div>
                          )}
                          {renter.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {renter.phone}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Owner */}
                {owner && !isOwner && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Propriétaire</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={owner.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {owner.firstName?.[0]}{owner.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{owner.firstName} {owner.lastName}</p>
                          {owner.rating > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {owner.rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild className="bg-transparent">
                        <Link href={`/messages?user=${owner.id}`}>
                          Contacter
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Summary sidebar */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Récapitulatif financier</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Total location</span>
                      <span className="font-medium">{formatPriceWithCurrency(booking.totalPrice, userCurrency, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Caution
                      </span>
                      <span className="font-medium">{formatPriceWithCurrency(booking.deposit, userCurrency, locale)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatPriceWithCurrency(booking.totalPrice + booking.deposit, userCurrency, locale)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Status update (owner only) */}
                {isOwner && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Gérer le statut</CardTitle></CardHeader>
                    <CardContent>
                      <Select
                        value={booking.status}
                        onValueChange={handleStatusUpdate}
                        disabled={updating || ['COMPLETED', 'CANCELLED'].includes(booking.status)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">En attente</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmer</SelectItem>
                          <SelectItem value="ACTIVE">Marquer actif</SelectItem>
                          <SelectItem value="COMPLETED">Terminer</SelectItem>
                          <SelectItem value="CANCELLED">Annuler</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Réservation créée le {formatDate(booking.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
