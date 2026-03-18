"use client"

import { Trash2, UserCheck, UserX, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
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
  ADMIN:   "bg-red-100 text-red-800",
  SELLER:  "bg-blue-100 text-blue-800",
  JEWELER: "bg-purple-100 text-purple-800",
  BUYER:   "bg-green-100 text-green-800",
}

const ROLES = ["BUYER", "SELLER", "JEWELER", "ADMIN"] as const

interface AdminUsersTabProps {
  users: UserRow[]
  currentUserId: string
  onChangeRole: (id: string, role: string) => void
  onToggleVerified: (id: string, verified: boolean) => void
  onDeleteUser: (id: string, email: string) => void
}

export function AdminUsersTab({
  users, currentUserId, onChangeRole, onToggleVerified, onDeleteUser,
}: AdminUsersTabProps) {
  return (
    <div className="rounded-lg border overflow-x-auto">
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
                      {u.id !== currentUserId && <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </DropdownMenuTrigger>
                  {u.id !== currentUserId && (
                    <DropdownMenuContent align="start">
                      {ROLES.map((r) => (
                        <DropdownMenuItem key={r} onClick={() => onChangeRole(u.id, r)}
                          className={u.role === r ? "font-semibold" : ""}>
                          {r}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              </TableCell>

              <TableCell>
                {u.verified
                  ? <Badge variant="outline" className="text-green-700 border-green-300">Oui</Badge>
                  : <Badge variant="outline" className="text-orange-700 border-orange-300">Non</Badge>
                }
              </TableCell>

              <TableCell>{u._count.ownedJewelry}</TableCell>
              <TableCell>{u._count.rentalBookingsAsRenter}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(u.createdAt).toLocaleDateString("fr-FR")}
              </TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {u.id !== currentUserId && (
                    <>
                      <Button variant="ghost" size="icon" title={u.verified ? "Révoquer" : "Vérifier"}
                        onClick={() => onToggleVerified(u.id, u.verified)}>
                        {u.verified
                          ? <UserX className="h-4 w-4 text-orange-500" />
                          : <UserCheck className="h-4 w-4 text-green-500" />
                        }
                      </Button>
                      <Button variant="ghost" size="icon" title="Supprimer"
                        onClick={() => onDeleteUser(u.id, u.email)}>
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
  )
}
