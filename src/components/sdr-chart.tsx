"use client"

import { useState, useEffect } from "react"
import { BarChart2, CalendarDays, Loader2, Maximize2, Minimize2 } from "lucide-react"

export interface SDRCount {
  sdrId: string
  sdrName: string
  sdrEmail: string
  count: number
}

interface SDRChartProps {
  bySDR: SDRCount[]
  total: number
  loading: boolean
  scopeMissing: boolean
  selectedDate: string
  onDateChange: (date: string) => void
  barHeight?: number
  fill?: boolean   // ocupa toda la altura del contenedor padre
}

const BAR_COLORS = [
  "bar-gradient-blue",
  "bar-gradient-violet",
  "bar-gradient-emerald",
  "bar-gradient-amber",
  "bar-gradient-rose",
  "bar-gradient-cyan",
  "bar-gradient-orange",
  "bar-gradient-pink",
]

const LABEL_COLORS = [
  "text-blue-500 dark:text-blue-400",
  "text-violet-500 dark:text-violet-400",
  "text-emerald-500 dark:text-emerald-400",
  "text-amber-500 dark:text-amber-400",
  "text-rose-500 dark:text-rose-400",
  "text-cyan-500 dark:text-cyan-400",
  "text-orange-500 dark:text-orange-400",
  "text-pink-500 dark:text-pink-400",
]

const BAR_GLOWS = [
  "rgba(59,130,246,.5)",
  "rgba(139,92,246,.5)",
  "rgba(16,185,129,.5)",
  "rgba(245,158,11,.5)",
  "rgba(244,63,94,.5)",
  "rgba(6,182,212,.5)",
  "rgba(249,115,22,.5)",
  "rgba(236,72,153,.5)",
]

export function SDRChart({
  bySDR,
  total,
  loading,
  scopeMissing,
  selectedDate,
  onDateChange,
  barHeight = 120,
  fill = false,
}: SDRChartProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const max = Math.max(...bySDR.map(s => s.count), 1)

  // Cerrar con Escape
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fullscreen])

  /* ── Render barras (tamaño fijo, card normal) ── */
  const renderBars = (H: number) => {
    if (loading) {
      return (
        <div className="flex items-end gap-3 justify-center pl-6" style={{ height: `${H + 32}px` }}>
          {[55, 35, 80, 50, 25, 65, 40].map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="h-3 w-8 skeleton" />
              <div className="w-full skeleton rounded-xl" style={{ height: `${(h / 100) * H}px` }} />
              <div className="h-2.5 w-12 skeleton" />
            </div>
          ))}
        </div>
      )
    }

    if (bySDR.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <BarChart2 className="h-10 w-10 text-muted-foreground/20 animate-float" />
          <p className="text-sm text-muted-foreground">Ningún SDR agendó reuniones en esa fecha</p>
        </div>
      )
    }

    return (
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none" style={{ bottom: "36px" }}>
          {[25, 50, 75, 100].map(pct => (
            <div
              key={pct}
              className="absolute w-full border-t border-dashed border-muted-foreground/10"
              style={{ bottom: `${pct}%` }}
            >
              <span className="absolute left-0 -translate-y-full text-[9px] text-muted-foreground/40 font-mono">
                {Math.round((pct / 100) * max) || ""}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-3 pl-5" style={{ height: `${H + 36}px` }}>
          {bySDR.map((sdr, i) => {
            const pct      = Math.round((sdr.count / max) * 100)
            const color    = BAR_COLORS[i % BAR_COLORS.length]
            const labelColor = LABEL_COLORS[i % LABEL_COLORS.length]
            const glow     = BAR_GLOWS[i % BAR_GLOWS.length]
            const isWinner = sdr.count === max

            return (
              <div
                key={sdr.sdrId}
                className="flex flex-col items-center gap-1 flex-1 min-w-0"
                style={{ height: `${H + 36}px` }}
              >
                {/* Barra + número flotando encima */}
                <div className="relative w-full" style={{ height: `${H}px` }}>
                  {/* Número + corona: posicionado justo sobre la punta de la barra */}
                  <div
                    className="absolute left-0 right-0 flex flex-col items-center pointer-events-none"
                    style={{ bottom: `calc(${pct}% + 4px)` }}
                  >
                    {isWinner && (
                      <svg
                        viewBox="0 0 20 13"
                        className="w-4 h-3 shrink-0"
                        style={{
                          animation: `crownDrop 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 70 + 500}ms both, crownGlow 2.5s ease-in-out ${i * 70 + 1050}ms infinite`,
                        }}
                      >
                        <path d="M1 11 L4.5 3.5 L10 8.5 L15.5 1 L19 11 Z" fill="#facc15" stroke="#b45309" strokeWidth="0.7" strokeLinejoin="round" />
                        <circle cx="1"   cy="11.5" r="1.3" fill="#facc15" />
                        <circle cx="10"  cy="9"    r="1.3" fill="#facc15" />
                        <circle cx="19"  cy="11.5" r="1.3" fill="#facc15" />
                      </svg>
                    )}
                    <span
                      className={`font-black tabular-nums animate-fade-in-up ${isWinner ? "text-base" : "text-sm"} ${labelColor}`}
                      style={{ animationDelay: `${i * 70 + 350}ms`, lineHeight: 1 }}
                    >
                      {sdr.count}
                    </span>
                  </div>

                  {/* Barra */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 ${color} ${isWinner ? "rounded-t-2xl" : "rounded-xl bar-animate"}`}
                    style={{
                      height: `${pct}%`,
                      ...(isWinner
                        ? {
                            '--glow-c': glow,
                            animation: `barGrow 0.6s cubic-bezier(0.34,1.1,0.64,1) ${i * 70}ms both, barGlowPulse 2.2s ease-in-out ${i * 70 + 700}ms infinite`,
                          }
                        : { animationDelay: `${i * 70}ms`, boxShadow: `0 8px 24px -4px ${glow}` }
                      ),
                    } as React.CSSProperties}
                  />
                </div>

                {/* Nombre */}
                <span
                  className={`text-[11px] text-center leading-tight truncate w-full animate-fade-in-up ${isWinner ? "font-bold text-foreground" : "font-semibold text-muted-foreground"}`}
                  title={sdr.sdrName}
                  style={{ animationDelay: `${i * 70 + 450}ms` }}
                >
                  {sdr.sdrName.split(" ")[0]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── Render barras (fullscreen — 100% CSS, sin px fijos) ── */
  const renderBarsFullscreen = () => {
    if (loading) {
      return (
        <div className="flex items-stretch gap-3 sm:gap-6 h-full pl-4">
          {[55, 35, 80, 50, 25, 65, 40].map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="h-14 w-full flex items-end justify-center pb-1 shrink-0">
                <div className="h-4 w-8 skeleton rounded" />
              </div>
              <div className="flex-1 min-h-0 w-full relative">
                <div className="absolute bottom-0 left-0 right-0 skeleton rounded-2xl" style={{ height: `${h}%` }} />
              </div>
              <div className="h-3 w-12 skeleton rounded shrink-0" />
            </div>
          ))}
        </div>
      )
    }

    if (bySDR.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <BarChart2 className="h-16 w-16 text-muted-foreground/20 animate-float" />
          <p className="text-base text-muted-foreground">Ningún SDR agendó reuniones en esa fecha</p>
        </div>
      )
    }

    return (
      <div className="flex items-stretch gap-3 sm:gap-6 h-full pl-4">
        {bySDR.map((sdr, i) => {
          const pct        = Math.round((sdr.count / max) * 100)
          const color      = BAR_COLORS[i % BAR_COLORS.length]
          const labelColor = LABEL_COLORS[i % LABEL_COLORS.length]
          const glow       = BAR_GLOWS[i % BAR_GLOWS.length]
          const isWinner   = sdr.count === max

          return (
            <div key={sdr.sdrId} className="flex-1 min-w-0 flex flex-col items-center gap-1.5">

              {/* Área de barra — el número flota justo encima con absolute */}
              <div className="flex-1 min-h-0 w-full relative">
                {/* Número + corona: posicionado justo sobre la punta de la barra */}
                <div
                  className="absolute left-0 right-0 flex flex-col items-center pointer-events-none"
                  style={{ bottom: `calc(${pct}% + 6px)` }}
                >
                  {isWinner && (
                    <svg
                      viewBox="0 0 24 16"
                      className="w-6 h-4 shrink-0 mb-0.5"
                      style={{
                        animation: `crownDrop 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 70 + 500}ms both, crownGlow 2.5s ease-in-out ${i * 70 + 1050}ms infinite`,
                        filter: "drop-shadow(0 1px 3px rgba(234,179,8,0.5))",
                      }}
                    >
                      <path d="M1,15 L1,8 L5,2 L7,8 L12,0 L17,8 L19,2 L23,8 L23,15 Z" fill="#facc15" stroke="#d97706" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" />
                      <rect x="1" y="12" width="22" height="3" rx="1" fill="#f59e0b" />
                    </svg>
                  )}
                  <span
                    className={`font-black tabular-nums animate-fade-in-up ${isWinner ? "text-xl" : "text-base"} ${labelColor}`}
                    style={{ animationDelay: `${i * 70 + 350}ms`, lineHeight: 1 }}
                  >
                    {sdr.count}
                  </span>
                </div>

                {/* Barra */}
                <div
                  className={`absolute bottom-0 left-0 right-0 ${color} rounded-2xl`}
                  style={{
                    height: `${pct}%`,
                    ...(isWinner
                      ? {
                          '--glow-c': glow,
                          animation: `barGrow 0.6s cubic-bezier(0.34,1.1,0.64,1) ${i * 70}ms both, barGlowPulse 2.2s ease-in-out ${i * 70 + 700}ms infinite`,
                        }
                      : { animationDelay: `${i * 70}ms`, boxShadow: `0 12px 40px -6px ${glow}` }
                    ),
                  } as React.CSSProperties}
                />
              </div>

              {/* Nombre */}
              <span
                className={`text-xs sm:text-sm text-center shrink-0 truncate w-full animate-fade-in-up ${isWinner ? "font-bold text-foreground" : "font-semibold text-muted-foreground"}`}
                title={sdr.sdrName}
                style={{ animationDelay: `${i * 70 + 450}ms` }}
              >
                {sdr.sdrName.split(" ")[0]}
              </span>

            </div>
          )
        })}
      </div>
    )
  }

  const cardHeader = (
    <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
      <div className="flex items-center gap-2 min-w-0">
        <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2 shadow-md shadow-violet-500/25 shrink-0">
          <BarChart2 className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold leading-tight truncate">Reuniones por SDR</h2>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {scopeMissing ? "Sin permisos de owners" : "Fecha seleccionada"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 glass-sm rounded-xl px-2.5 py-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => onDateChange(e.target.value)}
            className="text-xs font-semibold bg-transparent border-none outline-none cursor-pointer text-foreground w-[105px]"
          />
        </div>

        <div className="text-right shrink-0">
          {loading
            ? <Loader2 className="h-5 w-5 animate-spin text-primary ml-auto" />
            : <>
                <p className="text-2xl lg:text-4xl font-black tabular-nums leading-none bg-gradient-to-br from-blue-500 to-indigo-600 bg-clip-text text-transparent animate-scale-pop">
                  {total}
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">total</p>
              </>
          }
        </div>

        <button
          onClick={() => setFullscreen(true)}
          className="btn-press glass-sm rounded-xl p-2 shrink-0"
          title="Pantalla completa"
        >
          <Maximize2 className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Card normal ── */}
      <div
        className={`glass rounded-2xl p-6 animate-fade-in-up ${fill ? "h-full flex flex-col gap-4" : "space-y-5"}`}
        style={{ animationDelay: "60ms" }}
      >
        {cardHeader}

        {/* Chart area */}
        {fill ? (
          <div className="flex-1 min-h-0">
            {renderBarsFullscreen()}
          </div>
        ) : (
          renderBars(barHeight)
        )}
      </div>

      {/* ── Vista fullscreen — ocupa todo el viewport ── */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 mesh-bg flex flex-col animate-fade-in">

          {/* Header */}
          <div className="glass-heavy shrink-0 px-6 sm:px-10 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 shadow-md shadow-violet-500/30">
                <BarChart2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight">Reuniones Agendadas por SDR</h2>
                <p className="text-xs text-muted-foreground">
                  {scopeMissing ? "Sin permisos de owners — mostrando por ID" : "Reuniones agendadas · " + selectedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 glass-sm rounded-xl px-3.5 py-2">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => onDateChange(e.target.value)}
                  className="text-xs font-semibold bg-transparent border-none outline-none cursor-pointer text-foreground"
                />
              </div>

              <div className="text-right">
                <p className="text-5xl font-black tabular-nums leading-none bg-gradient-to-br from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                  {total}
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">total</p>
              </div>

              <button
                onClick={() => setFullscreen(false)}
                className="btn-press glass-sm rounded-xl p-2.5"
                title="Cerrar (Esc)"
              >
                <Minimize2 className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Área del gráfico — flex-1 + min-h-0 garantiza que llena exactamente el espacio restante */}
          <div className="flex-1 min-h-0 px-8 sm:px-14 pt-6 pb-8">
            {renderBarsFullscreen()}
          </div>

        </div>
      )}
    </>
  )
}
