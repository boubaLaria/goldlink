"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, Users, Gem, Calendar,
  LogOut, ChevronRight, ArrowLeft, Settings,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Providers } from "@/app/providers"

const NAV = [
  { href: "/dashboard/admin",            label: "Vue d'ensemble",   icon: LayoutDashboard },
  { href: "/dashboard/admin/users",      label: "Utilisateurs",     icon: Users },
  { href: "/catalog",                    label: "Bijoux",            icon: Gem },
  { href: "/dashboard/bookings",         label: "Réservations",      icon: Calendar },
  { href: "/settings",                   label: "Paramètres",        icon: Settings },
]

function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside
      className="admin-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto"
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: "var(--sidebar-primary)" }}
        >
          <Gem className="h-5 w-5" style={{ color: "var(--sidebar-primary-foreground)" }} />
        </div>
        <div>
          <p
            className="text-sm font-bold leading-none"
            style={{ color: "var(--sidebar-foreground)" }}
          >
            GoldLink
          </p>
          <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--sidebar-primary)" }}>
            Administration
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p
          className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--sidebar-primary)", opacity: 0.6 }}
        >
          Menu
        </p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
              style={{
                background: active ? "var(--sidebar-accent)" : "transparent",
                color: active
                  ? "var(--sidebar-primary)"
                  : "var(--sidebar-foreground)",
                opacity: active ? 1 : 0.65,
              }}
              onMouseEnter={(e) =>
                !active && (e.currentTarget.style.opacity = "1")
              }
              onMouseLeave={(e) =>
                !active && (e.currentTarget.style.opacity = "0.65")
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight
                  className="h-3.5 w-3.5"
                  style={{ color: "var(--sidebar-primary)" }}
                />
              )}
            </Link>
          )
        })}

        <div
          className="my-3"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        />

        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
          style={{ color: "var(--sidebar-foreground)", opacity: 0.5 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Retour à la plateforme
        </Link>
      </nav>

      {/* User footer */}
      {user && (
        <div
          className="px-3 pb-4"
          style={{ borderTop: "1px solid var(--sidebar-border)" }}
        >
          <div className="flex items-center gap-3 rounded-lg px-3 py-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback
                className="text-xs font-semibold"
                style={{
                  background: "var(--sidebar-accent)",
                  color: "var(--sidebar-primary)",
                }}
              >
                {user.firstName[0]}
                {user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p
                className="truncate text-xs font-semibold"
                style={{ color: "var(--sidebar-foreground)" }}
              >
                {user.firstName} {user.lastName}
              </p>
              <p
                className="text-[11px]"
                style={{ color: "var(--sidebar-primary)" }}
              >
                Administrateur
              </p>
            </div>
            <button
              onClick={logout}
              title="Se déconnecter"
              className="rounded-md p-1.5 transition-colors"
              style={{ color: "var(--sidebar-foreground)", opacity: 0.5 }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "0.5")
              }
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/dashboard")
    }
  }, [user, loading])

  if (loading || !user) return null

  const current = NAV.find((n) => n.href === pathname)

  return (
    <Providers>
      <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
        <AdminSidebar />

        {/* Main area */}
        <div className="ml-64 flex flex-1 flex-col min-h-screen">
          {/* Top bar */}
          <header
            className="sticky top-0 z-40 flex h-14 items-center justify-between px-8"
            style={{
              background: "var(--background)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Administration
              </span>
              {current && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">{current.label}</span>
                </>
              )}
            </div>
            <div
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: "var(--accent)",
                color: "var(--primary)",
              }}
            >
              ADMIN
            </div>
          </header>

          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </Providers>
  )
}
