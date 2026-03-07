export interface Meeting {
  id: string
  time: string // ISO datetime de próxima_reunion
  contact: {
    name: string
    email: string
    company: string
    fax?: string // Número de fax = cliente
  }
  sdr: SDR
  status: string
  notes: string
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
