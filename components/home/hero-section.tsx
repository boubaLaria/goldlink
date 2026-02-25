"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const ctaButtons = [
    {
      href: "/catalog",
      label: "Explorer le catalogue",
      variant: "default" as const,
      showIcon: true,
    },
    {
      href: "/estimation",
      label: "Estimer un bijou",
      variant: "outline" as const,
      showIcon: false,
    },
    {
      href: "/virtual-tryon",
      label: "Essayage Virtuel",
      variant: "outline" as const,
      showIcon: false,
    },
  ]

  return (
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
            {ctaButtons.map((btn) => (
              <Button
                key={btn.href}
                asChild
                size="lg"
                variant={btn.variant}
                className={btn.variant === "outline" ? "bg-transparent" : ""}
              >
                <Link href={btn.href}>
                  {btn.label}
                  {btn.showIcon && <ArrowRight className="ml-2 h-5 w-5" />}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
