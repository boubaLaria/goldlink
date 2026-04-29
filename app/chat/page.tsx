"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bot, Loader2, SendHorizonal, Sparkles, MapPin, Star } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Providers } from "../providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatPriceWithCurrency, formatPurity, formatWeight, getCurrencyLocale } from "@/lib/utils/format"

type JewelryResult = {
  id: string
  title: string
  description: string
  images: string[]
  type: string
  weight: number
  purity: number
  listingType: string[]
  rentPricePerDay?: number
  salePrice?: number
  available: boolean
  location: string
  rating: number
  reviewCount: number
  currency?: string
  owner: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
    rating: number
    verified: boolean
  }
}

type ChatMessage = {
  role: "user" | "assistant"
  content: string
  jewelryResults?: JewelryResult[]
  sources?: Array<{
    title: string
    sourceType: string
    sourcePath?: string | null
    score: number
    excerpt: string
  }>
}

const SUGGESTIONS = [
  "Comment fonctionne la location d'un bijou sur GoldLink ?",
  "Quels vendeurs verifies sont presents sur la plateforme ?",
  "Trouve-moi des bijoux en or 18K disponibles.",
  "Explique le service d'estimation GoldLink.",
  "Je cherche un bijou qui ne depasse pas 50 euros de location par jour.",
]

const CHAT_STORAGE_KEY = "goldlink-rag-chat-history"
const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Je peux repondre sur GoldLink a partir des documents indexes et des donnees publiques du catalogue. Pose une question sur la location, les vendeurs, les bijoux ou l'estimation.",
}

function ChatJewelryCard({ item, index }: { item: JewelryResult; index: number }) {
  const currency = item.currency || "EUR"
  const locale = getCurrencyLocale(currency)

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">Bijou {index + 1}</p>
      <Card className="overflow-hidden">
        <div className="relative aspect-square bg-muted">
          <Image
            src={item.images[0] || "/placeholder.svg"}
            alt={item.title}
            fill
            className="object-cover"
          />
          <div className="absolute left-2 top-2 flex gap-2">
            {item.listingType.includes("rent") ? (
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                Location
              </Badge>
            ) : null}
            {item.listingType.includes("sale") ? (
              <Badge variant="secondary">Vente</Badge>
            ) : null}
          </div>
        </div>
        <CardContent className="space-y-3 p-4">
          <div>
            <h4 className="line-clamp-2 font-semibold">{item.title}</h4>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{item.location}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span>{formatWeight(item.weight)}</span>
            <span>{formatPurity(item.purity)}</span>
            {item.rating > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {item.rating.toFixed(1)} ({item.reviewCount})
              </span>
            ) : null}
          </div>
          <div className="space-y-1 text-sm">
            {item.rentPricePerDay ? (
              <p>
                <span className="font-semibold text-primary">
                  {formatPriceWithCurrency(item.rentPricePerDay, currency, locale)}
                </span>{" "}
                <span className="text-muted-foreground">/jour</span>
              </p>
            ) : null}
            {item.salePrice ? (
              <p>
                <span className="font-semibold">
                  {formatPriceWithCurrency(item.salePrice, currency, locale)}
                </span>{" "}
                <span className="text-muted-foreground">a l&apos;achat</span>
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/jewelry/${item.id}`}>Voir le bijou</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 bg-transparent">
              <Link href={`/catalog?search=${encodeURIComponent(item.title)}`}>Catalogue</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ChatPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHAT_STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || parsed.length === 0) return

      setMessages(parsed)
    } catch {
      window.localStorage.removeItem(CHAT_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!messages.length) return
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!loading) return
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [loading])

  async function sendMessage(content: string) {
    const trimmed = content.trim()
    if (!trimmed || loading) return

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }]
    setMessages(nextMessages)
    setInput("")
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/chat/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "RAG chat request failed")
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.answer,
          jewelryResults: payload.jewelryResults,
          sources: payload.sources,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Badge className="gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Assistant RAG
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-100">
                    Bêta
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold text-balance">Chat GoldLink</h1>
                <p className="mx-auto max-w-2xl text-muted-foreground">
                  Ce chat repond a partir d&apos;une base de connaissance composee de documents GoldLink et de donnees publiques issues du projet.
                </p>
                <p className="mx-auto max-w-xl text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  Cette fonctionnalite est en version <strong>bêta</strong> — les reponses peuvent etre incompletes ou inexactes.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <Card className="min-h-[640px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      Conversation
                    </CardTitle>
                    <CardDescription>
                      Pose une question, le systeme recupere le contexte le plus pertinent puis genere la reponse.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScrollArea className="h-[420px] rounded-md border p-4">
                      <div className="space-y-4">
                        {messages.map((message, index) => (
                          <div
                            key={`${message.role}-${index}`}
                            className={`rounded-xl px-4 py-3 ${
                              message.role === "assistant"
                                ? "bg-muted"
                                : "ml-auto max-w-[85%] bg-primary text-primary-foreground"
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                            {message.role === "assistant" && message.jewelryResults?.length ? (
                              <div className="mt-4 space-y-3 border-t pt-3">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Bijoux proposes
                                </p>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                  {message.jewelryResults.map((item, index) => (
                                    <ChatJewelryCard key={item.id} item={item} index={index} />
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            {message.role === "assistant" && message.sources?.length ? (
                              <div className="mt-3 space-y-2 border-t pt-3">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Sources
                                </p>
                                {message.sources.map((source, sourceIndex) => (
                                  <div key={`${source.title}-${sourceIndex}`} className="rounded-lg border bg-background p-3">
                                    <p className="text-sm font-medium">{source.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {source.sourceType}
                                      {source.sourcePath ? ` · ${source.sourcePath}` : ""}
                                      {` · score ${source.score}`}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">{source.excerpt}</p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                        {loading ? (
                          <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Recuperation du contexte et generation en cours...
                            </span>
                          </div>
                        ) : null}
                        <div ref={bottomRef} />
                      </div>
                    </ScrollArea>

                    <div className="space-y-3">
                      <Textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                            event.preventDefault()
                            sendMessage(input)
                          }
                        }}
                        placeholder="Exemple: quels vendeurs verifies proposent des bagues en or 18K ?"
                        className="min-h-[110px]"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Le chat repond uniquement a partir des documents et donnees indexes. Ctrl+Entree pour envoyer.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="bg-transparent"
                            onClick={() => {
                              setMessages([INITIAL_ASSISTANT_MESSAGE])
                              setError(null)
                              window.localStorage.removeItem(CHAT_STORAGE_KEY)
                            }}
                            disabled={loading}
                          >
                            Effacer
                          </Button>
                          <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
                            <SendHorizonal className="mr-2 h-4 w-4" />
                            Envoyer
                          </Button>
                        </div>
                      </div>
                      {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Suggestions</CardTitle>
                      <CardDescription>Questions utiles pour valider rapidement le RAG.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => sendMessage(suggestion)}
                          className="w-full rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Perimetre</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>Le chat couvre la base documentaire GoldLink et les donnees publiques indexees.</p>
                      <p>Il ne doit pas inventer de regles, ni exposer de donnees privees.</p>
                      <p>Si l&apos;ingestion RAG n&apos;a pas encore ete lancee, les reponses echoueront ou seront pauvres.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
