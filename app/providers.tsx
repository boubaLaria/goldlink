"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"

/**
 * Providers - Root context provider wrapper
 * Handles global providers like theme, state management, etc.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
