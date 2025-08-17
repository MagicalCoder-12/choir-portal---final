"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { FontSizeProvider } from "./font-size-controls"

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <SessionProvider>
      <NextThemesProvider {...props}>
        <FontSizeProvider>
          {children}
        </FontSizeProvider>
      </NextThemesProvider>
    </SessionProvider>
  )
}