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
  onChange: (email: string | null) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Users className="h-4 w-4 text-muted-foreground" />
      <button
        onClick={() => onChange(null)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          !selected ? "bg-primary text-white" : "bg-secondary hover:bg-secondary/80"
        }`}
      >
        Todos
      </button>
      {sdrs.map(sdr => (
        <button
          key={sdr.email}
          onClick={() => onChange(sdr.email === selected ? null : sdr.email)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selected === sdr.email ? "bg-primary text-white" : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          {sdr.name.split(" ")[0]}
        </button>
      ))}
    </div>
  )
}
