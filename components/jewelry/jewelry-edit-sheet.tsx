"use client"

import { useEffect, useState } from "react"
import { Gem, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { TryOnUploadSection } from "@/components/jewelry/tryon-upload-section"
import { useTryOn, type TryOnUploadResult } from "@/lib/hooks/use-tryon"
import type { Jewelry } from "@/lib/hooks/use-jewelry"
import { JEWELRY_TYPES, PURITY_OPTIONS, LOCATIONS } from "@/lib/services/jewelry.service"

interface JewelryEditSheetProps {
  jewelry: Jewelry | null
  open: boolean
  onClose: () => void
  onSave: (id: string, data: any) => Promise<void>
}

export function JewelryEditSheet({ jewelry, open, onClose, onSave }: JewelryEditSheetProps) {
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [tryOnUploading, setTryOnUploading] = useState(false)
  const [tryOnResult, setTryOnResult] = useState<TryOnUploadResult | null>(null)
  const { uploadTryOnImage } = useTryOn()

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
        tryOnAvailable: jewelry.tryOnAvailable ?? false,
        tryOnType: jewelry.tryOnType ?? "",
        tryOnImageUrl: jewelry.tryOnImageUrl ?? "",
      })
      setTryOnResult(null)
    }
  }, [jewelry])

  const set = (key: string, value: any) =>
    setForm((p: any) => ({ ...p, [key]: value }))

  const toggleListingType = (v: string) =>
    setForm((p: any) => ({
      ...p,
      listingTypes: p.listingTypes.includes(v)
        ? p.listingTypes.filter((t: string) => t !== v)
        : [...p.listingTypes, v],
    }))

  const handleTryOnFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setTryOnUploading(true)
    setTryOnResult(null)
    try {
      const result = await uploadTryOnImage(file, form.tryOnType || undefined)
      setTryOnResult(result)
      if (result.valid && result.url) {
        setForm((p: any) => ({ ...p, tryOnImageUrl: result.url }))
        if (result.detectedType && !result.typeMismatch) {
          setForm((p: any) => ({ ...p, tryOnType: result.detectedType }))
        }
      }
    } finally {
      setTryOnUploading(false)
    }
  }

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
          <SheetDescription>Modifiez les informations de votre bijou</SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
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
              <Select value={form.purity} onValueChange={(v) => set("purity", v)}>
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
              <Input type="number" value={form.weight || ""} onChange={(e) => set("weight", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valeur estimée (€)</Label>
              <Input type="number" value={form.estimatedValue || ""} onChange={(e) => set("estimatedValue", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Localisation</Label>
            <Select value={form.location} onValueChange={(v) => set("location", v)}>
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
              {["RENT", "SALE"].map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={type.toLowerCase()}
                    checked={form.listingTypes?.includes(type)}
                    onCheckedChange={() => toggleListingType(type)}
                  />
                  <label htmlFor={type.toLowerCase()} className="text-sm">
                    {type === "RENT" ? "Location" : "Vente"}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {form.listingTypes?.includes("RENT") && (
            <div className="space-y-1.5">
              <Label>Prix location/jour (€)</Label>
              <Input type="number" value={form.rentPricePerDay || ""} onChange={(e) => set("rentPricePerDay", e.target.value)} />
            </div>
          )}

          {form.listingTypes?.includes("SALE") && (
            <div className="space-y-1.5">
              <Label>Prix de vente (€)</Label>
              <Input type="number" value={form.salePrice || ""} onChange={(e) => set("salePrice", e.target.value)} />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="available"
              checked={form.available}
              onCheckedChange={(c) => set("available", !!c)}
            />
            <label htmlFor="available" className="text-sm font-medium">Bijou disponible</label>
          </div>

          <TryOnUploadSection
            tryOnAvailable={form.tryOnAvailable ?? false}
            tryOnType={form.tryOnType ?? ""}
            tryOnImageUrl={form.tryOnImageUrl ?? ""}
            uploading={tryOnUploading}
            result={tryOnResult}
            onToggle={(v) => set("tryOnAvailable", v)}
            onTypeChange={(v) => { set("tryOnType", v); setTryOnResult(null) }}
            onFileChange={handleTryOnFileChange}
          />

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1 gold-button text-white border-0">
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
