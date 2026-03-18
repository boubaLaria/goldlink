"use client"

import { Gem } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatPrice } from "@/lib/utils/format"

interface AdminJewelryTabProps {
  jewelry: any[]
}

export function AdminJewelryTab({ jewelry }: AdminJewelryTabProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bijou</TableHead>
            <TableHead>Propriétaire</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Vues</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jewelry.map((j: any) => (
            <TableRow key={j.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md overflow-hidden border shrink-0">
                    {j.images?.[0] ? (
                      <img src={j.images[0]} alt={j.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Gem className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{j.title}</p>
                    <p className="text-xs text-muted-foreground">{j.type} · {j.purity}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm">{j.owner?.firstName} {j.owner?.lastName}</TableCell>
              <TableCell className="text-sm">
                {j.rentPricePerDay && (
                  <span className="text-primary font-semibold">{formatPrice(j.rentPricePerDay)}/j</span>
                )}
                {j.salePrice && (
                  <span className="text-muted-foreground ml-1">{formatPrice(j.salePrice)}</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{j.views ?? 0}</TableCell>
              <TableCell className="text-sm">
                {j.rating > 0 ? `⭐ ${j.rating.toFixed(1)}` : "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline"
                  className={j.available
                    ? "text-green-700 border-green-300 text-xs"
                    : "text-orange-700 border-orange-300 text-xs"
                  }>
                  {j.available ? "Disponible" : "Indisponible"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
