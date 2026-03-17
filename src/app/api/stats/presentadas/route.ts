import { NextResponse } from 'next/server';
import {
  getAllWhitelistedBookedContacts,
  getValidEntryInRange,
  getMonthRangeEST,
  getDateRangeForString,
  getTodayDateEST,
} from '@/lib/hubspot';

interface ClientPresentadas {
  name: string;
  agendadas: number;
  presentadas: number;
  ratio: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'month';
  const today = getTodayDateEST();
  const from = searchParams.get('from') ?? today;
  const to = searchParams.get('to') ?? from;

  try {
    let startMs: number;
    let endMs: number;

    if (period === 'month') {
      ({ startMs, endMs } = getMonthRangeEST());
    } else {
      startMs = getDateRangeForString(from).startMs;
      endMs = getDateRangeForString(to).endMs;
    }

    // Cap endMs to now so we only count meetings that should have already happened
    const nowMs = Date.now();
    const cappedEndMs = Math.min(endMs, nowMs);

    const items = await getAllWhitelistedBookedContacts(['fecha_reunion_reagendada']);
    const clientMap = new Map<string, ClientPresentadas>();

    for (const { contact, validHistory } of items) {
      const entry = getValidEntryInRange(validHistory, startMs, endMs);
      if (!entry) continue;

      // Fecha efectiva: reagendada si existe, sino proxima_reunion
      const reagendada = contact.properties.fecha_reunion_reagendada;
      const proxima = contact.properties.proxima_reunion;
      const rawDate = reagendada?.trim() || proxima;
      if (!rawDate) continue;

      const effectiveMs = isNaN(Number(rawDate))
        ? new Date(rawDate).getTime()
        : parseInt(rawDate);

      // Solo contar reuniones cuya fecha efectiva ya paso y esta en rango
      if (isNaN(effectiveMs) || effectiveMs > cappedEndMs || effectiveMs < startMs) continue;

      const raw = contact.properties.fax as string | undefined;
      const name = raw?.trim().replace(/\s+/g, ' ') || 'Sin cliente';

      if (!clientMap.has(name)) {
        clientMap.set(name, { name, agendadas: 0, presentadas: 0, ratio: 0 });
      }
      const row = clientMap.get(name)!;
      row.agendadas++;
      if (contact.properties.nm_presentada_2 === 'Sí') row.presentadas++;
    }

    // Calculate ratios
    for (const row of clientMap.values()) {
      row.ratio = row.agendadas > 0 ? row.presentadas / row.agendadas : 0;
    }

    const clients = Array.from(clientMap.values())
      .sort((a, b) => b.agendadas - a.agendadas);

    const totalAgendadas = clients.reduce((s, c) => s + c.agendadas, 0);
    const totalPresentadas = clients.reduce((s, c) => s + c.presentadas, 0);

    return NextResponse.json({
      success: true,
      period,
      from: period === 'day' ? from : undefined,
      to: period === 'day' ? to : undefined,
      total: {
        agendadas: totalAgendadas,
        presentadas: totalPresentadas,
        ratio: totalAgendadas > 0 ? totalPresentadas / totalAgendadas : 0,
      },
      clients,
    });
  } catch (error: any) {
    console.error('Error in /api/stats/presentadas:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
