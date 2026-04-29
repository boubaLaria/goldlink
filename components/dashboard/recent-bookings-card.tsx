"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils/format"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-orange-600",
  CONFIRMED: "text-blue-600",
  ACTIVE: "text-green-600",
  COMPLETED: "text-muted-foreground",
  CANCELLED: "text-red-500",
}

interface RecentBookingsCardProps {
  bookings: any[]
  userId: string
  asOwner?: boolean
}

export function RecentBookingsCard({ bookings, userId, asOwner = false }: RecentBookingsCardProps) {
  if (bookings.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
        <CardDescription>Vos dernières réservations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {bookings.slice(0, 5).map((booking) => {
            const isOwner = booking.ownerId === userId
            const statusColor = STATUS_COLORS[booking.status] ?? ""
            return (
              <div key={booking.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="font-medium text-sm truncate">{booking.jewelry?.title || "Bijou"}</p>
                  <p className={`text-xs mt-0.5 ${statusColor}`}>{booking.status}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-semibold text-sm ${isOwner ? "text-green-600" : ""}`}>
                    {isOwner ? "+" : "-"}{formatPrice(booking.totalPrice)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(booking.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
