"use client"

import { useState, useEffect, useMemo } from "react"
import { Meeting } from "@/types/meeting"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, Briefcase, Building2, Check, CalendarDays } from "lucide-react"

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: string) {
  if (status.includes("RE-Agendada"))
    return "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/20"
  if (status.includes("WTSP"))
    return "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20"
  if (status.includes("FONO"))
    return "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20"
  return "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:bg-violet-400/10 dark:text-violet-400 dark:ring-violet-400/20"
}

const SDR_GRADIENTS = [
  { bg: "from-blue-500 to-indigo-600",   glow: "shadow-indigo-500/30" },
  { bg: "from-violet-500 to-purple-600", glow: "shadow-purple-500/30" },
  { bg: "from-emerald-500 to-teal-600",  glow: "shadow-teal-500/30"   },
  { bg: "from-amber-500 to-orange-600",  glow: "shadow-orange-500/30" },
  { bg: "from-rose-500 to-pink-600",     glow: "shadow-pink-500/30"   },
  { bg: "from-cyan-500 to-sky-600",      glow: "shadow-sky-500/30"    },
]

function getTodayEST(): string {
  const nowEST = new Date(Date.now() - 5 * 60 * 60 * 1000)
  const y = nowEST.getUTCFullYear()
  const m = String(nowEST.getUTCMonth() + 1).padStart(2, "0")
  const d = String(nowEST.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function doneKey(date: string, id: string) { return `seg-done-${date}-${id}` }
function getInitials(name: string) { return name.split(" ").slice(0, 2).map(n => n[0] ?? "").join("").toUpperCase() }

// ── Meeting Card ──────────────────────────────────────────────────────────────

function MeetingRow({ meeting, index, selectedDate }: { meeting: Meeting; index: number; selectedDate: string }) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    try { setDone(localStorage.getItem(doneKey(selectedDate, meeting.id)) === "1") } catch {}
  }, [selectedDate, meeting.id])

  const handleToggle = () => {
    try {
      const key = doneKey(selectedDate, meeting.id)
      const next = !(localStorage.getItem(key) === "1")
      next ? localStorage.setItem(key, "1") : localStorage.removeItem(key)
      setDone(next)
    } catch {}
  }

  const meetingTime = new Date(meeting.time)
  const now = new Date()
  const diff = Math.abs(now.getTime() - meetingTime.getTime())
  const isNow = diff < 30 * 60 * 1000
  const isPast = meetingTime < now && !isNow

  return (
    <div
      className={`relative rounded-2xl card-lift animate-fade-in-up transition-all duration-300 glass-sm overflow-hidden ${
        done   ? "opacity-55" :
        isNow  ? "ring-1 ring-primary/30" :
        isPast ? "opacity-70" : ""
      }`}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {/* Done accent */}
      {done && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-l-2xl" />}
      {/* Live glow */}
      {isNow && !done && <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/20 animate-glow pointer-events-none" />}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Time */}
            <div className={`shrink-0 text-center min-w-[44px] pl-2 ${done ? "opacity-50" : ""}`}>
              <p className={`text-xl font-black tabular-nums leading-none ${isNow && !done ? "text-primary" : ""}`}>
                {format(meetingTime, "HH:mm")}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize font-medium">
                {format(meetingTime, "d MMM", { locale: es })}
              </p>
            </div>

            <div className="w-px h-9 bg-border/60 shrink-0" />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className={`font-bold text-sm leading-tight truncate ${done ? "line-through text-muted-foreground" : ""}`}>
                  {meeting.contact.name}
                </p>
                {isNow && !done && (
                  <span className="rounded-full bg-primary text-white text-[9px] px-1.5 py-0.5 font-black animate-pulse leading-none shrink-0">
                    EN VIVO
                  </span>
                )}
              </div>
              {meeting.contact.company && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <Building2 className="h-3 w-3 shrink-0" />
                  {meeting.contact.company}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${getStatusStyle(meeting.status)}`}>
              {meeting.status}
            </span>
            <button
              onClick={handleToggle}
              title={done ? "Desmarcar" : "Marcar completada"}
              className={`btn-press h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                done
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-border text-transparent hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10"
              }`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
          </div>
        </div>

        {meeting.ejecutivo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
            <Briefcase className="h-3.5 w-3.5 shrink-0" />
            <span>Ejecutivo: <span className="font-bold text-foreground">{meeting.ejecutivo}</span></span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── SDR Section ───────────────────────────────────────────────────────────────

function SDRSection({ sdrName, meetings, colorIndex, sectionIndex, selectedDate }: {
  sdrName: string; meetings: Meeting[]; colorIndex: number; sectionIndex: number; selectedDate: string
}) {
  const { bg, glow } = SDR_GRADIENTS[colorIndex % SDR_GRADIENTS.length]
  const sorted = [...meetings].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  return (
    <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: `${sectionIndex * 90}ms` }}>
      {/* SDR header — gradient glass pill */}
      <div className={`flex items-center gap-4 rounded-2xl p-4 bg-gradient-to-r ${bg} shadow-lg ${glow}`}>
        <div className="h-11 w-11 rounded-xl bg-white/25 flex items-center justify-center shrink-0 ring-2 ring-white/30 shadow-inner">
          <span className="text-white text-sm font-black tracking-tight">{getInitials(sdrName)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-base leading-tight truncate tracking-tight">{sdrName}</p>
          <p className="text-white/70 text-xs font-medium mt-0.5">
            {meetings.length} reunión{meetings.length !== 1 ? "es" : ""} agendada{meetings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="shrink-0 h-10 w-10 rounded-xl bg-white/25 flex items-center justify-center ring-2 ring-white/20">
          <span className="text-white font-black text-xl tabular-nums leading-none">{meetings.length}</span>
        </div>
      </div>

      {/* Meeting grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((m, i) => <MeetingRow key={m.id} meeting={m} index={i} selectedDate={selectedDate} />)}
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function FollowSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1].map(i => (
        <div key={i} className="space-y-3 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="h-16 rounded-2xl skeleton" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map(j => (
              <div key={j} className="h-28 rounded-2xl skeleton" style={{ animationDelay: `${j * 40}ms` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function SeguimientoSDR() {
  const [selectedDate, setSelectedDate] = useState("")
  const [activeSdr, setActiveSdr]       = useState<string | null>(null)
  const [meetings, setMeetings]         = useState<Meeting[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => { setSelectedDate(getTodayEST()) }, [])

  useEffect(() => {
    if (!selectedDate) return
    setLoading(true)
    fetch(`/api/meetings?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => { if (data.success) setMeetings(data.meetings) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedDate])

  const groups = useMemo(() => {
    const map = new Map<string, { sdrName: string; meetings: Meeting[] }>()
    for (const m of meetings) {
      if (!map.has(m.sdr.id)) map.set(m.sdr.id, { sdrName: m.sdr.name, meetings: [] })
      map.get(m.sdr.id)!.meetings.push(m)
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.meetings.length - a.meetings.length || a.sdrName.localeCompare(b.sdrName))
  }, [meetings])

  const sdrs = useMemo(() => groups.map(([id, { sdrName }]) => ({ id, name: sdrName })), [groups])
  const visible = activeSdr ? groups.filter(([id]) => id === activeSdr) : groups

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        {/* Date picker */}
        <div className="flex items-center gap-2 glass-sm rounded-xl px-4 py-2.5">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setActiveSdr(null) }}
            className="text-sm font-semibold bg-transparent outline-none cursor-pointer text-foreground"
          />
        </div>

        {/* SDR filters */}
        {sdrs.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveSdr(null)}
              className={`btn-press rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeSdr === null
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : "glass-sm text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos
            </button>
            {sdrs.map(sdr => (
              <button
                key={sdr.id}
                onClick={() => setActiveSdr(activeSdr === sdr.id ? null : sdr.id)}
                className={`btn-press rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                  activeSdr === sdr.id
                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                    : "glass-sm text-muted-foreground hover:text-foreground"
                }`}
              >
                {sdr.name.split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        {/* Count */}
        <span className="ml-auto text-xs font-bold text-muted-foreground tabular-nums">
          {meetings.length} reunión{meetings.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* Content */}
      {loading ? <FollowSkeleton /> : visible.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4 animate-float" />
          <p className="text-sm text-muted-foreground">
            No hay reuniones para{" "}
            {selectedDate
              ? format(new Date(selectedDate + "T12:00:00"), "d 'de' MMMM", { locale: es })
              : "este día"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visible.map(([sdrId, { sdrName, meetings: m }], i) => (
            <SDRSection
              key={sdrId}
              sdrName={sdrName}
              meetings={m}
              colorIndex={groups.findIndex(([id]) => id === sdrId)}
              sectionIndex={i}
              selectedDate={selectedDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
