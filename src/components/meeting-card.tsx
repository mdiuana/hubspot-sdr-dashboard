"use client"

import { useState, useEffect } from "react"
import { Meeting } from "@/types/meeting"
import { format } from "date-fns"
import { Clock, Building2, Mail, Video, Briefcase, CalendarCheck } from "lucide-react"

function getStatusStyle(status: string) {
  if (status.includes("RE-Agendada")) return "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/20"
  if (status.includes("WTSP"))        return "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20"
  if (status.includes("FONO"))        return "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20"
  return "bg-secondary text-secondary-foreground ring-border"
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

const SDR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
  "from-orange-500 to-rose-600",
]

function sdrGradient(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % SDR_GRADIENTS.length
  return SDR_GRADIENTS[hash]
}

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const meetingTime = new Date(meeting.time)
  const [isNow, setIsNow]   = useState(false)
  const [isPast, setIsPast] = useState(false)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const diff = Math.abs(now.getTime() - meetingTime.getTime())
      const live = diff < 30 * 60 * 1000
      setIsNow(live)
      setIsPast(meetingTime < now && !live)
    }
    update()
    const t = setInterval(update, 60_000)
    return () => clearInterval(t)
  }, [meeting.time])

  return (
    <div
      className={`relative rounded-2xl card-lift glass-sm overflow-hidden transition-all duration-300 ${
        isNow  ? "ring-1 ring-primary/30" :
        isPast ? "opacity-65" : ""
      }`}
    >
      {isNow && (
        <>
          <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/20 animate-glow pointer-events-none" />
          <span className="absolute -top-px left-4 rounded-b-full bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-0.5 text-[10px] font-black text-white shadow-md shadow-primary/40">
            EN VIVO
          </span>
        </>
      )}

      <div className="p-4 flex items-start gap-3">
        {/* SDR Avatar */}
        <div
          className={`shrink-0 rounded-xl h-10 w-10 flex items-center justify-center text-white text-xs font-black shadow-md bg-gradient-to-br ${sdrGradient(meeting.sdr.name)}`}
          title={meeting.sdr.name}
        >
          {getInitials(meeting.sdr.name)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-tight truncate">{meeting.contact.name}</h3>
              {meeting.contact.company && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                  <Building2 className="h-3 w-3 shrink-0" />
                  {meeting.contact.company}
                </p>
              )}
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 shrink-0 ${getStatusStyle(meeting.status)}`}>
              {meeting.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className={`flex items-center gap-1 font-bold ${isNow ? "text-primary" : "text-foreground"}`}>
              <Clock className="h-3 w-3" />
              {format(meetingTime, "HH:mm")}
            </span>
            {meeting.contact.email && (
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <Mail className="h-3 w-3 shrink-0" />
                {meeting.contact.email}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border/30 pt-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
              <span className={`inline-block h-2 w-2 rounded-full bg-gradient-to-br ${sdrGradient(meeting.sdr.name)}`} />
              {meeting.sdr.name}
            </span>
            {meeting.ejecutivo && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {meeting.ejecutivo}
              </span>
            )}
            {meeting.fechaAgendamiento && (
              <span className="flex items-center gap-1">
                <CalendarCheck className="h-3 w-3" />
                {format(new Date(meeting.fechaAgendamiento), "dd/MM/yyyy")}
              </span>
            )}
          </div>
        </div>

        {meeting.meetingLink && (
          <a
            href={meeting.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press shrink-0 rounded-xl bg-primary/10 text-primary p-2.5 hover:bg-primary hover:text-white transition-all"
            title="Unirse a la reunión"
          >
            <Video className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  )
}
