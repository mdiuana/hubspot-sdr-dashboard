export interface Meeting {
  id: string
  time: string // ISO datetime de próxima_reunion
  contact: {
    name: string
    email: string
    company: string
  }
  sdr: SDR
  status: string // Estado de prospección (PR Agendada FONO, PR Agendada WTSP, Pr RE-Agendada)
  notes: string // Ejecutivo + fecha agendamiento
  meetingLink?: string
  ejecutivo?: string // EJECUTIVO QUE TOMA LA REUNION
  fechaAgendamiento?: string // FECHA AGENDAMIENTO (ISO)
}

export interface SDR {
  id: string
  name: string
  email: string
  avatar?: string
}
