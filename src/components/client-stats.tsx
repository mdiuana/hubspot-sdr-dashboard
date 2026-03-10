"use client"

import { useState, useEffect, useRef } from "react"
import { Building2, CalendarDays } from "lucide-react"
import { DateRangePicker } from "./date-range-picker"
import { DateRange, todayRange, fmtFull } from "@/lib/date-utils"

interface ClientCount { name: string; count: number }
interface ClientStatsData { total: number; clients: ClientCount[] }

const CLIENT_META: Record<string, { gradient: string; glow: string }> = {
  "ALL IN":   { gradient: "from-blue-500 to-indigo-600",   glow: "rgba(99,102,241,.35)"  },
  "CHILEXPR": { gradient: "from-emerald-500 to-teal-600",  glow: "rgba(16,185,129,.35)"  },
  "nextr":    { gradient: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,.35)"  },
  "GFIRMEX":  { gradient: "from-amber-500 to-orange-600",  glow: "rgba(245,158,11,.35)"  },
  "SIXBELLG": { gradient: "from-rose-500 to-pink-600",     glow: "rgba(244,63,94,.35)"   },
}
function clientMeta(name: string) {
  return CLIENT_META[name] ?? { gradient: "from-slate-500 to-slate-600", glow: "rgba(100,116,139,.3)" }
}

type Period = "month" | "day"

function useCountUp(target: number, active: boolean) {
  const [val, setVal] = useState(0)
  const raf = useRef<number | null>(null)
  useEffect(() => {
    if (!active) { setVal(0); return }
    const dur = 700, start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, active])
  return val
}

function ClientCard({ client, index, visible }: { client: ClientCount; index: number; visible: boolean }) {
  const count = useCountUp(client.count, visible)
  const { gradient, glow } = clientMeta(client.name)

  return (
    <div
      className="relative rounded-2xl overflow-hidden card-lift animate-fade-in-up glass-sm"
      style={{ animationDelay: `${index * 60}ms`, "--glow-color": glow } as React.CSSProperties}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
      <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-xl`} />
      <div className="relative p-4 text-center">
        <p className="text-3xl font-black tabular-nums leading-none animate-scale-pop" style={{ animationDelay: `${index * 60 + 150}ms` }}>
          {count}
        </p>
        <p className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-widest truncate" title={client.name}>
          {client.name}
        </p>
      </div>
    </div>
  )
}

export function ClientStats() {
  const [period, setPeriod] = useState<Period>("month")
  const [dateRange, setDateRange] = useState<DateRange>(todayRange())
  const [data, setData] = useState<ClientStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setLoading(true); setVisible(false)
    const params = new URLSearchParams({ period })
    if (period === "day") {
      params.set("from", dateRange.from)
      params.set("to",   dateRange.to)
    }
    fetch(`/api/stats/clients?${params}`)
      .then(r => r.json())
      .then(json => { if (json.success) { setData(json); setTimeout(() => setVisible(true), 40) } })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period, dateRange.from, dateRange.to])

  function rangeLabel() {
    if (period === "month") return "este mes"
    return dateRange.from === dateRange.to
      ? `el ${fmtFull(dateRange.from)}`
      : `del ${fmtFull(dateRange.from)} al ${fmtFull(dateRange.to)}`
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2 shadow-md shadow-indigo-500/25">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight">Reuniones por Cliente</h2>
            <p className="text-xs text-muted-foreground">
              {loading ? "Cargando..." : `${data?.total ?? 0} agendadas ${rangeLabel()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Range picker — solo visible en modo día */}
          {period === "day" && (
            <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          )}

          {/* Period toggle */}
          <div className="flex items-center rounded-full border glass-sm p-0.5 gap-0.5 shrink-0">
            {(["month", "day"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`btn-press flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  period === p
                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarDays className="h-3 w-3" />
                {p === "month" ? "Mes" : "Rango"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ animationDelay: `${i * 55}ms` }}>
              <div className="h-1 skeleton" />
              <div className="p-4 space-y-2 text-center">
                <div className="h-8 w-12 skeleton mx-auto" />
                <div className="h-2.5 w-16 skeleton mx-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.clients.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Sin datos para el período</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {data.clients.map((c, i) => <ClientCard key={c.name} client={c} index={i} visible={visible} />)}
        </div>
      )}
    </div>
  )
}
