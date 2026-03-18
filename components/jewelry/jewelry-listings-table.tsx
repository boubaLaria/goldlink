"use client"

import { Eye, Edit2, Trash2, ToggleLeft, ToggleRight, Gem, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import type { Jewelry } from "@/lib/hooks/use-jewelry"
import { formatPrice, formatWeight } from "@/lib/utils/format"
import { JEWELRY_TYPE_LABELS } from "@/lib/services/jewelry.service"

const STATUS_BADGE = {
  available:   { label: "Disponible",   class: "bg-green-100 text-green-800 border-green-200" },
  unavailable: { label: "Indisponible", class: "bg-orange-100 text-orange-800 border-orange-200" },
}

interface JewelryListingsTableProps {
  jewelry: Jewelry[]
  onEdit: (item: Jewelry) => void
  onDelete: (id: string) => void
  onToggleAvailable: (item: Jewelry) => void
}

export function JewelryListingsTable({ jewelry, onEdit, onDelete, onToggleAvailable }: JewelryListingsTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bijou</TableHead>
            <TableHead>Type / Pureté</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-center">Vues</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jewelry.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border" style={{ background: "var(--muted)" }}>
                    {item.images[0] ? (
                      <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Gem className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.location}</p>
                    <div className="flex gap-1 mt-1">
                      {item.listingTypes.includes("RENT") && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium"
                          style={{ background: "var(--accent)", color: "var(--primary)" }}>
                          Location
                        </span>
                      )}
                      {item.listingTypes.includes("SALE") && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium"
                          style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}>
                          Vente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <p className="text-sm">{JEWELRY_TYPE_LABELS[item.type] ?? item.type}</p>
                <p className="text-xs text-muted-foreground">{item.purity} • {formatWeight(item.weight)}</p>
              </TableCell>

              <TableCell>
                {item.rentPricePerDay && (
                  <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                    {formatPrice(item.rentPricePerDay)}/j
                  </p>
                )}
                {item.salePrice && (
                  <p className="text-xs text-muted-foreground">{formatPrice(item.salePrice)}</p>
                )}
              </TableCell>

              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant="outline"
                    className={`text-xs w-fit ${item.available ? STATUS_BADGE.available.class : STATUS_BADGE.unavailable.class}`}>
                    {item.available ? "Disponible" : "Indisponible"}
                  </Badge>
                  {item.tryOnAvailable && (
                    <Badge className="text-[10px] bg-violet-100 text-violet-700 border-violet-200 w-fit flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      Try-on
                    </Badge>
                  )}
                </div>
              </TableCell>

              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  {item.views}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    title={item.available ? "Marquer indisponible" : "Marquer disponible"}
                    onClick={() => onToggleAvailable(item)}>
                    {item.available
                      ? <ToggleRight className="h-4 w-4 text-green-600" />
                      : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    }
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir" asChild>
                    <Link href={`/jewelry/${item.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier"
                    onClick={() => onEdit(item)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                    title="Supprimer" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
