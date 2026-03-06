"use client"

import { Meeting } from "@/types/meeting"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Clock, Building2, User, Video, FileText, Briefcase } from "lucide-react"

function getStatusVariant(status: string): "success" | "default" | "destructive" | "warning" {
  if (status.includes("RE-Agendada")) return "warning"
  if (status.includes("WTSP")) return "default"
  if (status.includes("FONO")) return "default"
  return "default"
}

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const meetingTime = new Date(meeting.time)
  const now = new Date()
  
  // Considerar "EN VIVO" si es dentro de ±30 minutos
  const isNow = Math.abs(now.getTime() - meetingTime.getTime()) < 30 * 60 * 1000

  return (
    <div className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${
      isNow ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card"
    }`}>
      {isNow && (
        <span className="absolute -top-2 left-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
          EN VIVO
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm truncate">{meeting.contact.name}</h3>
            <Badge variant={getStatusVariant(meeting.status)}>{meeting.status}</Badge>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(meetingTime, "HH:mm")}
            </span>
            {meeting.contact.email && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {meeting.contact.email}
              </span>
            )}
            {meeting.contact.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {meeting.contact.company}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <span className="inline-flex items-center gap-1.5 w-fit rounded-full bg-secondary px-2 py-0.5 font-medium">
              <User className="h-3 w-3" />
              SDR: {meeting.sdr.name}
            </span>
            
            {meeting.ejecutivo && (
              <span className="inline-flex items-center gap-1.5 w-fit text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                Ejecutivo: {meeting.ejecutivo}
              </span>
            )}

            {meeting.fechaAgendamiento && (
              <span className="inline-flex items-center gap-1.5 w-fit text-muted-foreground">
                <FileText className="h-3 w-3" />
                Agendada: {format(new Date(meeting.fechaAgendamiento), "dd/MM/yyyy")}
              </span>
            )}
          </div>
        </div>

        {meeting.meetingLink && (
          <a
            href={meeting.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md bg-primary p-2 text-white hover:bg-primary/90 transition-colors"
          >
            <Video className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  )
}
