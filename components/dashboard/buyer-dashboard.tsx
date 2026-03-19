"use client"

import Link from "next/link"
import { Calendar, TrendingUp, DollarSign, ShoppingBag, BarChart2, Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { RecentBookingsCard } from "@/components/dashboard/recent-bookings-card"
import { formatPrice } from "@/lib/utils/format"
import { buildMonthlyData, TOOLTIP_STYLE } from "@/lib/services/dashboard.service"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts"

interface BuyerDashboardProps {
  user: any
  bookings: any[]
}

export function BuyerDashboard({ user, bookings }: BuyerDashboardProps) {
  const active = bookings.filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED")
  const completed = bookings.filter((b) => b.status === "COMPLETED")
  const totalSpent = completed.reduce((s, b) => s + b.totalPrice, 0)
  const chartData = buildMonthlyData(bookings, user.id, false)

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Bonjour, {user.firstName} 👋</h1>
        <p className="text-muted-foreground">Retrouvez vos réservations et découvrez de nouveaux bijoux.</p>
        <Badge variant="outline" className="mt-2">Acheteur / Locataire</Badge>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Réservations actives" value={active.length} icon={Calendar} />
        <StatCard title="Réservations terminées" value={completed.length} icon={TrendingUp} />
        <StatCard title="Total dépensé" value={formatPrice(totalSpent)} icon={DollarSign} />
        <StatCard title="Total réservations" value={bookings.length} icon={ShoppingBag} />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Mes réservations</CardTitle>
            <CardDescription>Suivez vos locations en cours</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full gold-button text-white border-0">
              <Link href="/dashboard/bookings">Voir mes réservations</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Catalogue</CardTitle>
            <CardDescription>Parcourez les bijoux disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/catalog">Explorer le catalogue</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estimation</CardTitle>
            <CardDescription>Évaluez la valeur d'un bijou</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/estimation">Faire une estimation</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8 border-violet-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5 text-violet-600" />
            Essayage 3D
          </CardTitle>
          <CardDescription>Essayez des bijoux avec un modèle 3D interactif</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white border-0">
            <Link href="/catalog?has3d=true">Bijoux avec essayage 3D</Link>
          </Button>
        </CardContent>
      </Card>

      {bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart2 className="h-4 w-4 text-primary" />
              Mes dépenses par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatPrice(v), "Dépenses"]} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="revenue" fill="#C8922A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <RecentBookingsCard bookings={bookings} userId={user.id} />
    </>
  )
}
