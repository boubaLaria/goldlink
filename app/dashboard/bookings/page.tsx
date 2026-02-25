"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { EmptyState } from "@/components/ui/empty-state"
import { BookingCard } from "@/components/booking/booking-card"
import { useAuth } from "@/lib/hooks/use-auth"
import { useBookings } from "@/lib/hooks/use-bookings"
import { Providers } from "@/app/providers"

function normalizeBooking(booking: any) {
  return {
    ...booking,
    status: booking.status.toLowerCase(),
    startDate: new Date(booking.startDate),
    endDate: new Date(booking.endDate),
    createdAt: new Date(booking.createdAt),
  }
}

function normalizeJewelry(jewelry: any) {
  return {
    id: jewelry?.id ?? "",
    title: jewelry?.title ?? "",
    images: jewelry?.images ?? [],
    type: jewelry?.type?.toLowerCase() ?? "",
    location: jewelry?.location ?? "",
    ownerId: "",
    description: "",
    weight: 0,
    purity: 18,
    estimatedValue: 0,
    listingType: [],
    available: true,
    views: 0,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  }
}

export default function BookingsPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { bookings, list } = useBookings()

  useEffect(() => {
    if (currentUser) {
      list()
    }
  }, [currentUser, list])

  if (authLoading) return null

  if (!currentUser) {
    router.push("/login")
    return null
  }

  const myRentals = bookings.filter((b) => b.renterId === currentUser.id)
  const myListings = bookings.filter((b) => b.ownerId === currentUser.id)

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Mes réservations</h1>
              <p className="text-muted-foreground">Suivez vos locations et réservations</p>
            </div>

            <Tabs defaultValue="rentals" className="space-y-6">
              <TabsList>
                <TabsTrigger value="rentals">Mes locations ({myRentals.length})</TabsTrigger>
                <TabsTrigger value="listings">Mes bijoux loués ({myListings.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="rentals" className="space-y-4">
                {myRentals.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="Aucune location"
                    description="Vous n'avez pas encore loué de bijou. Explorez notre catalogue pour trouver le bijou parfait."
                    action={{
                      label: "Explorer le catalogue",
                      onClick: () => router.push("/catalog"),
                    }}
                  />
                ) : (
                  myRentals.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={normalizeBooking(booking) as any}
                      jewelry={normalizeJewelry((booking as any).jewelry) as any}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="listings" className="space-y-4">
                {myListings.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="Aucune réservation"
                    description="Personne n'a encore loué vos bijoux. Assurez-vous que vos annonces sont attractives."
                    action={{
                      label: "Voir mes annonces",
                      onClick: () => router.push("/dashboard/listings"),
                    }}
                  />
                ) : (
                  myListings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={normalizeBooking(booking) as any}
                      jewelry={normalizeJewelry((booking as any).jewelry) as any}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
