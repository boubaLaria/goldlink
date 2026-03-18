"use client"

import { TrendingUp, Users, Gem, Calendar, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils/format"
import {
  buildMonthlyRevenue, buildBookingsByMonth, buildJewelryByType,
  CHART_COLORS, CHART_TOOLTIP_STYLE,
} from "@/lib/services/admin-charts.service"
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts"

interface AdminOverviewTabProps {
  users: any[]
  bookings: any[]
  jewelry: any[]
}

export function AdminOverviewTab({ users, bookings, jewelry }: AdminOverviewTabProps) {
  const totalRevenue = bookings.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.totalPrice, 0)
  const activeBookings = bookings.filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED").length
  const monthlyRevenue = buildMonthlyRevenue(bookings)
  const bookingsByMonth = buildBookingsByMonth(bookings)
  const jewelryByType = buildJewelryByType(jewelry)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{users.filter((u) => !u.verified).length} non vérifiés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gem className="h-4 w-4" /> Bijoux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{jewelry.length}</p>
            <p className="text-xs text-muted-foreground mt-1">en catalogue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Réservations actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeBookings}</p>
            <p className="text-xs text-muted-foreground mt-1">{bookings.length} au total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Volume complété
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">transactions réalisées</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenus mensuels (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyRevenue} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatPrice(v), "Revenus"]} contentStyle={CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="revenue" stroke="#C8922A" strokeWidth={2.5} dot={{ fill: "#C8922A", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Réservations par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bookingsByMonth} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, "Réservations"]} contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#C8922A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Jewelry pie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gem className="h-4 w-4 text-primary" />
            Répartition des bijoux par type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={jewelryByType} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {jewelryByType.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
