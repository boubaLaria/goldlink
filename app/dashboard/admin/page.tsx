"use client"

import { useEffect, useState } from "react"
import { Shield } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminOverviewTab } from "@/components/admin/admin-overview-tab"
import { toast } from "sonner"
import { AdminUsersTab } from "@/components/admin/admin-users-tab"
import { AdminJewelryTab } from "@/components/admin/admin-jewelry-tab"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

type UserRow = {
  id: string; email: string; firstName: string; lastName: string
  role: "BUYER" | "SELLER" | "JEWELER" | "ADMIN"
  verified: boolean; country: string; rating: number; createdAt: string
  _count: { ownedJewelry: number; rentalBookingsAsRenter: number }
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [jewelry, setJewelry] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user?.role === "ADMIN") fetchAll()
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
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  async function changeRole(id: string, role: string) {
    try {
      await apiClient.patch(`/api/users/${id}`, { role })
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: role as UserRow["role"] } : u)))
      toast.success(`Rôle changé en ${role}`)
    } catch { toast.error("Erreur lors du changement de rôle.") }
  }

  async function toggleVerified(id: string, verified: boolean) {
    try {
      await apiClient.patch(`/api/users/${id}`, { verified: !verified })
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, verified: !verified } : u)))
      toast.success(verified ? "Vérification révoquée" : "Utilisateur vérifié")
    } catch { toast.error("Erreur lors de la mise à jour.") }
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Supprimer définitivement l'utilisateur ${email} ?`)) return
    try {
      await apiClient.delete(`/api/users/${id}`)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      toast.success(`Utilisateur ${email} supprimé`)
    } catch { toast.error("Erreur lors de la suppression.") }
  }

  if (authLoading || loading) {
    return <DashboardSkeleton />
  }

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
        <TabsContent value="overview">
          <AdminOverviewTab users={users} bookings={bookings} jewelry={jewelry} />
        </TabsContent>
        <TabsContent value="users">
          <AdminUsersTab
            users={users}
            currentUserId={user?.id ?? ""}
            onChangeRole={changeRole}
            onToggleVerified={toggleVerified}
            onDeleteUser={deleteUser}
          />
        </TabsContent>
        <TabsContent value="jewelry">
          <AdminJewelryTab jewelry={jewelry} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
