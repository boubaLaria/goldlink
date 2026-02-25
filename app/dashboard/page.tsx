"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package, Calendar, TrendingUp, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { StatCard } from "@/components/ui/stat-card"
import { useAuth } from "@/lib/hooks/use-auth"
import { useJewelry } from "@/lib/hooks/use-jewelry"
import { useBookings } from "@/lib/hooks/use-bookings"
import { formatPrice } from "@/lib/utils/format"
import { Providers } from "../providers"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { jewelry, list: listJewelry } = useJewelry()
  const { bookings, list: listBookings } = useBookings()

  useEffect(() => {
    if (currentUser) {
      listJewelry({ ownerId: currentUser.id })
      listBookings()
    }
  }, [currentUser, listJewelry, listBookings])

  if (authLoading) {
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

  if (!currentUser) {
    return (
      <Providers>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Card className="p-8 max-w-md text-center">
              <h2 className="text-xl font-semibold mb-4">Connexion requise</h2>
              <p className="text-muted-foreground mb-6">Vous devez être connecté pour accéder au tableau de bord</p>
              <Button onClick={() => router.push("/login")}>Se connecter</Button>
            </Card>
          </main>
          <Footer />
        </div>
      </Providers>
    )
  }

  const activeBookings = bookings.filter(
    (b) => b.status === "ACTIVE" || b.status === "CONFIRMED",
  )
  const completedAsOwner = bookings.filter(
    (b) => b.ownerId === currentUser.id && b.status === "COMPLETED",
  )
  const totalRevenue = completedAsOwner.reduce((sum, b) => sum + b.totalPrice, 0)

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Bienvenue, {currentUser.firstName} {currentUser.lastName}
              </h1>
              <p className="text-muted-foreground">Gérez vos bijoux, réservations et transactions</p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Mes annonces" value={jewelry.length} icon={Package} />
              <StatCard title="Réservations actives" value={activeBookings.length} icon={Calendar} />
              <StatCard title="Total réservations" value={bookings.length} icon={TrendingUp} />
              <StatCard title="Revenus totaux" value={formatPrice(totalRevenue)} icon={DollarSign} />
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Mes annonces</CardTitle>
                  <CardDescription>Gérez vos bijoux en ligne</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/dashboard/listings">Voir mes annonces</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mes réservations</CardTitle>
                  <CardDescription>Suivez vos locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/dashboard/bookings">Voir mes réservations</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ajouter un bijou</CardTitle>
                  <CardDescription>Créez une nouvelle annonce</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/jewelry/new">Créer une annonce</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>Vos dernières réservations</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune activité récente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => {
                      const isOwner = booking.ownerId === currentUser.id
                      return (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between py-3 border-b last:border-0"
                        >
                          <div>
                            <p className="font-medium">{isOwner ? "Bijou loué" : "Location effectuée"}</p>
                            <p className="text-sm text-muted-foreground">
                              {(booking as any).jewelry?.title || "Bijou"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${isOwner ? "text-green-600" : ""}`}>
                              {isOwner ? "+" : "-"}
                              {formatPrice(booking.totalPrice)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
