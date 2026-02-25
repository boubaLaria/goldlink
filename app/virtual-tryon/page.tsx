"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Camera, Upload, X, RotateCcw, Download, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Providers } from "../providers"
import { useStore } from "@/lib/store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function VirtualTryOnPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedJewelry, setSelectedJewelry] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { jewelry } = useStore()

  const availableJewelry = jewelry.filter((j) => j.available)

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setIsCameraActive(true)
      setSelectedImage(null)
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL("image/png")
        setSelectedImage(imageData)
        stopCamera()
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        stopCamera()
      }
      reader.readAsDataURL(file)
    }
  }

  const resetImage = () => {
    setSelectedImage(null)
    setSelectedJewelry(null)
    stopCamera()
  }

  const downloadImage = () => {
    if (canvasRef.current && selectedImage) {
      const link = document.createElement("a")
      link.download = "goldlink-essayage-virtuel.png"
      link.href = canvasRef.current.toDataURL()
      link.click()
    }
  }

  const selectedJewelryItem = availableJewelry.find((j) => j.id === selectedJewelry)

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <Badge className="mb-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Nouveau
                </Badge>
                <h1 className="text-4xl font-bold text-balance">Essayage Virtuel</h1>
                <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
                  Découvrez comment les bijoux vous vont avant de les louer. Uploadez une photo ou utilisez votre caméra
                  pour un essayage virtuel instantané.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: Image/Camera Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Votre Photo</CardTitle>
                    <CardDescription>Uploadez une photo ou utilisez votre caméra</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!selectedImage && !isCameraActive && (
                      <div className="space-y-4">
                        <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                          <div className="text-center space-y-4 p-8">
                            <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Choisissez une méthode pour commencer l'essayage
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Button onClick={startCamera} className="w-full">
                            <Camera className="h-4 w-4 mr-2" />
                            Utiliser la caméra
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-transparent"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Uploader une photo
                          </Button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    )}

                    {isCameraActive && (
                      <div className="space-y-4">
                        <div className="relative aspect-[3/4] bg-black rounded-lg overflow-hidden">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Button onClick={capturePhoto} className="w-full">
                            <Camera className="h-4 w-4 mr-2" />
                            Capturer
                          </Button>
                          <Button variant="outline" onClick={stopCamera} className="w-full bg-transparent">
                            <X className="h-4 w-4 mr-2" />
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedImage && (
                      <div className="space-y-4">
                        <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                          <canvas ref={canvasRef} className="hidden" />
                          <img
                            src={selectedImage || "/placeholder.svg"}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          {selectedJewelryItem && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              {/* Jewelry overlay simulation */}
                              <div className="relative">
                                <img
                                  src={selectedJewelryItem.images[0] || "/placeholder.svg"}
                                  alt={selectedJewelryItem.name}
                                  className="w-32 h-32 object-contain opacity-80 drop-shadow-2xl"
                                  style={{
                                    filter: "drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" onClick={resetImage} className="w-full bg-transparent">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Recommencer
                          </Button>
                          {selectedJewelry && (
                            <Button onClick={downloadImage} className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Right: Jewelry Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Choisir un Bijou</CardTitle>
                    <CardDescription>Sélectionnez un bijou à essayer virtuellement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedImage && !isCameraActive ? (
                      <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                        <p className="text-sm text-muted-foreground text-center px-8">
                          Ajoutez d'abord une photo pour commencer l'essayage
                        </p>
                      </div>
                    ) : (
                      <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="all">Tous</TabsTrigger>
                          <TabsTrigger value="necklace">Colliers</TabsTrigger>
                          <TabsTrigger value="bracelet">Bracelets</TabsTrigger>
                          <TabsTrigger value="ring">Bagues</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="space-y-4 max-h-[600px] overflow-y-auto mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            {availableJewelry.slice(0, 8).map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedJewelry(item.id)}
                                className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                  selectedJewelry === item.id ? "border-primary ring-2 ring-primary" : "border-border"
                                }`}
                              >
                                <img
                                  src={item.images[0] || "/placeholder.svg"}
                                  alt={item.name}
                                  className="w-full aspect-square object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                  <p className="text-xs text-white font-medium truncate">{item.name}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="necklace" className="space-y-4 max-h-[600px] overflow-y-auto mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            {availableJewelry
                              .filter((j) => j.category === "necklace")
                              .slice(0, 8)
                              .map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => setSelectedJewelry(item.id)}
                                  className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                    selectedJewelry === item.id ? "border-primary ring-2 ring-primary" : "border-border"
                                  }`}
                                >
                                  <img
                                    src={item.images[0] || "/placeholder.svg"}
                                    alt={item.name}
                                    className="w-full aspect-square object-cover"
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                    <p className="text-xs text-white font-medium truncate">{item.name}</p>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="bracelet" className="space-y-4 max-h-[600px] overflow-y-auto mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            {availableJewelry
                              .filter((j) => j.category === "bracelet")
                              .slice(0, 8)
                              .map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => setSelectedJewelry(item.id)}
                                  className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                    selectedJewelry === item.id ? "border-primary ring-2 ring-primary" : "border-border"
                                  }`}
                                >
                                  <img
                                    src={item.images[0] || "/placeholder.svg"}
                                    alt={item.name}
                                    className="w-full aspect-square object-cover"
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                    <p className="text-xs text-white font-medium truncate">{item.name}</p>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="ring" className="space-y-4 max-h-[600px] overflow-y-auto mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            {availableJewelry
                              .filter((j) => j.category === "ring")
                              .slice(0, 8)
                              .map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => setSelectedJewelry(item.id)}
                                  className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                    selectedJewelry === item.id ? "border-primary ring-2 ring-primary" : "border-border"
                                  }`}
                                >
                                  <img
                                    src={item.images[0] || "/placeholder.svg"}
                                    alt={item.name}
                                    className="w-full aspect-square object-cover"
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                    <p className="text-xs text-white font-medium truncate">{item.name}</p>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Info Section */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center space-y-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Camera className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold">Essayage Instantané</h3>
                      <p className="text-sm text-muted-foreground">Visualisez immédiatement comment le bijou vous va</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold">Technologie IA</h3>
                      <p className="text-sm text-muted-foreground">
                        Superposition réaliste grâce à l'intelligence artificielle
                      </p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Download className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold">Partagez vos Essais</h3>
                      <p className="text-sm text-muted-foreground">Téléchargez et partagez vos essayages virtuels</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
