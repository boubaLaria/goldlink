"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Gem, Save, X, Upload, Box, ImagePlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Jewelry } from "@/lib/hooks/use-jewelry"
import { JEWELRY_TYPES, PURITY_OPTIONS, LOCATIONS } from "@/lib/services/jewelry.service"

interface JewelryEditSheetProps {
  jewelry: Jewelry | null
  open: boolean
  onClose: () => void
  onSave: (id: string, data: any) => Promise<void>
}

export function JewelryEditSheet({ jewelry, open, onClose, onSave }: JewelryEditSheetProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<any>({})
  const [images, setImages] = useState<string[]>([])
  const [model3dUrl, setModel3dUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingModel, setUploadingModel] = useState(false)

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
      setImages(jewelry.images ?? [])
      setModel3dUrl((jewelry as any).model3dUrl ?? null)
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

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingImage(true)
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Fichier trop volumineux", description: `${file.name} dépasse 10MB.`, variant: "destructive" })
        continue
      }
      try {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("category", "jewelry")
        const token = getToken()
        const res = await fetch("/api/uploads", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        })
        if (res.ok) {
          const data = await res.json()
          setImages((prev) => [...prev, data.url])
        } else {
          toast({ title: "Erreur upload", description: `Impossible d'uploader ${file.name}.`, variant: "destructive" })
        }
      } catch {
        toast({ title: "Erreur réseau", description: `Erreur pour ${file.name}.`, variant: "destructive" })
      }
    }
    setUploadingImage(false)
    e.target.value = ""
  }

  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Le modèle 3D dépasse 50MB.", variant: "destructive" })
      return
    }
    setUploadingModel(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const token = getToken()
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      if (res.ok) {
        const data = await res.json()
        setModel3dUrl(data.url)
        toast({ title: "Modèle 3D uploadé", description: file.name })
      } else {
        toast({ title: "Erreur upload", description: "Impossible d'uploader le modèle 3D.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erreur réseau", description: "Erreur lors de l'upload du modèle.", variant: "destructive" })
    }
    setUploadingModel(false)
    e.target.value = ""
  }

  const removeImage = (index: number) =>
    setImages((prev) => prev.filter((_, i) => i !== index))

  const handleSave = async () => {
    if (!jewelry) return
    setSaving(true)
    try {
      await onSave(jewelry.id, {
        ...form,
        images,
        weight: parseFloat(form.weight),
        estimatedValue: parseFloat(form.estimatedValue),
        rentPricePerDay: form.rentPricePerDay ? parseFloat(form.rentPricePerDay) : undefined,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
        model3dUrl: model3dUrl || null,
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

        <div className="space-y-5">
          {/* Images */}
          <div className="space-y-2">
            <Label>Photos du bijou</Label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                  <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-5 w-5"
                    onClick={() => removeImage(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <label className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${uploadingImage ? "cursor-wait opacity-60" : "cursor-pointer hover:border-primary"}`}>
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{uploadingImage ? "Upload..." : "Ajouter"}</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
            </div>
          </div>

          {/* 3D Model */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Box className="h-4 w-4 text-violet-600" />
              Modèle 3D (essayage virtuel)
            </Label>
            {model3dUrl ? (
              <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
                <Box className="h-4 w-4 shrink-0 text-violet-600" />
                <span className="flex-1 truncate text-sm text-violet-700">
                  {model3dUrl.split("/").pop()}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => setModel3dUrl(null)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <label className={`flex items-center gap-3 rounded-lg border-2 border-dashed border-violet-200 p-3 transition-colors ${uploadingModel ? "cursor-wait opacity-60" : "cursor-pointer hover:border-violet-400"}`}>
                <Upload className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="text-sm font-medium text-violet-700">
                    {uploadingModel ? "Upload en cours..." : "Uploader un fichier .glb"}
                  </p>
                  <p className="text-xs text-muted-foreground">Max 50MB — Active l'essayage 3D</p>
                </div>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  className="hidden"
                  onChange={handleModelUpload}
                  disabled={uploadingModel}
                />
              </label>
            )}
            {!model3dUrl && (
              <p className="text-xs text-muted-foreground">
                Sans modèle 3D, l'essayage virtuel ne sera pas disponible pour ce bijou.
              </p>
            )}
          </div>

          {/* Title */}
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

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving || uploadingImage || uploadingModel} className="flex-1 gold-button text-white border-0">
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
