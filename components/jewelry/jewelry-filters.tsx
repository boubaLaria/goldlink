"use client"

import { useState } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { formatPrice } from "@/lib/utils/format"

interface JewelryFiltersProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: any) => void
}

export function JewelryFilters({ onSearch, onFilterChange }: JewelryFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [type, setType] = useState<string>("")
  const [purity, setPurity] = useState<string>("")
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [location, setLocation] = useState<string>("")

  const handleSearch = () => {
    onSearch(searchQuery)
  }

  const handleApplyFilters = () => {
    onFilterChange({
      type: type || undefined,
      purity: purity ? Number.parseInt(purity) : undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      location: location || undefined,
    })
  }

  const handleReset = () => {
    setType("")
    setPurity("")
    setPriceRange([0, 100000])
    setLocation("")
    onFilterChange({})
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des bijoux..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Rechercher</Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label>Type de bijou</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="necklace">Collier</SelectItem>
                    <SelectItem value="bracelet">Bracelet</SelectItem>
                    <SelectItem value="ring">Bague</SelectItem>
                    <SelectItem value="earrings">Boucles d'oreilles</SelectItem>
                    <SelectItem value="pendant">Pendentif</SelectItem>
                    <SelectItem value="chain">Chaîne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pureté</Label>
                <Select value={purity} onValueChange={setPurity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes puretés" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes puretés</SelectItem>
                    <SelectItem value="18">18K</SelectItem>
                    <SelectItem value="22">22K</SelectItem>
                    <SelectItem value="24">24K</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Localisation</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les villes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    <SelectItem value="Casablanca">Casablanca</SelectItem>
                    <SelectItem value="Marrakech">Marrakech</SelectItem>
                    <SelectItem value="Rabat">Rabat</SelectItem>
                    <SelectItem value="Fès">Fès</SelectItem>
                    <SelectItem value="Tanger">Tanger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Prix (MAD)</Label>
                <Slider value={priceRange} onValueChange={setPriceRange} max={100000} step={1000} className="mt-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleApplyFilters} className="flex-1">
                  Appliquer
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent">
                  Réinitialiser
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
