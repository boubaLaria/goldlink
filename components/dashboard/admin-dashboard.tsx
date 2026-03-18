"use client"

import Link from "next/link"
import { Calendar, TrendingUp, BarChart2, Gem, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { RecentBookingsCard } from "@/components/dashboard/recent-bookings-card"
import { formatPrice } from "@/lib/utils/format"

interface AdminDashboardProps {
  user: any
  jewelry: any[]
  bookings: any[]
}

export function AdminDashboard({ user, jewelry, bookings }: AdminDashboardProps) {
  const active = bookings.filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED")
  const revenue = bookings.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.totalPrice, 0)

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Panel Administrateur</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la plateforme GoldLink.</p>
        <Badge className="mt-2 bg-red-100 text-red-800 hover:bg-red-100">ADMIN</Badge>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Bijoux en ligne" value={jewelry.length} icon={Gem} />
        <StatCard title="Réservations actives" value={active.length} icon={Calendar} />
        <StatCard title="Volume total" value={formatPrice(revenue)} icon={BarChart2} />
        <StatCard title="Total réservations" value={bookings.length} icon={TrendingUp} />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Gestion utilisateurs
            </CardTitle>
            <CardDescription>Rôles, vérification, suppression</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-red-600 hover:bg-red-700">
              <Link href="/dashboard/admin">Ouvrir le panel admin</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Toutes les annonces</CardTitle>
            <CardDescription>{jewelry.length} bijou{jewelry.length !== 1 ? "x" : ""} sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/catalog">Voir le catalogue</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Toutes les réservations</CardTitle>
            <CardDescription>{bookings.length} réservation{bookings.length !== 1 ? "s" : ""} au total</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/bookings">Voir les réservations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <RecentBookingsCard bookings={bookings} userId={user.id} />
    </>
  )
}
