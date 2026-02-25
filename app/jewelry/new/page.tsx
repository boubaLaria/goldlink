"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/lib/hooks/use-auth"
import { useJewelry } from "@/lib/hooks/use-jewelry"
import { useToast } from "@/hooks/use-toast"
import { Providers } from "@/app/providers"
import { JEWELRY_TYPES, PURITY_OPTIONS, LOCATIONS, buildJewelryPayload } from "@/lib/services/jewelry.service"

export default function NewJewelryPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { create, loading } = useJewelry()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    weight: "",
    purity: "",
    estimatedValue: "",
    location: "",
    rentPricePerDay: "",
    salePrice: "",
    listingTypes: [] as string[],
  })

  const [images, setImages] = useState<string[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).map(
        (_, index) => `/placeholder.svg?height=400&width=400&text=Image${images.length + index + 1}`,
      )
      setImages([...images, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const toggleListingType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      listingTypes: prev.listingTypes.includes(type)
        ? prev.listingTypes.filter((t) => t !== type)
        : [...prev.listingTypes, type],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.listingTypes.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un type d'annonce",
        variant: "destructive",
      })
      return
    }

    try {
      const payload = buildJewelryPayload({ ...formData, images })
      const newJewelry = await create(payload)
      toast({
        title: "Annonce créée",
        description: "Votre bijou a été ajouté au catalogue avec succès",
      })
      router.push(`/jewelry/${newJewelry.id}`)
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de créer l'annonce",
        variant: "destructive",
      })
    }
  }

  if (authLoading) return null

  if (!currentUser) {
    return (
      <Providers>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Connexion requise</CardTitle>
                <CardDescription>Vous devez être connecté pour créer une annonce</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/login")} className="w-full">
                  Se connecter
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </Providers>
    )
  }

  if (!['SELLER', 'JEWELER', 'ADMIN'].includes(currentUser.role)) {
    return (
      <Providers>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Accès refusé</CardTitle>
                <CardDescription>
                  Seuls les vendeurs et bijoutiers peuvent créer des annonces.
                  Mettez à jour votre profil dans les paramètres.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/settings")} className="w-full">
                  Paramètres du compte
                </Button>
              </CardContent>
            </Card>
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
          <div className="container mx-auto px-4 max-w-3xl">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>Créer une annonce</CardTitle>
                <CardDescription>Ajoutez votre bijou au catalogue GoldLink</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Images */}
                  <div className="space-y-2">
                    <Label>Photos (minimum 3 recommandées)</Label>
                    <div className="grid grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Upload ${index + 1}`}
                            className="object-cover w-full h-full"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <div className="text-center">
                          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Ajouter</span>
                        </div>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Collier traditionnel marocain en or 18K"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez votre bijou en détail..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  {/* Characteristics */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type de bijou *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {JEWELRY_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purity">Pureté *</Label>
                      <Select
                        value={formData.purity}
                        onValueChange={(value) => setFormData({ ...formData, purity: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {PURITY_OPTIONS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Poids (grammes) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 45.5"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedValue">Valeur estimée (MAD) *</Label>
                      <Input
                        id="estimatedValue"
                        type="number"
                        placeholder="Ex: 85000"
                        value={formData.estimatedValue}
                        onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="location">Localisation *</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) => setFormData({ ...formData, location: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map((loc) => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Listing Type */}
                  <div className="space-y-4">
                    <Label>Type d'annonce *</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rent"
                          checked={formData.listingTypes.includes("RENT")}
                          onCheckedChange={() => toggleListingType("RENT")}
                        />
                        <Label htmlFor="rent" className="font-normal cursor-pointer">Location</Label>
                      </div>
                      {formData.listingTypes.includes("RENT") && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="rentPrice">Prix de location par jour (MAD)</Label>
                          <Input
                            id="rentPrice"
                            type="number"
                            placeholder="Ex: 1200"
                            value={formData.rentPricePerDay}
                            onChange={(e) => setFormData({ ...formData, rentPricePerDay: e.target.value })}
                            required={formData.listingTypes.includes("RENT")}
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sale"
                          checked={formData.listingTypes.includes("SALE")}
                          onCheckedChange={() => toggleListingType("SALE")}
                        />
                        <Label htmlFor="sale" className="font-normal cursor-pointer">Vente</Label>
                      </div>
                      {formData.listingTypes.includes("SALE") && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="salePrice">Prix de vente (MAD)</Label>
                          <Input
                            id="salePrice"
                            type="number"
                            placeholder="Ex: 85000"
                            value={formData.salePrice}
                            onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                            required={formData.listingTypes.includes("SALE")}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="flex-1 bg-transparent"
                    >
                      Annuler
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Publication..." : "Publier l'annonce"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
