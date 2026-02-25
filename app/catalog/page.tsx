"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { JewelryGrid } from "@/components/jewelry/jewelry-grid"
import { JewelryFilters } from "@/components/jewelry/jewelry-filters"
import { useJewelry } from "@/lib/hooks/use-jewelry"
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

export default function CatalogPage() {
  const { jewelry, loading, list } = useJewelry()
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    const params: any = {}
    if (searchQuery) params.search = searchQuery
    if (filters.type && filters.type !== "all") params.type = filters.type.toUpperCase()
    if (filters.purity) params.purity = `K${filters.purity}`
    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice
    if (filters.location && filters.location !== "all") params.location = filters.location
    list(params)
  }, [searchQuery, filters, list])

  const normalizedJewelry = jewelry.map(normalizeJewelry)

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Catalogue de Bijoux</h1>
              <p className="text-muted-foreground">
                Découvrez notre sélection de bijoux en or disponibles à la location ou à la vente
              </p>
            </div>

            <div className="mb-8">
              <JewelryFilters onSearch={setSearchQuery} onFilterChange={setFilters} />
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Chargement..."
                  : `${normalizedJewelry.length} bijou${normalizedJewelry.length > 1 ? "x" : ""} trouvé${normalizedJewelry.length > 1 ? "s" : ""}`}
              </p>
            </div>

            <JewelryGrid items={normalizedJewelry as any} emptyMessage="Aucun bijou ne correspond à vos critères" />
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
