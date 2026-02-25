"use client"

import { Shield, Sparkles, TrendingUp } from "lucide-react"

interface Feature {
  icon: React.FC<{ className?: string }>
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: Shield,
    title: "Transactions Sécurisées",
    description:
      "Système de caution et paiement sécurisé pour protéger propriétaires et locataires",
  },
  {
    icon: Sparkles,
    title: "Estimation Instantanée",
    description:
      "Obtenez une estimation de la valeur de vos bijoux en quelques secondes grâce à notre IA",
  },
  {
    icon: TrendingUp,
    title: "Bijoutiers Certifiés",
    description:
      "Accédez à un réseau de bijoutiers professionnels vérifiés et certifiés",
  },
]

function FeatureCard({
  icon: Icon,
  title,
  description,
}: Feature) {
  return (
    <div className="bg-card p-8 rounded-lg border">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Pourquoi choisir GoldLink ?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
