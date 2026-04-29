"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Gem, Trash2, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useTryOn } from "@/lib/hooks/use-tryon"
import { useAuth } from "@/lib/hooks/use-auth"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Providers } from "@/app/providers"
import Link from "next/link"

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  PENDING:    { label: "En attente",     class: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  PROCESSING: { label: "En cours",       class: "bg-blue-100 text-blue-700 border-blue-300" },
  DONE:       { label: "Terminé",        class: "bg-green-100 text-green-700 border-green-300" },
  FAILED:     { label: "Échoué",         class: "bg-red-100 text-red-700 border-red-300" },
}

export default function TryOnHistoryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { history, historyLoading, historyTotal, getHistory, deleteSession } = useTryOn()

  useEffect(() => {
    if (!authLoading && user) getHistory({ limit: 20 })
  }, [user, authLoading, getHistory])

  if (authLoading) return null
  if (!user) { router.push("/login"); return null }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="h-7 w-7 text-violet-600" />
              <div>
                <h1 className="text-3xl font-bold">Historique d'essayages</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {historyTotal} essayage{historyTotal !== 1 ? "s" : ""} au total
                </p>
              </div>
            </div>

            {historyLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border overflow-hidden">
                    <Skeleton className="aspect-video w-full rounded-none" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
                <Sparkles className="h-12 w-12 opacity-20" />
                <p className="text-lg">Aucun essayage pour le moment</p>
                <Button asChild variant="outline">
                  <Link href="/catalog?tryOnAvailable=true">
                    Découvrir les bijoux avec essayage virtuel
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((session) => (
                  <Card key={session.id} className="overflow-hidden">
                    <div className="relative aspect-video bg-muted">
                      {session.outputImageUrl ? (
                        <img
                          src={session.outputImageUrl}
                          alt="Essayage"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {session.status === "PROCESSING" || session.status === "PENDING" ? (
                            <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                          ) : (
                            <Gem className="h-8 w-8 text-muted-foreground opacity-30" />
                          )}
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_BADGE[session.status]?.class ?? ""}`}
                        >
                          {STATUS_BADGE[session.status]?.label ?? session.status}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(session.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      <div className="flex gap-2">
                        {session.status === "DONE" && session.jewelryId && (
                          <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                            <Link href={`/jewelry/${session.jewelryId}/try-on`}>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Réessayer
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { deleteSession(session.id); toast.success("Essayage supprimé") }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
