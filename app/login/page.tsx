import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { LoginForm } from "@/components/auth/login-form"
import { Providers } from "../providers"

export default function LoginPage() {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <LoginForm />
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
