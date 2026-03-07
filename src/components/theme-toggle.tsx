"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const [dark, setDark]       = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    try { localStorage.setItem("theme", next ? "dark" : "light") } catch {}
  }

  if (!mounted) return <div className="h-9 w-9 rounded-xl skeleton" />

  return (
    <button
      onClick={toggle}
      className="btn-press glass-sm rounded-xl p-2.5 transition-all"
      title={dark ? "Modo claro" : "Modo oscuro"}
    >
      {dark
        ? <Sun  className="h-4 w-4 text-amber-400" />
        : <Moon className="h-4 w-4 text-slate-500" />
      }
    </button>
  )
}
