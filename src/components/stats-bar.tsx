"use client"

import { Meeting } from "@/types/meeting"
import { Calendar, Phone, MessageCircle, RefreshCw } from "lucide-react"

export function StatsBar({ meetings }: { meetings: Meeting[] }) {
  const total = meetings.length
  const agendadasFono = meetings.filter(m => m.status === "PR Agendada FONO").length
  const agendadasWtsp = meetings.filter(m => m.status === "PR Agendada WTSP").length
  const reagendadas = meetings.filter(m => m.status === "Pr RE-Agendada").length

  const stats = [
    { label: "Total Hoy", value: total, icon: Calendar, color: "text-primary" },
    { label: "Por Teléfono", value: agendadasFono, icon: Phone, color: "text-blue-600" },
    { label: "Por WhatsApp", value: agendadasWtsp, icon: MessageCircle, color: "text-green-600" },
    { label: "Re-agendadas", value: reagendadas, icon: RefreshCw, color: "text-yellow-600" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
          <s.icon className={`mx-auto h-5 w-5 ${s.color}`} />
          <p className="mt-1 text-2xl font-bold">{s.value}</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
