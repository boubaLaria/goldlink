"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Package, Calendar, TrendingUp, DollarSign,
  ShoppingBag, Gem, Shield, Star, BarChart2, Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { StatCard } from "@/components/ui/stat-card"
import { useAuth } from "@/lib/hooks/use-auth"
import { useJewelry } from "@/lib/hooks/use-jewelry"
import { useBookings } from "@/lib/hooks/use-bookings"
import { formatPrice } from "@/lib/utils/format"
import { Providers } from "../providers"
import Link from "next/link"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line,
} from "recharts"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMonthlyData(bookings: any[], userId: string, asOwner: boolean) {
  const months: Record<string, { month: string; revenue: number; count: number }> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    months[key] = { month: key, revenue: 0, count: 0 }
  }
  bookings.forEach((b) => {
    const relevant = asOwner ? b.ownerId === userId : b.renterId === userId
    if (!relevant) return
    const d = new Date(b.createdAt)
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
    if (diff < 0 || diff > 5) return
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    if (months[key]) {
      months[key].count++
      if (b.status === "COMPLETED") months[key].revenue += b.totalPrice
    }
  })
  return Object.values(months)
}

const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
}

// ─── Sub-dashboards ───────────────────────────────────────────────────────────

function BuyerDashboard({ user, bookings }: { user: any; bookings: any[] }) {
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

      {/* Spending chart */}
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
                <Tooltip
                  formatter={(v: number) => [formatPrice(v), "Dépenses"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="revenue" fill="#C8922A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <RecentBookings bookings={bookings} userId={user.id} />
    </>
  )
}

function SellerDashboard({ user, jewelry, bookings }: { user: any; jewelry: any[]; bookings: any[] }) {
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

      {/* Revenue chart */}
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
                <Tooltip
                  formatter={(v: number) => [formatPrice(v), "Revenus"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Line type="monotone" dataKey="revenue" stroke="#C8922A" strokeWidth={2.5}
                  dot={{ fill: "#C8922A", r: 4 }} activeDot={{ r: 6 }} />
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
                <Tooltip
                  formatter={(v: number) => [v, "Réservations"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <RecentBookings bookings={received} userId={user.id} asOwner />
    </>
  )
}

function AdminDashboard({ user, jewelry, bookings }: { user: any; jewelry: any[]; bookings: any[] }) {
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

      <RecentBookings bookings={bookings} userId={user.id} />
    </>
  )
}

// ─── Shared component ─────────────────────────────────────────────────────────

function RecentBookings({ bookings, userId, asOwner = false }: { bookings: any[]; userId: string; asOwner?: boolean }) {
  if (bookings.length === 0) return null

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "text-orange-600",
    CONFIRMED: "text-blue-600",
    ACTIVE: "text-green-600",
    COMPLETED: "text-muted-foreground",
    CANCELLED: "text-red-500",
  }

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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
