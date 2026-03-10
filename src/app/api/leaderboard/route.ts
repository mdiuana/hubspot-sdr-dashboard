import { NextResponse } from 'next/server';
import {
  getAllWhitelistedBookedContacts,
  getValidEntryInRange,
  WHITELISTED_SDR_IDS,
  getMonthRangeEST,
  getDateRangeForString,
  getTodayDateEST,
} from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

interface SDRCount { id: string; name: string; email: string; count: number }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const today = getTodayDateEST();
    const from  = searchParams.get('from');
    const to    = searchParams.get('to');

    let startMs: number;
    let endMs: number;

    if (from && to) {
      startMs = getDateRangeForString(from).startMs;
      endMs   = getDateRangeForString(to).endMs;
    } else {
      ({ startMs, endMs } = getMonthRangeEST());
    }

    const items = await getAllWhitelistedBookedContacts();

    const agendadasMap  = new Map<string, SDRCount>();
    const presentadasMap = new Map<string, SDRCount>();

    for (const { contact, validHistory } of items) {
      const entry = getValidEntryInRange(validHistory, startMs, endMs);
      if (!entry) continue;

      const ownerId = contact.properties.hubspot_owner_id!;
      const name = WHITELISTED_SDR_IDS.get(ownerId) ?? `ID:${ownerId}`;

      // Agendadas
      if (agendadasMap.has(ownerId)) {
        agendadasMap.get(ownerId)!.count++;
      } else {
        agendadasMap.set(ownerId, { id: ownerId, name, email: '', count: 1 });
      }

      // Presentadas
      if (contact.properties.nm_presentada_2 === 'Sí') {
        if (presentadasMap.has(ownerId)) {
          presentadasMap.get(ownerId)!.count++;
        } else {
          presentadasMap.set(ownerId, { id: ownerId, name, email: '', count: 1 });
        }
      }
    }

    const agendadas  = Array.from(agendadasMap.values()).sort((a, b) => b.count - a.count);
    const presentadas = Array.from(presentadasMap.values()).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      agendadas,
      presentadas,
      scopeMissing: false,
    });
  } catch (error: any) {
    console.error('Error in /api/leaderboard:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
