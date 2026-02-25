"use client"

import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { EmptyState } from "@/components/ui/empty-state"
import { useStore } from "@/lib/store"
import { formatPrice, formatWeight, formatPurity } from "@/lib/utils/format"
import { Providers } from "@/app/providers"
import Link from "next/link"

export default function ListingsPage() {
  const router = useRouter()
  const { currentUser, jewelry, deleteJewelry } = useStore()

  if (!currentUser) {
    router.push("/login")
    return null
  }

  const userJewelry = jewelry.filter((j) => j.ownerId === currentUser.id)

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      deleteJewelry(id)
    }
  }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Mes annonces</h1>
                <p className="text-muted-foreground">Gérez vos bijoux en ligne</p>
              </div>
              <Button asChild>
                <Link href="/jewelry/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle annonce
                </Link>
              </Button>
            </div>

            {userJewelry.length === 0 ? (
              <EmptyState
                icon={Plus}
                title="Aucune annonce"
                description="Vous n'avez pas encore créé d'annonce. Commencez par ajouter votre premier bijou."
                action={{
                  label: "Créer une annonce",
                  onClick: () => router.push("/jewelry/new"),
                }}
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userJewelry.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-0">
                      <div className="relative aspect-square">
                        <img
                          src={item.images[0] || "/placeholder.svg"}
                          alt={item.title}
                          className="object-cover w-full h-full rounded-t-lg"
                        />
                        <div className="absolute top-2 left-2 flex gap-2">
                          {item.listingType.includes("rent") && (
                            <Badge variant="secondary" className="bg-primary text-primary-foreground">
                              Location
                            </Badge>
                          )}
                          {item.listingType.includes("sale") && (
                            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                              Vente
                            </Badge>
                          )}
                        </div>
                        {!item.available && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                            <Badge variant="secondary" className="bg-red-500 text-white">
                              Non disponible
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold line-clamp-2">{item.title}</h3>

                        <div className="flex items-center gap-4 text-sm">
                          <span>{formatWeight(item.weight)}</span>
                          <span>{formatPurity(item.purity)}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                          {item.rentPricePerDay && (
                            <p className="text-sm">
                              <span className="font-semibold text-primary">{formatPrice(item.rentPricePerDay)}</span>
                              <span className="text-muted-foreground">/jour</span>
                            </p>
                          )}
                          {item.salePrice && (
                            <p className="text-sm">
                              <span className="font-semibold">{formatPrice(item.salePrice)}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span>{item.views} vues</span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                            <Link href={`/jewelry/${item.id}`}>Voir</Link>
                          </Button>
                          <Button variant="outline" size="sm" className="bg-transparent">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
