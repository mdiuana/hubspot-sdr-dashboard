"use client"

import { useState, useEffect } from "react"

interface RankEntry {
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

const RANK_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-600",
]

export function Leaderboard() {
  const [ranking, setRanking] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(data => { if (data.success) setRanking(data.ranking) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const top = ranking[0]
  const rest = ranking.slice(1)

  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-3 h-full">
      <h2 className="text-xs font-black tracking-widest uppercase text-muted-foreground">Leaderboard</h2>

      {loading ? (
        <div className="flex flex-col gap-2 flex-1">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 rounded-xl skeleton" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : ranking.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Sin datos este mes</p>
      ) : (
        <div className="flex flex-col gap-2 flex-1">
          {/* #1 — destacado */}
          {top && (
            <div className={`relative rounded-xl p-3 bg-gradient-to-br ${RANK_COLORS[0]} shadow-md shadow-indigo-500/20 animate-fade-in-up`}>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-white/25 flex items-center justify-center shrink-0 ring-2 ring-white/30 text-xs font-black text-white">
                  {getInitials(top.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm leading-tight truncate">
                    {getFirstName(top.name)} 🐐
                  </p>
                  <p className="text-white/70 text-[11px] font-medium">{top.count} agendadas</p>
                </div>
                <span className="text-white/30 text-[10px] font-black">#1</span>
              </div>
            </div>
          )}

          {/* #2 en adelante */}
          {rest.map((entry, i) => {
            const pos = i + 2
            const gradient = RANK_COLORS[pos - 1] ?? RANK_COLORS[RANK_COLORS.length - 1]
            return (
              <div
                key={entry.id}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 glass-sm animate-fade-in-up"
                style={{ animationDelay: `${pos * 60}ms` }}
              >
                <span className="text-[10px] font-black text-muted-foreground/50 w-4 shrink-0 text-right">
                  #{pos}
                </span>
                <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 text-[10px] font-black text-white`}>
                  {getInitials(entry.name)}
                </div>
                <p className="flex-1 text-sm font-semibold truncate min-w-0">{getFirstName(entry.name)}</p>
                <span className="text-xs font-black tabular-nums text-muted-foreground">{entry.count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
