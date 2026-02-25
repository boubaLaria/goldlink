"use client"

import { useEffect, useState } from "react"
import {
  Shield, Trash2, UserCheck, UserX, ChevronDown,
  TrendingUp, Users, Gem, Calendar, DollarSign,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts"
import { formatPrice } from "@/lib/utils/format"

type UserRow = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "BUYER" | "SELLER" | "JEWELER" | "ADMIN"
  verified: boolean
  country: string
  rating: number
  createdAt: string
  _count: { ownedJewelry: number; rentalBookingsAsRenter: number }
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN:  "bg-red-100 text-red-800",
  SELLER: "bg-blue-100 text-blue-800",
  JEWELER:"bg-purple-100 text-purple-800",
  BUYER:  "bg-green-100 text-green-800",
}

const ROLES = ["BUYER", "SELLER", "JEWELER", "ADMIN"] as const

// Chart color palette matching gold theme
const CHART_COLORS = ["#C8922A", "#D4AF37", "#8B6914", "#EDCD82", "#5C4A1E"]

// Build monthly revenue data from bookings
function buildMonthlyRevenue(bookings: any[]) {
  const months: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    months[key] = 0
  }
  bookings.forEach((b) => {
    if (b.status !== "COMPLETED") return
    const d = new Date(b.createdAt)
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
    if (diff < 0 || diff > 5) return
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    if (key in months) months[key] += b.totalPrice
  })
  return Object.entries(months).map(([month, revenue]) => ({ month, revenue }))
}

function buildBookingsByMonth(bookings: any[]) {
  const months: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    months[key] = 0
  }
  bookings.forEach((b) => {
    const d = new Date(b.createdAt)
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
    if (diff < 0 || diff > 5) return
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    if (key in months) months[key]++
  })
  return Object.entries(months).map(([month, count]) => ({ month, count }))
}

function buildJewelryByType(jewelry: any[]) {
  const counts: Record<string, number> = {}
  const LABELS: Record<string, string> = {
    NECKLACE: "Collier", BRACELET: "Bracelet", RING: "Bague",
    EARRINGS: "Boucles", PENDANT: "Pendentif", CHAIN: "Chaîne",
  }
  jewelry.forEach((j) => {
    const label = LABELS[j.type] ?? j.type
    counts[label] = (counts[label] ?? 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [jewelry, setJewelry] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user?.role === "ADMIN") {
      fetchAll()
    }
  }, [user, authLoading])

  async function fetchAll() {
    try {
      const [usersRes, bookingsRes, jewelryRes] = await Promise.all([
        apiClient.get("/api/users"),
        apiClient.get("/api/bookings"),
        apiClient.get("/api/jewelry"),
      ])
      setUsers(usersRes.data)
      setBookings(bookingsRes.data ?? [])
      setJewelry(jewelryRes.data ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function changeRole(id: string, role: string) {
    try {
      await apiClient.patch(`/api/users/${id}`, { role })
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: role as UserRow["role"] } : u)))
    } catch {
      alert("Erreur lors du changement de rôle.")
    }
  }

  async function toggleVerified(id: string, verified: boolean) {
    try {
      await apiClient.patch(`/api/users/${id}`, { verified: !verified })
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, verified: !verified } : u)))
    } catch {
      alert("Erreur lors de la mise à jour.")
    }
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Supprimer définitivement l'utilisateur ${email} ?`)) return
    try {
      await apiClient.delete(`/api/users/${id}`)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      alert("Erreur lors de la suppression.")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  const totalRevenue = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((s, b) => s + b.totalPrice, 0)
  const activeBookings = bookings.filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED").length

  const monthlyRevenue = buildMonthlyRevenue(bookings)
  const bookingsByMonth = buildBookingsByMonth(bookings)
  const jewelryByType = buildJewelryByType(jewelry)

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Panel Administration</h1>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs ({users.length})</TabsTrigger>
          <TabsTrigger value="jewelry">Bijoux ({jewelry.length})</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview" className="space-y-6">
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
                <p className="text-xs text-muted-foreground mt-1">
                  {users.filter((u) => !u.verified).length} non vérifiés
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  {bookings.length} au total
                </p>
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
            {/* Revenue line chart */}
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
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="var(--muted-foreground)"
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatPrice(v), "Revenus"]}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#C8922A"
                      strokeWidth={2.5}
                      dot={{ fill: "#C8922A", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bookings bar chart */}
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
                    <Tooltip
                      formatter={(v: number) => [v, "Réservations"]}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#C8922A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Jewelry by type pie */}
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
                  <Pie
                    data={jewelryByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {jewelryByType.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Users Tab ─── */}
        <TabsContent value="users">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Vérifié</TableHead>
                  <TableHead>Bijoux</TableHead>
                  <TableHead>Réservations</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.firstName} {u.lastName}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                              {u.role}
                            </span>
                            {u.id !== user?.id && <ChevronDown className="h-3 w-3" />}
                          </Button>
                        </DropdownMenuTrigger>
                        {u.id !== user?.id && (
                          <DropdownMenuContent align="start">
                            {ROLES.map((r) => (
                              <DropdownMenuItem
                                key={r}
                                onClick={() => changeRole(u.id, r)}
                                className={u.role === r ? "font-semibold" : ""}
                              >
                                {r}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        )}
                      </DropdownMenu>
                    </TableCell>

                    <TableCell>
                      {u.verified ? (
                        <Badge variant="outline" className="text-green-700 border-green-300">Oui</Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-700 border-orange-300">Non</Badge>
                      )}
                    </TableCell>

                    <TableCell>{u._count.ownedJewelry}</TableCell>
                    <TableCell>{u._count.rentalBookingsAsRenter}</TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {u.id !== user?.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title={u.verified ? "Révoquer" : "Vérifier"}
                              onClick={() => toggleVerified(u.id, u.verified)}
                            >
                              {u.verified ? (
                                <UserX className="h-4 w-4 text-orange-500" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Supprimer"
                              onClick={() => deleteUser(u.id, u.email)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ─── Jewelry Tab ─── */}
        <TabsContent value="jewelry">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bijou</TableHead>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Vues</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jewelry.map((j: any) => (
                  <TableRow key={j.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md overflow-hidden border shrink-0">
                          {j.images?.[0] ? (
                            <img src={j.images[0]} alt={j.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                              <Gem className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{j.title}</p>
                          <p className="text-xs text-muted-foreground">{j.type} · {j.purity}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {j.owner?.firstName} {j.owner?.lastName}
                    </TableCell>
                    <TableCell className="text-sm">
                      {j.rentPricePerDay && (
                        <span className="text-primary font-semibold">{formatPrice(j.rentPricePerDay)}/j</span>
                      )}
                      {j.salePrice && (
                        <span className="text-muted-foreground ml-1">{formatPrice(j.salePrice)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{j.views ?? 0}</TableCell>
                    <TableCell className="text-sm">
                      {j.rating > 0 ? `⭐ ${j.rating.toFixed(1)}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={j.available
                          ? "text-green-700 border-green-300 text-xs"
                          : "text-orange-700 border-orange-300 text-xs"
                        }
                      >
                        {j.available ? "Disponible" : "Indisponible"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
