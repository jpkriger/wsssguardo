import { JSX, useEffect, useState } from "react"
import { ThemeContext } from "@/hooks/use-theme"

type Theme = "dark" | "light"

export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sguardo-theme") as Theme | null
      return stored ?? "dark"
    }
    return "dark"
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
      root.style.colorScheme = "dark"
    } else {
      root.classList.remove("dark")
      root.style.colorScheme = "light"
    }
    localStorage.setItem("sguardo-theme", theme)
  }, [theme])

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
