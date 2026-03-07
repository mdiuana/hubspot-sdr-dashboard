"use client"

import { Meeting } from "@/types/meeting"
import { Calendar, Phone, MessageCircle, RefreshCw } from "lucide-react"

export function StatsBar({ meetings }: { meetings: Meeting[] }) {
  const total = meetings.length
  const agendadasFono = meetings.filter(m => m.status === "PR Agendada FONO").length
  const agendadasWtsp = meetings.filter(m => m.status === "PR Agendada WTSP").length
  const reagendadas   = meetings.filter(m => m.status === "Pr RE-Agendada").length

  const stats = [
    {
      label: "Total Hoy",
      value: total,
      icon: Calendar,
      cardClass: "stat-card-indigo",
      iconClass: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300",
      valueClass: "text-indigo-700 dark:text-indigo-300",
    },
    {
      label: "Por Teléfono",
      value: agendadasFono,
      icon: Phone,
      cardClass: "stat-card-blue",
      iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300",
      valueClass: "text-blue-700 dark:text-blue-300",
    },
    {
      label: "Por WhatsApp",
      value: agendadasWtsp,
      icon: MessageCircle,
      cardClass: "stat-card-green",
      iconClass: "bg-green-100 text-green-600 dark:bg-green-900/60 dark:text-green-300",
      valueClass: "text-green-700 dark:text-green-300",
    },
    {
      label: "Re-agendadas",
      value: reagendadas,
      icon: RefreshCw,
      cardClass: "stat-card-yellow",
      iconClass: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/60 dark:text-yellow-300",
      valueClass: "text-yellow-700 dark:text-yellow-300",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map(s => (
        <div
          key={s.label}
          className={`rounded-xl border p-4 flex flex-col items-center gap-2 shadow-sm ${s.cardClass}`}
        >
          <div className={`rounded-full p-2 ${s.iconClass}`}>
            <s.icon className="h-4 w-4" />
          </div>
          <p className={`text-3xl font-extrabold tabular-nums ${s.valueClass}`}>{s.value}</p>
          <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
