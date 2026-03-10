"use client"

import { CalendarDays } from "lucide-react"
import { DateRange, getTodayEST, getMondayEST, getMonthStartEST, todayRange, weekRange, monthRange } from "@/lib/date-utils"

type Preset = "today" | "week" | "month" | "custom"

interface DateRangePickerProps {
  dateRange: DateRange
  onChange: (range: DateRange) => void
  /** Mostrar solo el selector de rango (sin presets Hoy/Semana/Mes) */
  rangeOnly?: boolean
}

function getActivePreset(range: DateRange): Preset {
  const t = todayRange()
  const w = weekRange()
  const m = monthRange()
  if (range.from === t.from && range.to === t.to) return "today"
  if (range.from === w.from && range.to === w.to)  return "week"
  if (range.from === m.from && range.to === m.to)  return "month"
  return "custom"
}

export function DateRangePicker({ dateRange, onChange, rangeOnly = false }: DateRangePickerProps) {
  const today = getTodayEST()
  const activePreset = getActivePreset(dateRange)

  const presets: { id: Preset; label: string }[] = [
    { id: "today", label: "Hoy"    },
    { id: "week",  label: "Semana" },
    { id: "month", label: "Mes"    },
  ]

  function applyPreset(id: Preset) {
    if (id === "today") onChange(todayRange())
    if (id === "week")  onChange(weekRange())
    if (id === "month") onChange(monthRange())
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Presets */}
      {!rangeOnly && (
        <div className="flex items-center rounded-full border glass-sm p-0.5 gap-0.5 shrink-0">
          {presets.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={`btn-press px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
                activePreset === p.id
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Inputs */}
      <div className="flex items-center gap-1.5 glass-sm rounded-xl px-2.5 py-1.5 shrink-0">
        <CalendarDays className="h-3 w-3 text-muted-foreground shrink-0" />
        <input
          type="date"
          value={dateRange.from}
          max={dateRange.to}
          onChange={e => onChange({ ...dateRange, from: e.target.value })}
          className="text-[11px] font-semibold bg-transparent border-none outline-none cursor-pointer text-foreground w-[96px]"
        />
        <span className="text-[11px] text-muted-foreground font-medium">→</span>
        <input
          type="date"
          value={dateRange.to}
          min={dateRange.from}
          max={today}
          onChange={e => onChange({ ...dateRange, to: e.target.value })}
          className="text-[11px] font-semibold bg-transparent border-none outline-none cursor-pointer text-foreground w-[96px]"
        />
      </div>
    </div>
  )
}
