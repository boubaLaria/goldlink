import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { RegisterForm } from "@/components/auth/register-form"
import { Providers } from "../providers"

export default function RegisterPage() {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <RegisterForm />
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
