"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Send, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/lib/hooks/use-auth"
import { useMessages } from "@/lib/hooks/use-messages"
import { formatDateTime } from "@/lib/utils/date"
import { Providers } from "../providers"

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { messages, list, send } = useMessages()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (currentUser) {
      list()
    }
  }, [currentUser, list])

  useEffect(() => {
    const userId = searchParams.get("user")
    if (userId) setSelectedUserId(userId)
  }, [searchParams])

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
              <Button asChild>
                <a href="/login">Se connecter</a>
              </Button>
            </Card>
          </main>
          <Footer />
        </div>
      </Providers>
    )
  }

  // Build a map of conversation partners from messages
  // sender info is always present; receiver info is present after API update
  const partnerMap = new Map<string, any>()
  ;(messages as any[]).forEach((msg) => {
    if (msg.senderId !== currentUser.id && msg.sender) {
      partnerMap.set(msg.senderId, msg.sender)
    }
    if (msg.receiverId !== currentUser.id && msg.receiver) {
      partnerMap.set(msg.receiverId, msg.receiver)
    }
  })

  const conversationUsers = Array.from(partnerMap.values()).filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query)
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
    } catch {
      // error handled in hook
    }
  }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 h-[calc(100vh-12rem)]">
            <h1 className="text-3xl font-bold mb-6">Messages</h1>

            <div className="grid lg:grid-cols-3 gap-6 h-full">
              {/* Conversations List */}
              <Card className="lg:col-span-1 flex flex-col">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une conversation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {conversationUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Aucune conversation</p>
                      </div>
                    ) : (
                      conversationUsers.map((user) => {
                        const lastMessage = (messages as any[])
                          .filter((m) => m.senderId === user.id || m.receiverId === user.id)
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

                        const unreadCount = (messages as any[]).filter(
                          (m) =>
                            m.senderId === user.id &&
                            m.receiverId === currentUser.id &&
                            m.status === "SENT",
                        ).length

                        return (
                          <button
                            key={user.id}
                            onClick={() => setSelectedUserId(user.id)}
                            className={`w-full p-3 rounded-lg hover:bg-muted transition-colors text-left ${
                              selectedUserId === user.id ? "bg-muted" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {user.firstName?.[0]}
                                  {user.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold truncate">
                                    {user.firstName} {user.lastName}
                                  </p>
                                  {unreadCount > 0 && (
                                    <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                      {unreadCount}
                                    </span>
                                  )}
                                </div>
                                {lastMessage && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {lastMessage.senderId === currentUser.id ? "Vous: " : ""}
                                    {lastMessage.content}
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

              {/* Messages */}
              <Card className="lg:col-span-2 flex flex-col">
                {selectedUser ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {selectedUser.firstName?.[0]}
                          {selectedUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {conversationMessages.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>Aucun message. Commencez la conversation!</p>
                          </div>
                        ) : (
                          conversationMessages.map((message: any) => {
                            const isOwn = message.senderId === currentUser.id
                            return (
                              <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
                                  <div
                                    className={`rounded-lg p-3 ${
                                      isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                                    }`}
                                  >
                                    <p className="text-sm">{message.content}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 px-1">
                                    {formatDateTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Écrivez votre message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <p>Sélectionnez une conversation pour commencer</p>
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
