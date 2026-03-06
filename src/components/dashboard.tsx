"use client"

import { useState, useEffect, useMemo } from "react"
import { Meeting, SDR } from "@/types/meeting"
import { MeetingCard } from "./meeting-card"
import { StatsBar } from "./stats-bar"
import { SDRFilter } from "./sdr-filter"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { RefreshCw } from "lucide-react"

export function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [selectedSDR, setSelectedSDR] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  
  // Construir lista única de SDRs desde las reuniones
  const sdrs = useMemo(() => {
    const uniqueSDRs = new Map<string, SDR>()
    meetings.forEach(m => {
      if (!uniqueSDRs.has(m.sdr.id)) {
        uniqueSDRs.set(m.sdr.id, m.sdr)
      }
    })
    return Array.from(uniqueSDRs.values())
  }, [meetings])

  // Initial fetch
  useEffect(() => {
    handleRefresh()
  }, [])

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh()
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/meetings')
      const data = await response.json()
      
      if (data.success) {
        setMeetings(data.meetings)
      } else {
        console.error('Error fetching meetings:', data.error)
        // Keep current meetings on error
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
      // Keep current meetings on error
    } finally {
      setLastRefresh(new Date())
      setRefreshing(false)
    }
  }

  const filtered = selectedSDR
    ? meetings.filter(m => m.sdr.email === selectedSDR)
    : meetings

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  )

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                📅 Reuniones del Día
              </h1>
              <p className="text-sm text-muted-foreground capitalize">
                {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:block">
                Última actualización: {format(lastRefresh, "HH:mm:ss")}
              </span>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-md border bg-white p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <StatsBar meetings={meetings} />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <SDRFilter sdrs={sdrs} selected={selectedSDR} onChange={setSelectedSDR} />
          <p className="text-xs text-muted-foreground">
            {sorted.length} reunión{sorted.length !== 1 ? "es" : ""}
          </p>
        </div>

        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <p className="text-muted-foreground">No hay reuniones para mostrar</p>
            </div>
          ) : (
            sorted.map(m => <MeetingCard key={m.id} meeting={m} />)
          )}
        </div>
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        All In Agency · SDR Dashboard · Powered by HubSpot
      </footer>
    </div>
  )
}
