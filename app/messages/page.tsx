"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Send, Search, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/lib/hooks/use-auth"
import { useMessages } from "@/lib/hooks/use-messages"
import { apiClient } from "@/lib/api-client"
import { Providers } from "../providers"

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  if (days === 1) return "Hier"
  if (days < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" })
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
}

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { messages, list, send } = useMessages()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [extraUser, setExtraUser] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentUser) list()
  }, [currentUser, list])

  // Fetch user info from URL param if not already in conversations
  useEffect(() => {
    const userId = searchParams.get("user")
    if (!userId || !currentUser) return
    setSelectedUserId(userId)
    // Fetch user info so we can show name even without prior messages
    apiClient.get(`/api/users/${userId}`)
      .then((res) => setExtraUser(res.data))
      .catch(() => {})
  }, [searchParams, currentUser])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, selectedUserId])

  if (authLoading) return null

  if (!currentUser) {
    return (
      <Providers>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Card className="p-8 max-w-md text-center">
              <h2 className="text-xl font-semibold mb-4">Connexion requise</h2>
              <p className="text-muted-foreground mb-6">Vous devez être connecté pour accéder à la messagerie</p>
              <Button asChild><a href="/login">Se connecter</a></Button>
            </Card>
          </main>
          <Footer />
        </div>
      </Providers>
    )
  }

  // Build partner map from messages
  const partnerMap = new Map<string, any>()
  ;(messages as any[]).forEach((msg) => {
    if (msg.senderId !== currentUser.id && msg.sender) {
      partnerMap.set(msg.senderId, msg.sender)
    }
    if (msg.receiverId !== currentUser.id && msg.receiver) {
      partnerMap.set(msg.receiverId, msg.receiver)
    }
  })

  // If we have an extraUser from URL param, add to map
  if (extraUser && !partnerMap.has(extraUser.id)) {
    partnerMap.set(extraUser.id, extraUser)
  }

  const conversationUsers = Array.from(partnerMap.values()).filter((u) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)
    )
  })

  const conversationMessages = selectedUserId
    ? (messages as any[])
        .filter((m) => m.senderId === selectedUserId || m.receiverId === selectedUserId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : []

  const selectedUser = partnerMap.get(selectedUserId ?? "")

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUserId) return
    try {
      await send(selectedUserId, messageText)
      setMessageText("")
      // Refresh messages after sending
      await list()
    } catch {
      // error handled in hook
    }
  }

  const getLastMessage = (userId: string) =>
    (messages as any[])
      .filter((m) => m.senderId === userId || m.receiverId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const getUnreadCount = (userId: string) =>
    (messages as any[]).filter(
      (m) => m.senderId === userId && m.receiverId === currentUser.id && m.status === "SENT"
    ).length

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold">Messages</h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 14rem)" }}>
              {/* Conversations List */}
              <Card className="lg:col-span-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-0.5">
                    {conversationUsers.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aucune conversation</p>
                      </div>
                    ) : (
                      conversationUsers.map((u) => {
                        const lastMsg = getLastMessage(u.id)
                        const unread = getUnreadCount(u.id)
                        const active = selectedUserId === u.id

                        return (
                          <button
                            key={u.id}
                            onClick={() => setSelectedUserId(u.id)}
                            className="w-full p-3 rounded-lg transition-colors text-left"
                            style={{
                              background: active ? "var(--accent)" : "transparent",
                            }}
                            onMouseEnter={(e) => !active && (e.currentTarget.style.background = "var(--muted)")}
                            onMouseLeave={(e) => !active && (e.currentTarget.style.background = "transparent")}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={u.avatar || ""} />
                                <AvatarFallback
                                  className="text-xs font-semibold"
                                  style={{ background: "var(--secondary)", color: "var(--primary)" }}
                                >
                                  {u.firstName?.[0]}{u.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="font-semibold text-sm truncate">
                                    {u.firstName} {u.lastName}
                                  </p>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {lastMsg && (
                                      <span className="text-xs text-muted-foreground">
                                        {formatTime(lastMsg.createdAt)}
                                      </span>
                                    )}
                                    {unread > 0 && (
                                      <Badge
                                        className="h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                                        style={{ background: "var(--primary)" }}
                                      >
                                        {unread}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {lastMsg ? (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {lastMsg.senderId === currentUser.id ? "Vous : " : ""}
                                    {lastMsg.content}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic mt-0.5">
                                    Commencer la conversation
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </Card>

              {/* Chat Panel */}
              <Card className="lg:col-span-2 flex flex-col overflow-hidden">
                {selectedUser ? (
                  <>
                    {/* Header */}
                    <div
                      className="p-4 flex items-center gap-3 shrink-0"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={selectedUser.avatar || ""} />
                        <AvatarFallback
                          className="text-xs font-semibold"
                          style={{ background: "var(--secondary)", color: "var(--primary)" }}
                        >
                          {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {selectedUser.role === "SELLER" ? "Vendeur" :
                           selectedUser.role === "JEWELER" ? "Bijoutier" :
                           selectedUser.role === "ADMIN" ? "Admin" : "Acheteur"}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-3">
                        {conversationMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                            <p className="text-sm">Envoyez votre premier message</p>
                          </div>
                        ) : (
                          conversationMessages.map((message: any) => {
                            const isOwn = message.senderId === currentUser.id
                            return (
                              <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                                <div className="max-w-[72%]">
                                  <div
                                    className="rounded-2xl px-4 py-2.5 text-sm"
                                    style={{
                                      background: isOwn ? "var(--primary)" : "var(--muted)",
                                      color: isOwn ? "var(--primary-foreground)" : "var(--foreground)",
                                      borderBottomRightRadius: isOwn ? "4px" : "16px",
                                      borderBottomLeftRadius: isOwn ? "16px" : "4px",
                                    }}
                                  >
                                    {message.content}
                                  </div>
                                  <p className={`text-[11px] text-muted-foreground mt-1 px-1 ${isOwn ? "text-right" : ""}`}>
                                    {formatTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            )
                          })
                        )}
                        <div ref={bottomRef} />
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Votre message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim()}
                          size="icon"
                          className="gold-button text-white border-0 shrink-0"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <MessageSquare className="h-12 w-12 opacity-20" />
                    <p className="text-sm">Sélectionnez une conversation</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
