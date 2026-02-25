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
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Providers } from "@/app/providers"
import type { JewelryType, ListingType } from "@/lib/types"

export default function NewJewelryPage() {
  const router = useRouter()
  const { currentUser, addJewelry } = useStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "" as JewelryType,
    weight: "",
    purity: "",
    dimensions: "",
    estimatedValue: "",
    location: "",
    rentPricePerDay: "",
    salePrice: "",
    listingType: [] as ListingType[],
  })

  const [images, setImages] = useState<string[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      // In a real app, you would upload to a server
      // For now, we'll use placeholder images
      const newImages = Array.from(files).map(
        (_, index) => `/placeholder.svg?height=400&width=400&text=Image${images.length + index + 1}`,
      )
      setImages([...images, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une annonce",
        variant: "destructive",
      })
      return
    }

    if (formData.listingType.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un type d'annonce",
        variant: "destructive",
      })
      return
    }

    const newJewelry = {
      id: Date.now().toString(),
      ownerId: currentUser.id,
      title: formData.title,
      description: formData.description,
      images: images.length > 0 ? images : ["/placeholder.svg?height=400&width=400"],
      type: formData.type,
      weight: Number.parseFloat(formData.weight),
      purity: Number.parseInt(formData.purity),
      dimensions: formData.dimensions || undefined,
      estimatedValue: Number.parseFloat(formData.estimatedValue),
      listingType: formData.listingType,
      rentPricePerDay: formData.listingType.includes("rent") ? Number.parseFloat(formData.rentPricePerDay) : undefined,
      salePrice: formData.listingType.includes("sale") ? Number.parseFloat(formData.salePrice) : undefined,
      available: true,
      location: formData.location,
      createdAt: new Date(),
      views: 0,
      rating: 0,
      reviewCount: 0,
    }

    addJewelry(newJewelry)

    toast({
      title: "Annonce créée",
      description: "Votre bijou a été ajouté au catalogue avec succès",
    })

    router.push(`/jewelry/${newJewelry.id}`)
  }

  const toggleListingType = (type: ListingType) => {
    if (formData.listingType.includes(type)) {
      setFormData({
        ...formData,
        listingType: formData.listingType.filter((t) => t !== type),
      })
    } else {
      setFormData({
        ...formData,
        listingType: [...formData.listingType, type],
      })
    }
  }

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
                        onValueChange={(value: JewelryType) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
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
                      <Label htmlFor="purity">Pureté *</Label>
                      <Select
                        value={formData.purity}
                        onValueChange={(value) => setFormData({ ...formData, purity: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18">18K</SelectItem>
                          <SelectItem value="22">22K</SelectItem>
                          <SelectItem value="24">24K</SelectItem>
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
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Input
                        id="dimensions"
                        placeholder="Ex: 45cm de longueur"
                        value={formData.dimensions}
                        onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
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

                    <div className="space-y-2">
                      <Label htmlFor="location">Localisation *</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) => setFormData({ ...formData, location: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Casablanca">Casablanca</SelectItem>
                          <SelectItem value="Marrakech">Marrakech</SelectItem>
                          <SelectItem value="Rabat">Rabat</SelectItem>
                          <SelectItem value="Fès">Fès</SelectItem>
                          <SelectItem value="Tanger">Tanger</SelectItem>
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
                          checked={formData.listingType.includes("rent")}
                          onCheckedChange={() => toggleListingType("rent")}
                        />
                        <Label htmlFor="rent" className="font-normal cursor-pointer">
                          Location
                        </Label>
                      </div>
                      {formData.listingType.includes("rent") && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="rentPrice">Prix de location par jour (MAD)</Label>
                          <Input
                            id="rentPrice"
                            type="number"
                            placeholder="Ex: 1200"
                            value={formData.rentPricePerDay}
                            onChange={(e) => setFormData({ ...formData, rentPricePerDay: e.target.value })}
                            required={formData.listingType.includes("rent")}
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sale"
                          checked={formData.listingType.includes("sale")}
                          onCheckedChange={() => toggleListingType("sale")}
                        />
                        <Label htmlFor="sale" className="font-normal cursor-pointer">
                          Vente
                        </Label>
                      </div>
                      {formData.listingType.includes("sale") && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="salePrice">Prix de vente (MAD)</Label>
                          <Input
                            id="salePrice"
                            type="number"
                            placeholder="Ex: 85000"
                            value={formData.salePrice}
                            onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                            required={formData.listingType.includes("sale")}
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
                    <Button type="submit" className="flex-1">
                      Publier l'annonce
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
