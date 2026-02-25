"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
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
  )
}
