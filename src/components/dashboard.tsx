"use client"

import { useState, useEffect } from "react"
import { Meeting } from "@/types/meeting"
import { ClientStats } from "./client-stats"
import { SDRChart, SDRCount } from "./sdr-chart"
import { MeetingsTable } from "./meetings-table"
import { SeguimientoSDR } from "./seguimiento-sdr"
import { Leaderboard, RankEntry } from "./leaderboard"
import { ThemeToggle } from "./theme-toggle"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { RefreshCw, BarChart2, Users, ChevronUp, ChevronDown } from "lucide-react"
import { DateRange, todayRange, monthRange } from "@/lib/date-utils"

interface AgendadasData {
  total: number
  bySDR: SDRCount[]
  meetings: Meeting[]
  scopeMissing: boolean
}

type Tab = "hoy" | "seguimiento"

const TABS: { id: Tab; label: string; icon: typeof BarChart2 }[] = [
  { id: "hoy",         label: "SDR HOY",        icon: BarChart2 },
  { id: "seguimiento", label: "SEGUIMIENTO SDR", icon: Users     },
]

export function Dashboard() {
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("hoy")

  // Reuniones de hoy (tabla)
  const [todayMeetings, setTodayMeetings] = useState<Meeting[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshing, setRefreshing]   = useState(false)

  // Sección: Reuniones por SDR (chart)
  const [chartRange, setChartRange]     = useState<DateRange>({ from: "", to: "" })
  const [agendadas, setAgendadas]       = useState<AgendadasData>({ total: 0, bySDR: [], meetings: [], scopeMissing: false })
  const [agendadasLoading, setAgendadasLoading] = useState(false)

  // Sección: Leaderboard
  const [lbRange, setLbRange]         = useState<DateRange>({ from: "", to: "" })
  const [ranking, setRanking]         = useState<RankEntry[]>([])
  const [rankingLoading, setRankingLoading] = useState(true)

  // Inicializar ambos rangos con "Hoy" en EST
  useEffect(() => {
    setChartRange(todayRange())
    setLbRange(monthRange())
  }, [])

  // ── Fetch functions ─────────────────────────────────────────

  const fetchTodayMeetings = async () => {
    setRefreshing(true)
    try {
      const res = await fetch("/api/meetings")
      const data = await res.json()
      if (data.success) setTodayMeetings(data.meetings)
    } catch (e) { console.error(e) }
    finally { setLastRefresh(new Date()); setRefreshing(false) }
  }

  const fetchAgendadas = async (range: DateRange) => {
    if (!range.from || !range.to) return
    setAgendadasLoading(true)
    try {
      const res = await fetch(`/api/meetings/agendadas?from=${range.from}&to=${range.to}`)
      const data = await res.json()
      if (data.success) setAgendadas({ total: data.total, bySDR: data.bySDR, meetings: data.meetings, scopeMissing: data.scopeMissing })
    } catch (e) { console.error(e) }
    finally { setAgendadasLoading(false) }
  }

  const fetchLeaderboard = async (range: DateRange) => {
    if (!range.from || !range.to) return
    setRankingLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?from=${range.from}&to=${range.to}`)
      const data = await res.json()
      if (data.success) setRanking(data.ranking)
    } catch (e) { console.error(e) }
    finally { setRankingLoading(false) }
  }

  // ── Effects ─────────────────────────────────────────────────

  // Tabla reuniones hoy
  useEffect(() => { fetchTodayMeetings() }, [])
  useEffect(() => {
    const t = setInterval(fetchTodayMeetings, 30_000)
    return () => clearInterval(t)
  }, [])

  // Chart: fetch cuando cambia chartRange
  useEffect(() => { fetchAgendadas(chartRange) }, [chartRange.from, chartRange.to])
  useEffect(() => {
    if (!chartRange.from) return
    const t = setInterval(() => fetchAgendadas(chartRange), 30_000)
    return () => clearInterval(t)
  }, [chartRange.from, chartRange.to])

  // Leaderboard: fetch cuando cambia lbRange
  useEffect(() => { fetchLeaderboard(lbRange) }, [lbRange.from, lbRange.to])
  useEffect(() => {
    if (!lbRange.from) return
    const t = setInterval(() => fetchLeaderboard(lbRange), 30_000)
    return () => clearInterval(t)
  }, [lbRange.from, lbRange.to])

  const todaySorted = [...todayMeetings].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  return (
    <div className="mesh-bg min-h-screen flex flex-col">

      {/* ── NavBar flotante ── */}
      <div className="sticky top-3 z-30 flex justify-center px-4 pointer-events-none">
        <div
          className={`glass-heavy rounded-2xl overflow-hidden transition-[max-height] duration-300 ease-in-out pointer-events-auto
            w-[92%] sm:w-[480px] lg:w-[38vw] xl:w-[35vw] min-w-[260px] ${
            navCollapsed ? "max-h-[56px]" : "max-h-[100px]"
          }`}
        >
          <div className="px-4 sm:px-5">
            <div className="flex items-center justify-between gap-4 h-14">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 p-2 shadow-md shadow-indigo-500/30">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${navCollapsed ? "max-w-0 opacity-0" : "max-w-xs opacity-100"}`}>
                  <h1 className="text-sm font-extrabold tracking-tight leading-none whitespace-nowrap">SDR Dashboard</h1>
                  <p className="text-[11px] text-muted-foreground capitalize mt-0.5 whitespace-nowrap" suppressHydrationWarning>
                    {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!navCollapsed && (
                  <div className="hidden sm:flex flex-col items-end mr-1">
                    <span className="text-[10px] text-muted-foreground leading-tight">Actualizado</span>
                    <span className="text-xs font-bold tabular-nums">
                      {lastRefresh ? format(lastRefresh, "HH:mm:ss") : "--:--:--"}
                    </span>
                  </div>
                )}
                <ThemeToggle />
                <button
                  onClick={() => {
                    fetchTodayMeetings()
                    fetchAgendadas(chartRange)
                    fetchLeaderboard(lbRange)
                  }}
                  disabled={refreshing}
                  className="btn-press glass-sm rounded-xl p-2.5 disabled:opacity-40"
                  title="Actualizar"
                >
                  <RefreshCw className={`h-4 w-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setNavCollapsed(v => !v)}
                  className="btn-press glass-sm rounded-xl p-2.5"
                  title={navCollapsed ? "Expandir navbar" : "Minimizar navbar"}
                >
                  {navCollapsed
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    : <ChevronUp   className="h-4 w-4 text-muted-foreground" />
                  }
                </button>
              </div>
            </div>

            <div className="flex gap-0.5 -mb-px">
              {TABS.map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`btn-press relative flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-slide-in" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── SDR HOY ── */}
      {activeTab === "hoy" && (
        <main key="hoy" className="w-full animate-tab-enter">
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              padding: "1rem",
              paddingTop: "68px",
              minHeight: "100svh",
              boxSizing: "border-box",
            }}
          >
            {/* Chart + Leaderboard */}
            <div
              style={{
                height: "calc(100svh - 68px - 1rem - 1rem - 230px - 1rem)",
                minHeight: 260,
                display: "flex",
                gap: "1rem",
                overflow: "hidden",
              }}
            >
              {/* Chart — 80% */}
              <div style={{ flex: 4, minWidth: 0, height: "100%", overflow: "hidden" }}>
                {chartRange.from && (
                  <SDRChart
                    bySDR={agendadas.bySDR}
                    total={agendadas.total}
                    loading={agendadasLoading}
                    scopeMissing={agendadas.scopeMissing}
                    dateRange={chartRange}
                    onRangeChange={setChartRange}
                    fill
                  />
                )}
              </div>

              {/* Leaderboard — 20% */}
              <div style={{ flex: 1, minWidth: 140, maxWidth: 240, height: "100%", overflow: "hidden" }}>
                {lbRange.from && (
                  <Leaderboard
                    ranking={ranking}
                    loading={rankingLoading}
                    dateRange={lbRange}
                    onRangeChange={setLbRange}
                  />
                )}
              </div>
            </div>

            {/* ClientStats — self-contained */}
            <ClientStats />

          </section>

          {/* MeetingsTable */}
          <div className="px-4 sm:px-6 lg:px-10 pb-8">
            <MeetingsTable meetings={todaySorted} />
          </div>
        </main>
      )}

      {/* ── SEGUIMIENTO SDR ── */}
      {activeTab === "seguimiento" && (
        <main key="seguimiento" className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 animate-tab-enter">
          <SeguimientoSDR />
        </main>
      )}

      <footer className="py-5 text-center text-xs text-muted-foreground/60 mt-auto">
        <span className="font-semibold text-foreground/70">All In Agency</span> · SDR Dashboard · Powered by HubSpot
      </footer>
    </div>
  )
}
