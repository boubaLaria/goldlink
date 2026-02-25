import Link from "next/link"
import { ArrowRight, Shield, Sparkles, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Providers } from "./providers"

export default function HomePage() {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center space-y-8">
                <h1 className="text-4xl md:text-6xl font-bold text-balance">
                  Louez, Vendez et Estimez vos Bijoux en Or
                </h1>
                <p className="text-xl text-muted-foreground text-pretty">
                  La première plateforme marocaine dédiée à la location et la vente sécurisée de bijoux en or pour vos
                  événements spéciaux
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/catalog">
                      Explorer le catalogue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="bg-transparent">
                    <Link href="/estimation">Estimer un bijou</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="bg-transparent">
                    <Link href="/virtual-tryon">Essayage Virtuel</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Pourquoi choisir GoldLink ?</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-card p-8 rounded-lg border">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Transactions Sécurisées</h3>
                  <p className="text-muted-foreground">
                    Système de caution et paiement sécurisé pour protéger propriétaires et locataires
                  </p>
                </div>

                <div className="bg-card p-8 rounded-lg border">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Estimation Instantanée</h3>
                  <p className="text-muted-foreground">
                    Obtenez une estimation de la valeur de vos bijoux en quelques secondes grâce à notre IA
                  </p>
                </div>

                <div className="bg-card p-8 rounded-lg border">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Bijoutiers Certifiés</h3>
                  <p className="text-muted-foreground">
                    Accédez à un réseau de bijoutiers professionnels vérifiés et certifiés
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Prêt à commencer ?</h2>
                <p className="text-lg mb-8 opacity-90">
                  Rejoignez des centaines d'utilisateurs qui font confiance à GoldLink
                </p>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/register">Créer un compte gratuitement</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
