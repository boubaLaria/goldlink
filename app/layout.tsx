import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

// Fonts are imported here but not applied globally
// Individual pages can choose which fonts to use
import {
  Geist,
  Geist_Mono,
  Source_Serif_4,
} from "next/font/google"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })
const sourceSerif = Source_Serif_4({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GoldLink - Location et Vente de Bijoux en Or",
  description:
    "Plateforme de location, vente et estimation de bijoux en or au Maroc",
  generator: "v0.app",
}

/**
 * RootLayout - Root layout wrapper for all pages
 * Provides HTML structure, typography, and global UI components
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
