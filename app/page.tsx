import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection, FeaturesSection, CTASection } from "@/components/home"
import { Providers } from "./providers"

/**
 * HomePage - Landing page for GoldLink
 * Composed of reusable section components for better maintainability
 */
export default function HomePage() {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1">
          <HeroSection />
          <FeaturesSection />
          <CTASection />
        </main>
        
        <Footer />
      </div>
    </Providers>
  )
}
