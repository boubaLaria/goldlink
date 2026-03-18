"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Bell, Shield, CreditCard, Save, Gem } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/lib/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { CURRENCIES, COUNTRIES } from "@/lib/services/jewelry.service"
import { Providers } from "../providers"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  SELLER: "Vendeur",
  JEWELER: "Bijoutier",
  BUYER: "Acheteur",
}

export default function SettingsPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    country: "France",
    currency: "EUR",
  })
  const [saving, setSaving] = useState(false)

  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  })
  const [savingPwd, setSavingPwd] = useState(false)

  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: false,
  })

  // Sync form when user loads
  useEffect(() => {
    if (currentUser) {
      setProfile({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        phone: (currentUser as any).phone || "",
        address: (currentUser as any).address || "",
        country: (currentUser as any).country || "France",
        currency: (currentUser as any).currency || "EUR",
      })
    }
  }, [currentUser])

  if (authLoading) return null

  if (!currentUser) {
    router.push("/login")
    return null
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await apiClient.patch("/api/auth/me", profile)
      toast({ title: "Profil mis à jour", description: "Vos modifications ont été enregistrées." })
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de mettre à jour le profil.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwords.next !== passwords.confirm) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" })
      return
    }
    if (passwords.next.length < 6) {
      toast({ title: "Erreur", description: "Le nouveau mot de passe doit faire au moins 6 caractères.", variant: "destructive" })
      return
    }
    setSavingPwd(true)
    try {
      await apiClient.patch("/api/auth/me", {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      })
      setPasswords({ current: "", next: "", confirm: "" })
      toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été mis à jour." })
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de changer le mot de passe.", variant: "destructive" })
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Avatar className="h-16 w-16">
                <AvatarImage src={(currentUser as any).avatar || ""} />
                <AvatarFallback
                  className="text-xl font-bold"
                  style={{ background: "var(--secondary)", color: "var(--primary)" }}
                >
                  {currentUser.firstName[0]}{currentUser.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{currentUser.firstName} {currentUser.lastName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-muted-foreground text-sm">{currentUser.email}</p>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
                  >
                    {ROLE_LABELS[currentUser.role] ?? currentUser.role}
                  </Badge>
                </div>
              </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" className="gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profil</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-1.5">
                  <Gem className="h-4 w-4" />
                  <span className="hidden sm:inline">Préférences</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Sécurité</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-1.5">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Alertes</span>
                </TabsTrigger>
              </TabsList>

              {/* ── Profile Tab ── */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations personnelles</CardTitle>
                    <CardDescription>Mettez à jour vos informations de profil</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input
                          id="firstName"
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input
                          id="lastName"
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={currentUser.email}
                        disabled
                        className="opacity-60 cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">L'adresse email ne peut pas être modifiée.</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+33 6 00 00 00 00"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        placeholder="Ville, Pays"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      />
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="gold-button text-white border-0"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Preferences Tab ── */}
              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle>Préférences régionales</CardTitle>
                    <CardDescription>
                      Choisissez votre devise et votre pays par défaut pour les annonces
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Pays</Label>
                        <Select
                          value={profile.country}
                          onValueChange={(v) => setProfile({ ...profile, country: v })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Devise préférée</Label>
                        <Select
                          value={profile.currency}
                          onValueChange={(v) => setProfile({ ...profile, currency: v })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div
                      className="rounded-lg p-4 text-sm"
                      style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                    >
                      <p className="font-medium mb-1">💡 À quoi sert cette devise ?</p>
                      <p className="text-muted-foreground">
                        Votre devise par défaut sera utilisée lors de la création de nouvelles annonces.
                        Les prix s'affichent dans la devise du vendeur.
                      </p>
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="gold-button text-white border-0"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Enregistrement..." : "Enregistrer les préférences"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Security Tab ── */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Sécurité du compte</CardTitle>
                    <CardDescription>Changez votre mot de passe</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="currentPwd">Mot de passe actuel</Label>
                      <Input
                        id="currentPwd"
                        type="password"
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="newPwd">Nouveau mot de passe</Label>
                      <Input
                        id="newPwd"
                        type="password"
                        value={passwords.next}
                        onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPwd">Confirmer le nouveau mot de passe</Label>
                      <Input
                        id="confirmPwd"
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={handleChangePassword}
                      disabled={savingPwd || !passwords.current || !passwords.next}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {savingPwd ? "Modification..." : "Changer le mot de passe"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Notifications Tab ── */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Préférences de notification</CardTitle>
                    <CardDescription>Choisissez comment vous souhaitez être notifié</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      { key: "email", label: "Notifications par email", desc: "Réservations, messages et mises à jour importantes" },
                      { key: "sms", label: "Notifications SMS", desc: "Alertes urgentes et confirmations de réservation" },
                      { key: "push", label: "Notifications push", desc: "Notifications en temps réel dans le navigateur" },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium">{label}</Label>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={notifications[key as keyof typeof notifications]}
                          onCheckedChange={(v) => setNotifications({ ...notifications, [key]: v })}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
