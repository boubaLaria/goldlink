"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Sparkles, TrendingUp, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useStore } from "@/lib/store"
import { generateEstimation } from "@/lib/utils/estimation"
import { formatPrice, formatWeight, formatPurity } from "@/lib/utils/format"
import { Providers } from "../providers"

export default function EstimationPage() {
  const { currentUser, addEstimation } = useStore()
  const [images, setImages] = useState<string[]>([])
  const [weight, setWeight] = useState("")
  const [purity, setPurity] = useState("")
  const [isEstimating, setIsEstimating] = useState(false)
  const [estimation, setEstimation] = useState<{
    estimatedGoldValue: number
    estimatedCommercialValue: number
    confidence: number
  } | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).map(
        (_, index) => `/placeholder.svg?height=400&width=400&text=Jewelry${images.length + index + 1}`,
      )
      setImages([...images, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleEstimate = () => {
    if (!weight || !purity) {
      return
    }

    setIsEstimating(true)

    // Simulate AI processing
    setTimeout(() => {
      const result = generateEstimation(Number.parseFloat(weight), Number.parseInt(purity), images.length > 0)

      setEstimation(result)

      if (currentUser) {
        const newEstimation = {
          id: Date.now().toString(),
          userId: currentUser.id,
          images,
          weight: Number.parseFloat(weight),
          purity: Number.parseInt(purity),
          ...result,
          certified: false,
          createdAt: new Date(),
        }
        addEstimation(newEstimation)
      }

      setIsEstimating(false)
    }, 2000)
  }

  const handleReset = () => {
    setImages([])
    setWeight("")
    setPurity("")
    setEstimation(null)
  }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Estimation de Bijoux</h1>
              <p className="text-muted-foreground">
                Obtenez une estimation instantanée de la valeur de votre bijou en or
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations du bijou</CardTitle>
                  <CardDescription>Fournissez les détails pour une estimation précise</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Photos du bijou (optionnel)</Label>
                    <div className="grid grid-cols-3 gap-4">
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
                      {images.length < 3 && (
                        <label className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <div className="text-center">
                            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Ajouter</span>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Les photos améliorent la précision de l'estimation</p>
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <Label htmlFor="weight">Poids (grammes) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 45.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      required
                    />
                  </div>

                  {/* Purity */}
                  <div className="space-y-2">
                    <Label htmlFor="purity">Pureté *</Label>
                    <Select value={purity} onValueChange={setPurity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la pureté" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18">18K (75% or)</SelectItem>
                        <SelectItem value="22">22K (91.6% or)</SelectItem>
                        <SelectItem value="24">24K (99.9% or)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      Notre IA analyse les caractéristiques de votre bijou pour fournir une estimation basée sur le
                      cours actuel de l'or.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-4">
                    <Button onClick={handleEstimate} disabled={!weight || !purity || isEstimating} className="flex-1">
                      {isEstimating ? "Estimation en cours..." : "Estimer"}
                    </Button>
                    {estimation && (
                      <Button onClick={handleReset} variant="outline" className="bg-transparent">
                        Réinitialiser
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              <div className="space-y-6">
                {isEstimating && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                          <p className="font-medium">Analyse en cours...</p>
                        </div>
                        <Progress value={66} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                          Notre IA analyse les caractéristiques de votre bijou
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {estimation && !isEstimating && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Résultats de l'estimation</CardTitle>
                        <CardDescription>Basé sur le cours actuel de l'or</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Gold Value */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-medium">Valeur de l'or</span>
                          </div>
                          <p className="text-3xl font-bold text-primary">
                            {formatPrice(estimation.estimatedGoldValue)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Basé sur {formatWeight(Number.parseFloat(weight))} à {formatPurity(Number.parseInt(purity))}
                          </p>
                        </div>

                        {/* Commercial Value */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-sm font-medium">Valeur commerciale estimée</span>
                          </div>
                          <p className="text-3xl font-bold">{formatPrice(estimation.estimatedCommercialValue)}</p>
                          <p className="text-sm text-muted-foreground">Inclut la valeur artisanale et le design</p>
                        </div>

                        {/* Confidence */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Niveau de confiance</span>
                            <span className="font-medium">{Math.round(estimation.confidence * 100)}%</span>
                          </div>
                          <Progress value={estimation.confidence * 100} className="h-2" />
                        </div>

                        <Alert>
                          <AlertDescription>
                            Cette estimation est indicative. Pour une évaluation certifiée, contactez un bijoutier
                            partenaire.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Prochaines étapes</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full bg-transparent" variant="outline" asChild>
                          <a href="/catalog">Comparer avec le catalogue</a>
                        </Button>
                        {currentUser && (
                          <Button className="w-full" asChild>
                            <a href="/jewelry/new">Créer une annonce</a>
                          </Button>
                        )}
                        <p className="text-xs text-center text-muted-foreground">
                          Estimation certifiée disponible avec nos bijoutiers partenaires
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}

                {!estimation && !isEstimating && (
                  <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Remplissez les informations pour obtenir votre estimation</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
