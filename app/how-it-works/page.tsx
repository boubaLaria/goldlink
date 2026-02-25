import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MessageSquare, CreditCard, Package } from "lucide-react"
import { Providers } from "../providers"

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      title: "Recherchez",
      description: "Parcourez notre catalogue de bijoux en or et trouvez celui qui correspond à vos besoins",
    },
    {
      icon: MessageSquare,
      title: "Contactez",
      description: "Communiquez directement avec le propriétaire pour discuter des détails",
    },
    {
      icon: CreditCard,
      title: "Réservez",
      description: "Effectuez votre réservation en ligne avec paiement sécurisé et caution",
    },
    {
      icon: Package,
      title: "Profitez",
      description: "Récupérez votre bijou et brillez lors de votre événement spécial",
    },
  ]

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Comment ça marche ?</h1>
              <p className="text-xl text-muted-foreground">Louez ou vendez des bijoux en or en toute simplicité</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {steps.map((step, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {index + 1}. {step.title}
                        </h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Pour les locataires</h2>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <p className="text-muted-foreground">
                      Louez des bijoux en or de qualité pour vos événements spéciaux sans avoir à les acheter. Parfait
                      pour les mariages, cérémonies et occasions importantes.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Large sélection de bijoux authentiques</li>
                      <li>• Prix de location abordables</li>
                      <li>• Assurance optionnelle disponible</li>
                      <li>• Caution remboursée après retour</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Pour les propriétaires</h2>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <p className="text-muted-foreground">
                      Monétisez vos bijoux en or en les mettant en location ou en vente sur notre plateforme sécurisée.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Revenus passifs de vos bijoux</li>
                      <li>• Plateforme sécurisée avec caution</li>
                      <li>• Gestion simple de vos annonces</li>
                      <li>• Commission transparente de 10%</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Sécurité et confiance</h2>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <p className="text-muted-foreground">
                      Votre sécurité est notre priorité. Nous mettons en place plusieurs mesures pour garantir des
                      transactions sûres.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Vérification d'identité (eKYC)</li>
                      <li>• Système de caution automatique</li>
                      <li>• Paiements sécurisés</li>
                      <li>• Notation et avis vérifiés</li>
                      <li>• Support client disponible</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
