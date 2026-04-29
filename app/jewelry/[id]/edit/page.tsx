"use client"

import type React from "react"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Save, Upload, X, Box, Trash2, ImagePlus, Gem,
  Eye, ToggleLeft, ToggleRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Providers } from "@/app/providers"
import { useAuth } from "@/lib/hooks/use-auth"
import { useJewelry } from "@/lib/hooks/use-jewelry"
import { useToast } from "@/hooks/use-toast"
import { JEWELRY_TYPES, PURITY_OPTIONS, LOCATIONS } from "@/lib/services/jewelry.service"
import Link from "next/link"

export default function EditJewelryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { getById, update } = useJewelry()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingModel, setUploadingModel] = useState(false)
  const [originalJewelry, setOriginalJewelry] = useState<any>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("")
  const [purity, setPurity] = useState("")
  const [weight, setWeight] = useState("")
  const [estimatedValue, setEstimatedValue] = useState("")
  const [location, setLocation] = useState("")
  const [listingTypes, setListingTypes] = useState<string[]>([])
  const [rentPricePerDay, setRentPricePerDay] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [available, setAvailable] = useState(true)
  const [images, setImages] = useState<string[]>([])
  const [model3dUrl, setModel3dUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login")
    }
  }, [authLoading, currentUser, router])

  useEffect(() => {
    if (!currentUser) return
    getById(id).then((jewelry: any) => {
      if (!jewelry) { router.push("/dashboard/listings"); return }
      if (jewelry.ownerId !== currentUser.id && currentUser.role !== "ADMIN") {
        router.push("/dashboard/listings")
        return
      }
      setOriginalJewelry(jewelry)
      setTitle(jewelry.title)
      setDescription(jewelry.description)
      setType(jewelry.type)
      setPurity(jewelry.purity)
      setWeight(String(jewelry.weight))
      setEstimatedValue(String(jewelry.estimatedValue))
      setLocation(jewelry.location)
      setListingTypes(jewelry.listingTypes ?? [])
      setRentPricePerDay(jewelry.rentPricePerDay ? String(jewelry.rentPricePerDay) : "")
      setSalePrice(jewelry.salePrice ? String(jewelry.salePrice) : "")
      setAvailable(jewelry.available)
      setImages(jewelry.images ?? [])
      setModel3dUrl(jewelry.model3dUrl ?? null)
      setLoading(false)
    })
  }, [currentUser, id, getById, router])

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
        toast({ title: "Erreur upload", description: "Impossible d'uploader le modèle.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erreur réseau", description: "Erreur lors de l'upload.", variant: "destructive" })
    }
    setUploadingModel(false)
    e.target.value = ""
  }

  const toggleListingType = (v: string) =>
    setListingTypes((prev) =>
      prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v]
    )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (listingTypes.length === 0) {
      toast({ title: "Erreur", description: "Sélectionnez au moins un type d'annonce.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await update(id, {
        title,
        description,
        type,
        purity,
        weight: parseFloat(weight),
        estimatedValue: parseFloat(estimatedValue),
        location,
        listingTypes,
        available,
        images,
        model3dUrl: model3dUrl || null,
        rentPricePerDay: listingTypes.includes("RENT") && rentPricePerDay ? parseFloat(rentPricePerDay) : undefined,
        salePrice: listingTypes.includes("SALE") && salePrice ? parseFloat(salePrice) : undefined,
      })
      toast({ title: "Annonce mise à jour", description: `${title} a été enregistré.` })
      router.push("/dashboard/listings")
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de sauvegarder.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <Providers>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Chargement...</div>
          </main>
          <Footer />
        </div>
      </Providers>
    )
  }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Breadcrumb */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour aux annonces
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" asChild className="gap-2 bg-transparent">
                  <Link href={`/jewelry/${id}`}>
                    <Eye className="h-4 w-4" />
                    Voir la fiche
                  </Link>
                </Button>
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                <Gem className="h-7 w-7 text-primary" />
                Modifier l'annonce
              </h1>
              <p className="text-muted-foreground">{originalJewelry?.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={available ? "default" : "outline"} className={available ? "bg-green-100 text-green-800 border-green-200" : "bg-orange-100 text-orange-800 border-orange-200"}>
                  {available ? "Disponible" : "Indisponible"}
                </Badge>
                {model3dUrl && (
                  <Badge className="bg-violet-100 text-violet-700 border-violet-200 gap-1">
                    <Box className="h-3 w-3" />
                    Essayage 3D actif
                  </Badge>
                )}
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left column — media */}
                <div className="lg:col-span-1 space-y-6">

                  {/* Images */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Photos</CardTitle>
                      <CardDescription>{images.length} photo{images.length !== 1 ? "s" : ""}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {images.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border group">
                            <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                            {i === 0 && (
                              <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                                Principal
                              </span>
                            )}
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <label className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${uploadingImage ? "cursor-wait opacity-60" : "cursor-pointer hover:border-primary"}`}>
                          <ImagePlus className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground text-center">
                            {uploadingImage ? "Upload..." : "Ajouter"}
                          </span>
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
                      <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WebP — max 10MB. La 1ère photo est l'image principale.</p>
                    </CardContent>
                  </Card>

                  {/* 3D Model */}
                  <Card className="border-violet-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Box className="h-4 w-4 text-violet-600" />
                        Modèle 3D
                      </CardTitle>
                      <CardDescription>
                        {model3dUrl ? "Essayage 3D activé" : "Optionnel — active l'essayage virtuel"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {model3dUrl ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 rounded-lg bg-violet-50 border border-violet-200 px-3 py-2">
                            <Box className="h-4 w-4 shrink-0 text-violet-600" />
                            <span className="flex-1 truncate text-sm text-violet-700 font-medium">
                              {model3dUrl.split("/").pop()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <label className="flex-1">
                              <Button type="button" variant="outline" size="sm" className="w-full gap-2 bg-transparent" asChild>
                                <span>
                                  <Upload className="h-3.5 w-3.5" />
                                  {uploadingModel ? "Upload..." : "Remplacer"}
                                </span>
                              </Button>
                              <input
                                type="file"
                                accept=".glb,.gltf"
                                className="hidden"
                                onChange={handleModelUpload}
                                disabled={uploadingModel}
                              />
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive gap-2 bg-transparent"
                              onClick={() => setModel3dUrl(null)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Retirer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-violet-200 p-6 text-center transition-colors ${uploadingModel ? "cursor-wait opacity-60" : "cursor-pointer hover:border-violet-400"}`}>
                          <Upload className="h-6 w-6 text-violet-400" />
                          <div>
                            <p className="text-sm font-medium text-violet-700">
                              {uploadingModel ? "Upload en cours..." : "Uploader un fichier .glb"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">Max 50MB</p>
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
                    </CardContent>
                  </Card>

                  {/* Availability toggle */}
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Disponibilité</p>
                          <p className="text-xs text-muted-foreground">Visible dans le catalogue</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => setAvailable((v) => !v)}
                        >
                          {available
                            ? <><ToggleRight className="h-5 w-5 text-green-600" /><span className="text-green-700 text-sm">Disponible</span></>
                            : <><ToggleLeft className="h-5 w-5 text-muted-foreground" /><span className="text-muted-foreground text-sm">Indisponible</span></>
                          }
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right column — form fields */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Informations générales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Ex: Collier or 18K avec diamants"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={5}
                          placeholder="Décrivez votre bijou..."
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Caractéristiques</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Type de bijou *</Label>
                          <Select value={type} onValueChange={setType} required>
                            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                            <SelectContent>
                              {JEWELRY_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Pureté *</Label>
                          <Select value={purity} onValueChange={setPurity} required>
                            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                            <SelectContent>
                              {PURITY_OPTIONS.map((p) => (
                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="weight">Poids (g) *</Label>
                          <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="estimatedValue">Valeur estimée (€) *</Label>
                          <Input
                            id="estimatedValue"
                            type="number"
                            value={estimatedValue}
                            onChange={(e) => setEstimatedValue(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Localisation *</Label>
                        <Select value={location} onValueChange={setLocation} required>
                          <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                          <SelectContent>
                            {LOCATIONS.map((l) => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Prix & type d'annonce</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg border">
                          <Checkbox
                            id="rent"
                            checked={listingTypes.includes("RENT")}
                            onCheckedChange={() => toggleListingType("RENT")}
                          />
                          <label htmlFor="rent" className="text-sm font-medium cursor-pointer flex-1">Location</label>
                        </div>
                        {listingTypes.includes("RENT") && (
                          <div className="ml-4 space-y-1.5">
                            <Label htmlFor="rentPrice">Prix par jour (€)</Label>
                            <Input
                              id="rentPrice"
                              type="number"
                              value={rentPricePerDay}
                              onChange={(e) => setRentPricePerDay(e.target.value)}
                              placeholder="Ex: 150"
                              required
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-3 p-3 rounded-lg border">
                          <Checkbox
                            id="sale"
                            checked={listingTypes.includes("SALE")}
                            onCheckedChange={() => toggleListingType("SALE")}
                          />
                          <label htmlFor="sale" className="text-sm font-medium cursor-pointer flex-1">Vente</label>
                        </div>
                        {listingTypes.includes("SALE") && (
                          <div className="ml-4 space-y-1.5">
                            <Label htmlFor="salePriceInput">Prix de vente (€)</Label>
                            <Input
                              id="salePriceInput"
                              type="number"
                              value={salePrice}
                              onChange={(e) => setSalePrice(e.target.value)}
                              placeholder="Ex: 5000"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-3 pb-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="bg-transparent"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 gold-button text-white border-0 gap-2"
                      disabled={saving || uploadingImage || uploadingModel}
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
