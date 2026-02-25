"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Gem, Menu, Plus, MessageSquare, Settings } from "lucide-react"
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
import { useAuth } from "@/lib/hooks/use-auth"

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Gem className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">GoldLink</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(item.href) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {loading ? null : currentUser ? (
              <>
                {['SELLER', 'JEWELER', 'ADMIN'].includes(currentUser.role) && (
                  <Button asChild variant="outline" size="sm" className="hidden sm:flex bg-transparent">
                    <Link href="/jewelry/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une annonce
                    </Link>
                  </Button>
                )}

                <Button asChild variant="ghost" size="icon" className="relative">
                  <Link href="/messages">
                    <MessageSquare className="h-5 w-5" />
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.firstName} />
                        <AvatarFallback>
                          {currentUser.firstName[0]}
                          {currentUser.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {currentUser.firstName} {currentUser.lastName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Tableau de bord</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/bookings">Mes réservations</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/listings">Mes annonces</Link>
                    </DropdownMenuItem>
                    {currentUser.role === "ADMIN" && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/admin">Panel Admin</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>Se déconnecter</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Inscription</Link>
                </Button>
              </>
            )}

            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        isActive(item.href) ? "text-primary" : "text-muted-foreground"
                      }`}
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
