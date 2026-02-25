"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Gem, Menu, Plus, MessageSquare, Settings, LogOut, LayoutDashboard, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/hooks/use-auth"

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  SELLER: "Vendeur",
  JEWELER: "Bijoutier",
  BUYER: "Acheteur",
}

export function Header() {
  const pathname = usePathname()
  const { user: currentUser, loading, logout } = useAuth()

  const navigation = [
    { name: "Catalogue", href: "/catalog" },
    { name: "Essayage Virtuel", href: "/virtual-tryon" },
    { name: "Estimation", href: "/estimation" },
    { name: "Comment ça marche", href: "/how-it-works" },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <header
      className="sticky top-0 z-50 w-full backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                style={{ background: "var(--primary)" }}
              >
                <Gem className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                Gold<span style={{ color: "var(--primary)" }}>Link</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    color: isActive(item.href) ? "var(--primary)" : "var(--muted-foreground)",
                    background: isActive(item.href) ? "var(--accent)" : "transparent",
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {loading ? null : currentUser ? (
              <>
                {["SELLER", "JEWELER", "ADMIN"].includes(currentUser.role) && (
                  <Button
                    asChild
                    size="sm"
                    className="hidden sm:flex gap-1.5 gold-button text-white border-0"
                  >
                    <Link href="/jewelry/new">
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </Link>
                  </Button>
                )}

                <Button asChild variant="ghost" size="icon">
                  <Link href="/messages">
                    <MessageSquare className="h-4.5 w-4.5" />
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-colors hover:bg-accent">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={currentUser.avatar || ""} alt={currentUser.firstName} />
                        <AvatarFallback
                          className="text-xs font-semibold"
                          style={{ background: "var(--secondary)", color: "var(--primary)" }}
                        >
                          {currentUser.firstName[0]}
                          {currentUser.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium">
                        {currentUser.firstName}
                      </span>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>{currentUser.firstName} {currentUser.lastName}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5"
                        style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
                      >
                        {ROLE_LABEL[currentUser.role] ?? currentUser.role}
                      </Badge>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Tableau de bord
                      </Link>
                    </DropdownMenuItem>

                    {currentUser.role === "ADMIN" && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/admin" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" style={{ color: "var(--primary)" }} />
                          Panel Admin
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={logout}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="gold-button text-white border-0"
                >
                  <Link href="/register">Inscription</Link>
                </Button>
              </>
            )}

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex items-center gap-2 mb-6">
                  <Gem className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">GoldLink</span>
                </div>
                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                      style={{
                        color: isActive(item.href) ? "var(--primary)" : "var(--muted-foreground)",
                        background: isActive(item.href) ? "var(--accent)" : "transparent",
                      }}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
