import type { Jewelry } from "@/lib/types"
import { JewelryCard } from "./jewelry-card"

interface JewelryGridProps {
  items: Jewelry[]
  emptyMessage?: string
}

export function JewelryGrid({ items, emptyMessage = "Aucun bijou trouvé" }: JewelryGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <JewelryCard key={item.id} jewelry={item} />
      ))}
    </div>
  )
}
