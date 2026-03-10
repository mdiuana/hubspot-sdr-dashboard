"use client"

import { useState, useRef, useEffect } from "react"
import { CalendarDays } from "lucide-react"
import { DateRange, fmtShort, getTodayEST, todayRange, weekRange, monthRange } from "@/lib/date-utils"

export interface RankEntry {
  id: string
  name: string
  email: string
  count: number
}

function getFirstName(full: string) {
  return full.split(" ")[0]
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0] ?? "").join("").toUpperCase()
}

const AGENDA_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-600",
]

const PRES_COLORS = [
  "from-emerald-500 to-teal-600",
  "from-teal-500 to-cyan-600",
  "from-green-500 to-emerald-600",
  "from-cyan-500 to-sky-600",
  "from-sky-500 to-blue-500",
]

interface LeaderboardProps {
  agendadas: RankEntry[]
  presentadas: RankEntry[]
  loading: boolean
  dateRange: DateRange
  onRangeChange: (range: DateRange) => void
}

// ── Compact calendar dropdown ────────────────────────────────────
function CalendarDropdown({ dateRange, onChange }: { dateRange: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const today = getTodayEST()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  function apply(r: DateRange) { onChange(r); setOpen(false) }

  const rangeLabel = dateRange.from === dateRange.to
    ? fmtShort(dateRange.from)
    : `${fmtShort(dateRange.from)}–${fmtShort(dateRange.to)}`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`btn-press flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition-colors ${
          open ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        }`}
        title="Cambiar período"
      >
        <CalendarDays className="h-3 w-3 shrink-0" />
        <span className="text-[10px] font-bold tabular-nums">{rangeLabel}</span>
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 z-50 w-48 animate-fade-in-up"
          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.18))" }}>
          <div className="rounded-2xl border border-border/40 bg-card/95 backdrop-blur-md p-3 flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-[9px] font-black tracking-widest uppercase text-muted-foreground/50 px-1 mb-1">Período</p>
              {[
                { label: "Hoy",    fn: todayRange },
                { label: "Semana", fn: weekRange  },
                { label: "Mes",    fn: monthRange },
              ].map(({ label, fn }) => {
                const r = fn()
                const active = dateRange.from === r.from && dateRange.to === r.to
                return (
                  <button
                    key={label}
                    onClick={() => apply(r)}
                    className={`btn-press w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
                      active ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    {active && <span className="mr-1.5 text-primary">✓</span>}
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="h-px bg-border/40 mx-1" />
            <div className="flex flex-col gap-1.5">
              <p className="text-[9px] font-black tracking-widest uppercase text-muted-foreground/50 px-1">Personalizado</p>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateRange.from}
                  max={dateRange.to}
                  onChange={e => onChange({ ...dateRange, from: e.target.value })}
                  className="flex-1 min-w-0 text-[11px] font-medium bg-muted/40 border border-border/30 rounded-lg px-2 py-1.5 outline-none focus:border-primary/60 focus:bg-muted/60 transition-colors"
                />
                <span className="text-[10px] text-muted-foreground/60 shrink-0">→</span>
                <input
                  type="date"
                  value={dateRange.to}
                  min={dateRange.from}
                  max={today}
                  onChange={e => onChange({ ...dateRange, to: e.target.value })}
                  className="flex-1 min-w-0 text-[11px] font-medium bg-muted/40 border border-border/30 rounded-lg px-2 py-1.5 outline-none focus:border-primary/60 focus:bg-muted/60 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Ranking list ─────────────────────────────────────────────────
function RankList({ entries, colors, loading }: { entries: RankEntry[]; colors: string[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-9 rounded-xl skeleton" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    )
  }
  if (entries.length === 0) {
    return <p className="text-[11px] text-muted-foreground text-center py-3">Sin datos</p>
  }

  const top  = entries[0]
  const rest = entries.slice(1)

  return (
    <div className="flex flex-col gap-1.5">
      {/* #1 */}
      <div className={`relative rounded-xl p-2.5 bg-gradient-to-br ${colors[0]} shadow-sm animate-fade-in-up shrink-0`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-white/25 flex items-center justify-center shrink-0 ring-1 ring-white/30 text-[10px] font-black text-white">
            {getInitials(top.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-xs leading-tight truncate">{getFirstName(top.name)} 🐐</p>
            <p className="text-white/70 text-[10px]">{top.count}</p>
          </div>
          <span className="text-white/30 text-[9px] font-black shrink-0">#1</span>
        </div>
      </div>

      {/* Resto */}
      {rest.map((entry, i) => {
        const pos = i + 2
        const gradient = colors[pos - 1] ?? colors[colors.length - 1]
        return (
          <div
            key={entry.id}
            className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 glass-sm animate-fade-in-up min-w-0 shrink-0"
            style={{ animationDelay: `${pos * 50}ms` }}
          >
            <span className="text-[9px] font-black text-muted-foreground/50 w-3.5 shrink-0 text-right">#{pos}</span>
            <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 text-[9px] font-black text-white`}>
              {getInitials(entry.name)}
            </div>
            <p className="flex-1 text-xs font-semibold truncate min-w-0">{getFirstName(entry.name)}</p>
            <span className="text-xs font-black tabular-nums text-muted-foreground shrink-0">{entry.count}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Leaderboard ──────────────────────────────────────────────────
export function Leaderboard({ agendadas, presentadas, loading, dateRange, onRangeChange }: LeaderboardProps) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-3 h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-xs font-black tracking-widest uppercase text-muted-foreground">Leaderboard</h2>
        <CalendarDropdown dateRange={dateRange} onChange={onRangeChange} />
      </div>

      {/* Scroll container */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">

        {/* Agendadas */}
        <div>
          <p className="text-[9px] font-black tracking-widest uppercase text-muted-foreground/50 mb-1.5">Agendadas</p>
          <RankList entries={agendadas} colors={AGENDA_COLORS} loading={loading} />
        </div>

        {/* Divider */}
        <div className="h-px bg-border/30 shrink-0" />

        {/* Presentadas */}
        <div>
          <p className="text-[9px] font-black tracking-widest uppercase text-muted-foreground/50 mb-1.5">Presentadas</p>
          <RankList entries={presentadas} colors={PRES_COLORS} loading={loading} />
        </div>

      </div>
    </div>
  )
}
