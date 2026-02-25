import Link from "next/link"
import { Calendar, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Booking, Jewelry } from "@/lib/types"
import { formatPrice } from "@/lib/utils/format"
import { formatDate } from "@/lib/utils/date"

interface BookingCardProps {
  booking: Booking
  jewelry: Jewelry
}

export function BookingCard({ booking, jewelry }: BookingCardProps) {
  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    active: "bg-green-500/10 text-green-700 dark:text-green-400",
    completed: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  }

  const statusLabels = {
    pending: "En attente",
    confirmed: "Confirmée",
    active: "En cours",
    completed: "Terminée",
    cancelled: "Annulée",
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={jewelry.images[0] || "/placeholder.svg"}
              alt={jewelry.title}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link href={`/jewelry/${jewelry.id}`} className="font-semibold hover:text-primary transition-colors">
                  {jewelry.title}
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{jewelry.location}</span>
                </div>
              </div>
              <Badge className={statusColors[booking.status]}>{statusLabels[booking.status]}</Badge>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{formatPrice(booking.totalPrice)}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="bg-transparent">
                <Link href={`/dashboard/bookings/${booking.id}`}>Voir détails</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
