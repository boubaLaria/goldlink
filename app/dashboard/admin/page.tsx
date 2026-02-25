"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Trash2, UserCheck, UserX, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  ADMIN: "bg-red-100 text-red-800",
  SELLER: "bg-blue-100 text-blue-800",
  JEWELER: "bg-purple-100 text-purple-800",
  BUYER: "bg-green-100 text-green-800",
}

const ROLES = ["BUYER", "SELLER", "JEWELER", "ADMIN"] as const

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.role !== "ADMIN") {
      router.replace("/dashboard")
      return
    }
    fetchUsers()
  }, [user, authLoading])

  async function fetchUsers() {
    try {
      const res = await apiClient.get("/api/users")
      setUsers(res.data)
    } catch {
      // silently fail; could add a toast here
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Panel Administration</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Utilisateurs total</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Vendeurs / Bijoutiers</p>
          <p className="text-2xl font-bold">
            {users.filter((u) => u.role === "SELLER" || u.role === "JEWELER").length}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Non vérifiés</p>
          <p className="text-2xl font-bold">{users.filter((u) => !u.verified).length}</p>
        </div>
      </div>

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
                    <p className="font-medium">
                      {u.firstName} {u.lastName}
                    </p>
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
                          title={u.verified ? "Révoquer la vérification" : "Vérifier"}
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
    </div>
  )
}
