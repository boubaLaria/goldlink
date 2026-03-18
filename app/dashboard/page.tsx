"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BuyerDashboard } from "@/components/dashboard/buyer-dashboard"
import { SellerDashboard } from "@/components/dashboard/seller-dashboard"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { useAuth } from "@/lib/hooks/use-auth"
import { useJewelry } from "@/lib/hooks/use-jewelry"
import { useBookings } from "@/lib/hooks/use-bookings"
import { Providers } from "../providers"

export default function DashboardPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { jewelry, list: listJewelry } = useJewelry()
  const { bookings, list: listBookings } = useBookings()

  useEffect(() => {
    if (!currentUser) return
    if (currentUser.role === "ADMIN") {
      listJewelry()
      listBookings()
    } else if (currentUser.role === "SELLER" || currentUser.role === "JEWELER") {
      listJewelry({ ownerId: currentUser.id })
      listBookings({ role: "owner" })
    } else {
      listBookings({ role: "renter" })
    }
  }, [currentUser])

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
              <p className="text-muted-foreground mb-6">Vous devez être connecté pour accéder au tableau de bord.</p>
              <Button onClick={() => router.push("/login")}>Se connecter</Button>
            </Card>
          </main>
          <Footer />
        </div>
      </Providers>
    )
  }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            {currentUser.role === "ADMIN" && (
              <AdminDashboard user={currentUser} jewelry={jewelry} bookings={bookings} />
            )}
            {(currentUser.role === "SELLER" || currentUser.role === "JEWELER") && (
              <SellerDashboard user={currentUser} jewelry={jewelry} bookings={bookings} />
            )}
            {currentUser.role === "BUYER" && (
              <BuyerDashboard user={currentUser} bookings={bookings} />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
