"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Shield, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { formatPriceWithCurrency, getCurrencyLocale } from "@/lib/utils/format"
import { calculateDaysBetween } from "@/lib/utils/date"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import apiClient from "@/lib/api-client"

type BookingItem = {
  id: string
  title: string
  location: string
  rentPricePerDay: number | null
  estimatedValue: number
  currency: string | null
}

interface BookingClientProps {
  item: BookingItem
}

export function BookingClient({ item }: BookingClientProps) {
  const router = useRouter()
  const { user: currentUser, loading } = useAuth()
  const { toast } = useToast()

  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [insurance, setInsurance] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>Vous devez être connecté pour réserver un bijou</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const itemCurrency = item.currency || 'EUR'
  const locale = getCurrencyLocale(itemCurrency)
  const fmt = (price: number) => formatPriceWithCurrency(price, itemCurrency, locale)

  const days = startDate && endDate ? calculateDaysBetween(startDate, endDate) : 0
  const rentalPrice = days * (item.rentPricePerDay || 0)
  const insurancePrice = insurance ? rentalPrice * 0.05 : 0
  const deposit = item.estimatedValue * 0.1
  const totalPrice = rentalPrice + insurancePrice

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Dates manquantes",
        description: "Veuillez sélectionner les dates de location",
        variant: "destructive",
      })
      return
    }

    if (!acceptTerms) {
      toast({
        title: "Conditions non acceptées",
        description: "Veuillez accepter les conditions de location",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      await apiClient.post("/api/bookings", {
        jewelryId: item.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        insurance,
      })

      toast({
        title: "Réservation confirmée",
        description: "Votre réservation a été effectuée avec succès",
      })

      router.push("/dashboard/bookings")
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de créer la réservation",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Réserver ce bijou</CardTitle>
                <CardDescription>Sélectionnez vos dates et confirmez votre réservation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Selection */}
                <div className="space-y-4">
                  <Label>Dates de location</Label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Date de début</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP", { locale: fr }) : "Sélectionner"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">Date de fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP", { locale: fr }) : "Sélectionner"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => !startDate || date <= startDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  {days > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Durée de location : {days} jour{days > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Insurance Option */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="insurance"
                      checked={insurance}
                      onCheckedChange={(checked) => setInsurance(checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="insurance" className="font-normal cursor-pointer">
                        Ajouter une assurance (5% du prix de location)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Protection complète en cas de dommages ou de perte
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Terms */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="font-normal cursor-pointer">
                      J'accepte les{" "}
                      <a href="/terms" className="text-primary hover:underline">
                        conditions de location
                      </a>{" "}
                      et la{" "}
                      <a href="/privacy" className="text-primary hover:underline">
                        politique de confidentialité
                      </a>
                    </Label>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Une caution de {fmt(deposit)} sera bloquée sur votre carte et restituée après le retour du
                    bijou en bon état.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.location}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {fmt(item.rentPricePerDay || 0)} × {days} jour{days > 1 ? "s" : ""}
                    </span>
                    <span>{fmt(rentalPrice)}</span>
                  </div>
                  {insurance && (
                    <div className="flex justify-between text-sm">
                      <span>Assurance (5%)</span>
                      <span>{fmt(insurancePrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Caution (bloquée)
                    </span>
                    <span>{fmt(deposit)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{fmt(totalPrice)}</span>
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={!startDate || !endDate || !acceptTerms || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? "Traitement..." : "Confirmer la réservation"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Paiement sécurisé. Vous ne serez débité qu'après confirmation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
