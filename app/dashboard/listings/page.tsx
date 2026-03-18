"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Gem } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { JewelryEditSheet } from "@/components/jewelry/jewelry-edit-sheet"
import { JewelryListingsTable } from "@/components/jewelry/jewelry-listings-table"
import { JewelryListingsSkeleton } from "@/components/jewelry/jewelry-listings-skeleton"
import { useAuth } from "@/lib/hooks/use-auth"
import { useJewelry, type Jewelry } from "@/lib/hooks/use-jewelry"
import { Providers } from "@/app/providers"
import { toast } from "sonner"
import Link from "next/link"

export default function ListingsPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { jewelry, loading, list, update, delete: deleteJewelry } = useJewelry()
  const [editItem, setEditItem] = useState<Jewelry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser) list({ ownerId: currentUser.id } as any)
  }, [currentUser, list])

  if (authLoading) return null
  if (!currentUser) { router.push("/login"); return null }

  const handleSave = async (id: string, data: any) => {
    await update(id, data)
    toast.success("Annonce mise à jour")
  }
  const handleToggleAvailable = async (item: Jewelry) => {
    await update(item.id, { available: !item.available })
    toast.success(item.available ? "Bijou marqué indisponible" : "Bijou marqué disponible")
  }
  const handleDelete = async () => {
    if (!deleteId) return
    await deleteJewelry(deleteId)
    setDeleteId(null)
    toast.success("Annonce supprimée")
  }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
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
              <JewelryListingsSkeleton />
            ) : jewelry.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
                <Gem className="h-12 w-12 opacity-20" />
                <p className="text-lg">Aucune annonce pour le moment</p>
                <Button asChild><Link href="/jewelry/new">Créer ma première annonce</Link></Button>
              </div>
            ) : (
              <JewelryListingsTable
                jewelry={jewelry}
                onEdit={setEditItem}
                onDelete={setDeleteId}
                onToggleAvailable={handleToggleAvailable}
              />
            )}
          </div>
        </main>
        <Footer />
      </div>

      <JewelryEditSheet
        jewelry={editItem}
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={handleSave}
      />

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
            <AlertDialogAction onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Providers>
  )
}
