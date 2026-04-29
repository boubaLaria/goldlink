"use client"

import { useState, useEffect } from "react"
import { MapPin, Star, Gem, X, Shield } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { JewelryGrid } from "@/components/jewelry/jewelry-grid"
import { JewelryGridSkeleton } from "@/components/jewelry/jewelry-card-skeleton"
import { JewelryFilters } from "@/components/jewelry/jewelry-filters"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useJewelry } from "@/lib/hooks/use-jewelry"
import { apiClient } from "@/lib/api-client"
import { Providers } from "../providers"

const PURITY_MAP: Record<string, number> = {
  K8: 8, K10: 10, K14: 14, K18: 18, K22: 22, K24: 24,
}

function normalizeJewelry(item: any) {
  return {
    ...item,
    purity: PURITY_MAP[item.purity] ?? 18,
    listingType: (item.listingTypes || []).map((t: string) => t.toLowerCase()),
    type: item.type?.toLowerCase() ?? "",
    createdAt: new Date(item.createdAt),
  }
}

const ROLE_LABELS: Record<string, string> = {
  SELLER: "Vendeur",
  JEWELER: "Bijoutier",
}

type Seller = {
  id: string
  firstName: string
  lastName: string
  role: string
  avatar: string | null
  verified: boolean
  rating: number
  address: string | null
  _count: { ownedJewelry: number }
}

function SellerCard({
  seller,
  active,
  onClick,
}: {
  seller: Seller
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center w-36 shrink-0"
      style={{
        borderColor: active ? "var(--primary)" : "var(--border)",
        background: active ? "var(--accent)" : "var(--card)",
      }}
    >
      <div className="relative">
        <Avatar className="h-14 w-14">
          <AvatarImage src={seller.avatar || ""} />
          <AvatarFallback
            className="text-sm font-bold"
            style={{ background: "var(--secondary)", color: "var(--primary)" }}
          >
            {seller.firstName[0]}{seller.lastName[0]}
          </AvatarFallback>
        </Avatar>
        {seller.verified && (
          <div
            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white"
            style={{ background: "var(--primary)" }}
          >
            <Shield className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold leading-tight">
          {seller.firstName}
        </p>
        <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[seller.role] ?? seller.role}</p>
      </div>
      <div className="flex items-center gap-1">
        {seller.rating > 0 && (
          <span className="flex items-center gap-0.5 text-[10px]">
            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
            {seller.rating.toFixed(1)}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">
          · {seller._count.ownedJewelry} bijou{seller._count.ownedJewelry !== 1 ? "x" : ""}
        </span>
      </div>
      {active && (
        <Badge
          className="text-[10px] h-4 px-1.5"
          style={{ background: "var(--primary)", color: "white" }}
        >
          Sélectionné
        </Badge>
      )}
    </button>
  )
}

export default function CatalogPage() {
  const { jewelry, loading, list } = useJewelry()
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<any>({})
  const [sellers, setSellers] = useState<Seller[]>([])
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null)

  // Fetch sellers once
  useEffect(() => {
    apiClient.get("/api/sellers")
      .then((res) => setSellers(res.data ?? []))
      .catch(() => {})
  }, [])

  // Fetch jewelry whenever filters/seller change
  useEffect(() => {
    const params: any = {}
    if (searchQuery) params.search = searchQuery
    if (filters.type && filters.type !== "all") params.type = filters.type.toUpperCase()
    if (filters.purity) params.purity = `K${filters.purity}`
    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice
    if (filters.location && filters.location !== "all") params.location = filters.location
    if (selectedSeller) params.ownerId = selectedSeller
    list(params)
  }, [searchQuery, filters, selectedSeller, list])

  const normalizedJewelry = jewelry.map(normalizeJewelry)
  const selectedSellerInfo = sellers.find((s) => s.id === selectedSeller)

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            {/* Page title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Catalogue de Bijoux</h1>
              <p className="text-muted-foreground">
                Découvrez notre sélection de bijoux en or disponibles à la location ou à la vente
              </p>
            </div>

            {/* Sellers section */}
            {sellers.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Gem className="h-5 w-5 text-primary" />
                    Nos vendeurs
                  </h2>
                  {selectedSeller && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSeller(null)}
                      className="text-muted-foreground gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      Voir tout
                    </Button>
                  )}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {sellers.map((seller) => (
                    <SellerCard
                      key={seller.id}
                      seller={seller}
                      active={selectedSeller === seller.id}
                      onClick={() =>
                        setSelectedSeller(selectedSeller === seller.id ? null : seller.id)
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active seller banner */}
            {selectedSellerInfo && (
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-3 mb-6"
                style={{ background: "var(--accent)", border: "1px solid var(--border)" }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedSellerInfo.avatar || ""} />
                  <AvatarFallback style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                    {selectedSellerInfo.firstName[0]}{selectedSellerInfo.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Bijoux de <span style={{ color: "var(--primary)" }}>
                      {selectedSellerInfo.firstName} {selectedSellerInfo.lastName}
                    </span>
                  </p>
                  {selectedSellerInfo.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {selectedSellerInfo.address}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSelectedSeller(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Filters */}
            <div className="mb-6">
              <JewelryFilters onSearch={setSearchQuery} onFilterChange={setFilters} />
            </div>

            {/* Result count */}
            {!loading && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {normalizedJewelry.length} bijou{normalizedJewelry.length !== 1 ? "x" : ""} trouvé{normalizedJewelry.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {loading
              ? <JewelryGridSkeleton count={8} />
              : <JewelryGrid items={normalizedJewelry as any} emptyMessage="Aucun bijou ne correspond à vos critères" />
            }
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
