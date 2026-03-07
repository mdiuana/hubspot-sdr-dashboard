"use client"

import { useState, useEffect } from "react"
import { Meeting } from "@/types/meeting"
import { format } from "date-fns"
import { TableIcon, Video } from "lucide-react"

function StatusPill({ status }: { status: string }) {
  let cls = "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20"
  if (status.includes("RE-Agendada")) cls = "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/20"
  else if (status.includes("WTSP"))   cls = "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20"
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${cls}`}>
      {status}
    </span>
  )
}

function LiveRow({ m, index }: { m: Meeting; index: number }) {
  const meetingTime = new Date(m.time)
  const [isNow, setIsNow] = useState(false)

  useEffect(() => {
    const update = () => setIsNow(Math.abs(new Date().getTime() - meetingTime.getTime()) < 30 * 60 * 1000)
    update()
    const t = setInterval(update, 60_000)
    return () => clearInterval(t)
  }, [m.time])

  return (
    <tr
      className={`group transition-all duration-200 animate-fade-in-up ${
        isNow
          ? "bg-primary/5 dark:bg-primary/8"
          : "hover:bg-white/40 dark:hover:bg-white/5"
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <td className="px-5 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm font-bold ${isNow ? "text-primary" : ""}`}>
            {format(meetingTime, "HH:mm")}
          </span>
          {isNow && (
            <span className="rounded-full bg-primary text-white text-[9px] px-1.5 py-0.5 font-black animate-pulse leading-none">
              EN VIVO
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <p className="font-semibold text-sm leading-tight">{m.contact.name}</p>
        {m.contact.company && (
          <p className="text-xs text-muted-foreground mt-0.5">{m.contact.company}</p>
        )}
      </td>
      <td className="px-5 py-3.5 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {m.ejecutivo ?? <span className="text-muted-foreground/30">—</span>}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center rounded-full glass-sm px-2.5 py-1 text-xs font-bold">
          {m.sdr.name.split(" ")[0]}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <StatusPill status={m.status} />
      </td>
      <td className="px-5 py-3.5 text-center hidden sm:table-cell">
        {m.meetingLink ? (
          <a
            href={m.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press inline-flex items-center justify-center rounded-xl bg-primary/10 text-primary p-2 hover:bg-primary hover:text-white transition-all"
            title="Abrir reunión"
          >
            <Video className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-muted-foreground/20 text-sm">—</span>
        )}
      </td>
    </tr>
  )
}

export function MeetingsTable({ meetings }: { meetings: Meeting[] }) {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "120ms" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/30 dark:border-white/5">
        <div className="rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 p-1.5 shadow-sm">
          <TableIcon className="h-3.5 w-3.5 text-white" />
        </div>
        <h2 className="text-sm font-bold">Reuniones del Día</h2>
        <span className="ml-auto rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold tabular-nums">
          {meetings.length} reunión{meetings.length !== 1 ? "es" : ""}
        </span>
      </div>

      {meetings.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <TableIcon className="h-9 w-9 opacity-20 animate-float" />
          <p className="text-sm">No hay reuniones agendadas para hoy</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20 dark:border-white/5 text-[11px] text-muted-foreground uppercase tracking-widest font-bold">
                <th className="px-5 py-3 text-left">Hora</th>
                <th className="px-5 py-3 text-left">Lead</th>
                <th className="px-5 py-3 text-left hidden md:table-cell">Ejecutivo</th>
                <th className="px-5 py-3 text-left">SDR</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-center hidden sm:table-cell">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/15 dark:divide-white/5">
              {meetings.map((m, i) => <LiveRow key={m.id} m={m} index={i} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
