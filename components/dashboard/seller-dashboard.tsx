"use client"

import Link from "next/link"
import { Calendar, TrendingUp, DollarSign, Gem, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { RecentBookingsCard } from "@/components/dashboard/recent-bookings-card"
import { formatPrice } from "@/lib/utils/format"
import { buildMonthlyData, TOOLTIP_STYLE } from "@/lib/services/dashboard.service"
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts"

interface SellerDashboardProps {
  user: any
  jewelry: any[]
  bookings: any[]
}

export function SellerDashboard({ user, jewelry, bookings }: SellerDashboardProps) {
  const received = bookings.filter((b) => b.ownerId === user.id)
  const active = received.filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED")
  const revenue = received.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.totalPrice, 0)
  const chartData = buildMonthlyData(bookings, user.id, true)

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Bonjour, {user.firstName} 👋</h1>
        <p className="text-muted-foreground">Gérez vos annonces et suivez vos revenus.</p>
        <Badge variant="outline" className="mt-2">{user.role === "JEWELER" ? "Bijoutier" : "Vendeur"}</Badge>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Mes annonces" value={jewelry.length} icon={Gem} />
        <StatCard title="Réservations actives" value={active.length} icon={Calendar} />
        <StatCard title="Revenus générés" value={formatPrice(revenue)} icon={DollarSign} />
        <StatCard title="Note moyenne" value={user.rating > 0 ? user.rating.toFixed(1) : "—"} icon={Star} />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Mes annonces</CardTitle>
            <CardDescription>{jewelry.length} bijou{jewelry.length !== 1 ? "x" : ""} en ligne</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full gold-button text-white border-0">
              <Link href="/dashboard/listings">Gérer mes annonces</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Réservations reçues</CardTitle>
            <CardDescription>{received.length} réservation{received.length !== 1 ? "s" : ""} au total</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/bookings">Voir les réservations</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un bijou</CardTitle>
            <CardDescription>Créez une nouvelle annonce</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/jewelry/new">Nouvelle annonce</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenus mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatPrice(v), "Revenus"]} contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="revenue" stroke="#C8922A" strokeWidth={2.5} dot={{ fill: "#C8922A", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Réservations reçues par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, "Réservations"]} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <RecentBookingsCard bookings={received} userId={user.id} asOwner />
    </>
  )
}
