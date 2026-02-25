"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, Eye, ToggleLeft, ToggleRight, X, Save, Gem } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/lib/hooks/use-auth"
import { useJewelry, type Jewelry } from "@/lib/hooks/use-jewelry"
import { formatPrice, formatWeight } from "@/lib/utils/format"
import { JEWELRY_TYPES, PURITY_OPTIONS, LOCATIONS, JEWELRY_TYPE_LABELS } from "@/lib/services/jewelry.service"
import { Providers } from "@/app/providers"
import Link from "next/link"

const STATUS_BADGE = {
  available: { label: "Disponible", class: "bg-green-100 text-green-800 border-green-200" },
  unavailable: { label: "Indisponible", class: "bg-orange-100 text-orange-800 border-orange-200" },
}

function JewelryEditSheet({
  jewelry,
  open,
  onClose,
  onSave,
}: {
  jewelry: Jewelry | null
  open: boolean
  onClose: () => void
  onSave: (id: string, data: any) => Promise<void>
}) {
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (jewelry) {
      setForm({
        title: jewelry.title,
        description: jewelry.description,
        type: jewelry.type,
        purity: jewelry.purity,
        weight: jewelry.weight,
        estimatedValue: jewelry.estimatedValue,
        location: jewelry.location,
        rentPricePerDay: jewelry.rentPricePerDay ?? "",
        salePrice: jewelry.salePrice ?? "",
        listingTypes: jewelry.listingTypes ?? [],
        available: jewelry.available,
      })
    }
  }, [jewelry])

  const toggle = (v: string) =>
    setForm((p: any) => ({
      ...p,
      listingTypes: p.listingTypes.includes(v)
        ? p.listingTypes.filter((t: string) => t !== v)
        : [...p.listingTypes, v],
    }))

  const handleSave = async () => {
    if (!jewelry) return
    setSaving(true)
    try {
      await onSave(jewelry.id, {
        ...form,
        weight: parseFloat(form.weight),
        estimatedValue: parseFloat(form.estimatedValue),
        rentPricePerDay: form.rentPricePerDay ? parseFloat(form.rentPricePerDay) : undefined,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-primary" />
            Modifier l'annonce
          </SheetTitle>
          <SheetDescription>
            Modifiez les informations de votre bijou
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={form.title || ""}
              onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description || ""}
              onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p: any) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JEWELRY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Pureté</Label>
              <Select value={form.purity} onValueChange={(v) => setForm((p: any) => ({ ...p, purity: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PURITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Poids (g)</Label>
              <Input
                type="number"
                value={form.weight || ""}
                onChange={(e) => setForm((p: any) => ({ ...p, weight: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valeur estimée (€)</Label>
              <Input
                type="number"
                value={form.estimatedValue || ""}
                onChange={(e) => setForm((p: any) => ({ ...p, estimatedValue: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Localisation</Label>
            <Select value={form.location} onValueChange={(v) => setForm((p: any) => ({ ...p, location: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type d'annonce</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rent"
                  checked={form.listingTypes?.includes("RENT")}
                  onCheckedChange={() => toggle("RENT")}
                />
                <label htmlFor="rent" className="text-sm">Location</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sale"
                  checked={form.listingTypes?.includes("SALE")}
                  onCheckedChange={() => toggle("SALE")}
                />
                <label htmlFor="sale" className="text-sm">Vente</label>
              </div>
            </div>
          </div>

          {form.listingTypes?.includes("RENT") && (
            <div className="space-y-1.5">
              <Label>Prix location/jour (€)</Label>
              <Input
                type="number"
                value={form.rentPricePerDay || ""}
                onChange={(e) => setForm((p: any) => ({ ...p, rentPricePerDay: e.target.value }))}
              />
            </div>
          )}

          {form.listingTypes?.includes("SALE") && (
            <div className="space-y-1.5">
              <Label>Prix de vente (€)</Label>
              <Input
                type="number"
                value={form.salePrice || ""}
                onChange={(e) => setForm((p: any) => ({ ...p, salePrice: e.target.value }))}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="available"
              checked={form.available}
              onCheckedChange={(c) => setForm((p: any) => ({ ...p, available: !!c }))}
            />
            <label htmlFor="available" className="text-sm font-medium">
              Bijou disponible
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gold-button text-white border-0"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button variant="outline" onClick={onClose} className="bg-transparent">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function ListingsPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { jewelry, loading, list, update, delete: deleteJewelry } = useJewelry()
  const [editItem, setEditItem] = useState<Jewelry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser) {
      list({ ownerId: currentUser.id } as any)
    }
  }, [currentUser, list])

  if (authLoading) return null

  if (!currentUser) {
    router.push("/login")
    return null
  }

  const handleSave = async (id: string, data: any) => {
    await update(id, data)
  }

  const handleToggleAvailable = async (item: Jewelry) => {
    await update(item.id, { available: !item.available })
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteJewelry(deleteId)
    setDeleteId(null)
  }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-1">Mes annonces</h1>
                <p className="text-muted-foreground">
                  {jewelry.length} bijou{jewelry.length !== 1 ? "x" : ""} en ligne
                </p>
              </div>
              <Button asChild className="gold-button text-white border-0">
                <Link href="/jewelry/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle annonce
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24 text-muted-foreground">
                Chargement...
              </div>
            ) : jewelry.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
                <Gem className="h-12 w-12 opacity-20" />
                <p className="text-lg">Aucune annonce pour le moment</p>
                <Button asChild>
                  <Link href="/jewelry/new">Créer ma première annonce</Link>
                </Button>
              </div>
            ) : (
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
                        {/* Bijou info */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border"
                              style={{ background: "var(--muted)" }}
                            >
                              {item.images[0] ? (
                                <img
                                  src={item.images[0]}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                />
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

                        {/* Type / Pureté */}
                        <TableCell>
                          <p className="text-sm">{JEWELRY_TYPE_LABELS[item.type] ?? item.type}</p>
                          <p className="text-xs text-muted-foreground">{item.purity} • {formatWeight(item.weight)}</p>
                        </TableCell>

                        {/* Prix */}
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

                        {/* Statut */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${item.available ? STATUS_BADGE.available.class : STATUS_BADGE.unavailable.class}`}
                          >
                            {item.available ? "Disponible" : "Indisponible"}
                          </Badge>
                        </TableCell>

                        {/* Vues */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            {item.views}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title={item.available ? "Marquer indisponible" : "Marquer disponible"}
                              onClick={() => handleToggleAvailable(item)}
                              className="h-8 w-8"
                            >
                              {item.available ? (
                                <ToggleRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Voir"
                              asChild
                              className="h-8 w-8"
                            >
                              <Link href={`/jewelry/${item.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Modifier"
                              onClick={() => setEditItem(item)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Supprimer"
                              onClick={() => setDeleteId(item.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Edit Sheet */}
      <JewelryEditSheet
        jewelry={editItem}
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={handleSave}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'annonce ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'annonce sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Providers>
  )
}
