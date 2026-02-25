"use client"

import { useRouter } from "next/navigation"
import { Users, Package, Calendar, DollarSign, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { StatCard } from "@/components/ui/stat-card"
import { useStore } from "@/lib/store"
import { formatPrice } from "@/lib/utils/format"
import { Providers } from "../providers"

export default function AdminPage() {
  const router = useRouter()
  const { currentUser, users, jewelry, bookings, transactions } = useStore()

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <Providers>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Card className="p-8 max-w-md text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-4">Accès refusé</h2>
              <p className="text-muted-foreground mb-6">Vous n'avez pas les permissions pour accéder à cette page</p>
              <button onClick={() => router.push("/")} className="text-primary hover:underline">
                Retour à l'accueil
              </button>
            </Card>
          </main>
          <Footer />
        </div>
      </Providers>
    )
  }

  const totalRevenue = transactions.filter((t) => t.status === "completed").reduce((sum, t) => sum + t.amount, 0)

  const totalCommissions = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.commission, 0)

  const activeBookings = bookings.filter((b) => b.status === "active" || b.status === "confirmed").length

  const verifiedUsers = users.filter((u) => u.verified).length
  const jewelers = users.filter((u) => u.role === "jeweler").length

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Administration</h1>
              <p className="text-muted-foreground">Gérez la plateforme GoldLink</p>
            </div>

            {/* Stats Overview */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Utilisateurs totaux"
                value={users.length}
                icon={Users}
                description={`${verifiedUsers} vérifiés`}
              />
              <StatCard title="Bijoux en ligne" value={jewelry.length} icon={Package} description="Toutes catégories" />
              <StatCard
                title="Réservations actives"
                value={activeBookings}
                icon={Calendar}
                description={`${bookings.length} au total`}
              />
              <StatCard
                title="Revenus plateforme"
                value={formatPrice(totalCommissions)}
                icon={DollarSign}
                description="Commissions"
              />
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                <TabsTrigger value="jewelry">Bijoux</TabsTrigger>
                <TabsTrigger value="bookings">Réservations</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistiques financières</CardTitle>
                      <CardDescription>Aperçu des revenus de la plateforme</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Volume total</span>
                        <span className="font-semibold text-lg">{formatPrice(totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Commissions (10%)</span>
                        <span className="font-semibold text-lg text-green-600">{formatPrice(totalCommissions)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Transactions</span>
                        <span className="font-semibold">{transactions.length}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Activité utilisateurs</CardTitle>
                      <CardDescription>Répartition des rôles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Acheteurs/Locataires</span>
                        <span className="font-semibold">{users.filter((u) => u.role === "buyer").length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Vendeurs/Propriétaires</span>
                        <span className="font-semibold">{users.filter((u) => u.role === "seller").length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Bijoutiers</span>
                        <span className="font-semibold">{jewelers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Administrateurs</span>
                        <span className="font-semibold">{users.filter((u) => u.role === "admin").length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Activité récente</CardTitle>
                    <CardDescription>Dernières transactions sur la plateforme</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transactions.slice(0, 10).map((transaction) => {
                        const buyer = users.find((u) => u.id === transaction.buyerId)
                        const seller = users.find((u) => u.id === transaction.sellerId)
                        return (
                          <div key={transaction.id} className="flex items-center justify-between py-3 border-b">
                            <div>
                              <p className="font-medium">
                                {buyer?.firstName} {buyer?.lastName} → {seller?.firstName} {seller?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.type === "rent" ? "Location" : "Vente"} •{" "}
                                {transaction.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(transaction.amount)}</p>
                              <p className="text-sm text-green-600">+{formatPrice(transaction.commission)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestion des utilisateurs</CardTitle>
                    <CardDescription>Liste de tous les utilisateurs de la plateforme</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between py-3 border-b">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-semibold text-primary">
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm capitalize px-3 py-1 rounded-full bg-muted">{user.role}</span>
                            {user.verified ? (
                              <span className="text-sm text-green-600">Vérifié</span>
                            ) : (
                              <span className="text-sm text-yellow-600">Non vérifié</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="jewelry">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestion des bijoux</CardTitle>
                    <CardDescription>Tous les bijoux listés sur la plateforme</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {jewelry.map((item) => {
                        const owner = users.find((u) => u.id === item.ownerId)
                        return (
                          <div key={item.id} className="flex items-center justify-between py-3 border-b">
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted">
                                <img
                                  src={item.images[0] || "/placeholder.svg"}
                                  alt={item.title}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  Par {owner?.firstName} {owner?.lastName}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(item.estimatedValue)}</p>
                              <p className="text-sm text-muted-foreground">{item.views} vues</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestion des réservations</CardTitle>
                    <CardDescription>Toutes les réservations sur la plateforme</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {bookings.map((booking) => {
                        const item = jewelry.find((j) => j.id === booking.jewelryId)
                        const renter = users.find((u) => u.id === booking.renterId)
                        const owner = users.find((u) => u.id === booking.ownerId)

                        const statusColors = {
                          pending: "bg-yellow-500/10 text-yellow-700",
                          confirmed: "bg-blue-500/10 text-blue-700",
                          active: "bg-green-500/10 text-green-700",
                          completed: "bg-gray-500/10 text-gray-700",
                          cancelled: "bg-red-500/10 text-red-700",
                        }

                        return (
                          <div key={booking.id} className="flex items-center justify-between py-3 border-b">
                            <div>
                              <p className="font-medium">{item?.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {renter?.firstName} {renter?.lastName} → {owner?.firstName} {owner?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {booking.startDate.toLocaleDateString()} - {booking.endDate.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(booking.totalPrice)}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>Historique des transactions</CardTitle>
                    <CardDescription>Toutes les transactions financières</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transactions.map((transaction) => {
                        const buyer = users.find((u) => u.id === transaction.buyerId)
                        const seller = users.find((u) => u.id === transaction.sellerId)

                        return (
                          <div key={transaction.id} className="flex items-center justify-between py-3 border-b">
                            <div>
                              <p className="font-medium">
                                {buyer?.firstName} {buyer?.lastName} → {seller?.firstName} {seller?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.type === "rent" ? "Location" : "Vente"} •{" "}
                                {transaction.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(transaction.amount)}</p>
                              <p className="text-sm text-green-600">
                                Commission: {formatPrice(transaction.commission)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
