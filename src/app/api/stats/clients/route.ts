import { NextResponse } from 'next/server';
import {
  getAllWhitelistedBookedContacts,
  getValidEntryInRange,
  getMonthRangeEST,
  getDateRangeForString,
  getTodayDateEST,
} from '@/lib/hubspot';

export interface ClientCount {
  name: string;
  agendadas: number;
  presentadas: number;
}

// Clientes que siempre aparecen aunque tengan 0
const FIXED_CLIENTS = ['GFIRMEX', 'CHILEXPR', 'SIXBELLG', 'SAMEX'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'month';
  const today  = getTodayDateEST();
  const from   = searchParams.get('from') ?? today;
  const to     = searchParams.get('to')   ?? from;

  try {
    let startMs: number;
    let endMs: number;

    if (period === 'month') {
      ({ startMs, endMs } = getMonthRangeEST());
    } else {
      startMs = getDateRangeForString(from).startMs;
      endMs   = getDateRangeForString(to).endMs;
    }

    const items = await getAllWhitelistedBookedContacts();
    const clientMap = new Map<string, ClientCount>();

    // Seed con clientes fijos para que siempre aparezcan
    for (const name of FIXED_CLIENTS) {
      clientMap.set(name, { name, agendadas: 0, presentadas: 0 });
    }

    for (const { contact, validHistory } of items) {
      const entry = getValidEntryInRange(validHistory, startMs, endMs);
      if (!entry) continue;

      const raw = contact.properties.fax as string | undefined;
      const name = raw?.trim().replace(/\s+/g, ' ') || 'Sin cliente';

      if (!clientMap.has(name)) {
        clientMap.set(name, { name, agendadas: 0, presentadas: 0 });
      }
      const row = clientMap.get(name)!;
      row.agendadas++;
      if (contact.properties.nm_presentada_2 === 'Sí') row.presentadas++;
    }

    const clients = Array.from(clientMap.values())
      .sort((a, b) => b.agendadas - a.agendadas);

    return NextResponse.json({
      success: true,
      period,
      from: period === 'day' ? from : undefined,
      to:   period === 'day' ? to   : undefined,
      total: clients.reduce((s, c) => s + c.agendadas, 0),
      clients,
    });
  } catch (error: any) {
    console.error('Error in /api/stats/clients:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
