"use client"

import { SDR } from "@/types/meeting"
import { Users } from "lucide-react"

export function SDRFilter({
  sdrs,
  selected,
  onChange,
}: {
  sdrs: SDR[]
  selected: string | null
  onChange: (id: string | null) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
      <button
        onClick={() => onChange(null)}
        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
          !selected
            ? "bg-primary text-white shadow-sm shadow-primary/30"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
        }`}
      >
        Todos
      </button>
      {sdrs.map(sdr => (
        <button
          key={sdr.id}
          onClick={() => onChange(sdr.id === selected ? null : sdr.id)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            selected === sdr.id
              ? "bg-primary text-white shadow-sm shadow-primary/30"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
          }`}
        >
          {sdr.name.split(" ")[0]}
        </button>
      ))}
    </div>
  )
}
