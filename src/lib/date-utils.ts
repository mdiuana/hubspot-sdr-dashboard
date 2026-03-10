export interface DateRange {
  from: string
  to: string
}

export function getTodayEST(): string {
  const nowEST = new Date(Date.now() - 5 * 60 * 60 * 1000)
  const y = nowEST.getUTCFullYear()
  const m = String(nowEST.getUTCMonth() + 1).padStart(2, "0")
  const d = String(nowEST.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function getMondayEST(): string {
  const nowEST = new Date(Date.now() - 5 * 60 * 60 * 1000)
  const day = nowEST.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(Date.UTC(nowEST.getUTCFullYear(), nowEST.getUTCMonth(), nowEST.getUTCDate() + diff))
  return mon.toISOString().slice(0, 10)
}

export function getMonthStartEST(): string {
  const nowEST = new Date(Date.now() - 5 * 60 * 60 * 1000)
  return `${nowEST.getUTCFullYear()}-${String(nowEST.getUTCMonth() + 1).padStart(2, "0")}-01`
}

export function todayRange(): DateRange {
  const t = getTodayEST()
  return { from: t, to: t }
}

export function weekRange(): DateRange {
  return { from: getMondayEST(), to: getTodayEST() }
}

export function monthRange(): DateRange {
  return { from: getMonthStartEST(), to: getTodayEST() }
}

export function fmtShort(iso: string): string {
  const [, m, d] = iso.split("-")
  return `${d}/${m}`
}

export function fmtFull(iso: string): string {
  return iso.split("-").reverse().join("/")
}
