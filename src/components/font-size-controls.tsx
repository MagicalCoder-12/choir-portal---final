"use client"

import { createContext, useContext, useEffect, useState } from "react"

type FontSize = "small" | "medium" | "large" | "x-large"

type FontSizeContextType = {
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
  fontSizeClass: string
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined)

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>("medium")

  useEffect(() => {
    const saved = localStorage.getItem("fontSize") as FontSize
    if (saved) {
      setFontSize(saved)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize)
  }, [fontSize])

  const fontSizeClass = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
    "x-large": "text-xl"
  }[fontSize]

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, fontSizeClass }}>
      {children}
    </FontSizeContext.Provider>
  )
}

export function useFontSize() {
  const context = useContext(FontSizeContext)
  if (context === undefined) {
    throw new Error("useFontSize must be used within a FontSizeProvider")
  }
  return context
}

export function FontSizeControls() {
  const { fontSize, setFontSize } = useFontSize()

  const sizes: { value: FontSize; label: string; className: string }[] = [
    { value: "small", label: "A", className: "text-xs" },
    { value: "medium", label: "A", className: "text-sm" },
    { value: "large", label: "A", className: "text-base" },
    { value: "x-large", label: "A", className: "text-lg" }
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
      {sizes.map((size) => (
        <button
          key={size.value}
          onClick={() => setFontSize(size.value)}
          className={`px-2 py-1 rounded transition-colors ${
            fontSize === size.value
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted-foreground/20"
          }`}
          title={`${size.label} - ${size.value}`}
        >
          <span className={size.className}>{size.label}</span>
        </button>
      ))}
    </div>
  )
}