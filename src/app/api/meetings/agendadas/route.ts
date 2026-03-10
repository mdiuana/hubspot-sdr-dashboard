import { NextResponse } from 'next/server';
import {
  getAllWhitelistedBookedContacts,
  getValidEntryInRange,
  WHITELISTED_SDR_IDS,
  getTodayDateEST,
  getDateRangeForString,
} from '@/lib/hubspot';
import type { Meeting } from '@/types/meeting';

export const dynamic = 'force-dynamic';

export interface SDRCount {
  sdrId: string;
  sdrName: string;
  sdrEmail: string;
  count: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const today = getTodayDateEST();
  const from = searchParams.get('from') ?? today;
  const to   = searchParams.get('to')   ?? from;

  const startMs = getDateRangeForString(from).startMs;
  const endMs   = getDateRangeForString(to).endMs; // fin del día "to"

  try {
    const items = await getAllWhitelistedBookedContacts();

    const sdrCounts = new Map<string, SDRCount>();
    const meetings: Meeting[] = [];

    for (const { contact, validHistory } of items) {
      const entry = getValidEntryInRange(validHistory, startMs, endMs);
      if (!entry) continue;

      const props = contact.properties;
      const ownerId = props.hubspot_owner_id!;
      const sdrName = WHITELISTED_SDR_IDS.get(ownerId) ?? `ID:${ownerId}`;

      if (sdrCounts.has(ownerId)) {
        sdrCounts.get(ownerId)!.count++;
      } else {
        sdrCounts.set(ownerId, { sdrId: ownerId, sdrName, sdrEmail: '', count: 1 });
      }

      const proximaReunion = props.proxima_reunion;
      const meetingTime = proximaReunion
        ? new Date(isNaN(Number(proximaReunion)) ? proximaReunion : parseInt(proximaReunion))
        : null;

      meetings.push({
        id: contact.id,
        time: meetingTime?.toISOString() ?? new Date(0).toISOString(),
        contact: {
          name: `${props.firstname ?? ''} ${props.lastname ?? ''}`.trim(),
          email: props.email ?? '',
          company: props.company ?? '',
          fax: props.fax ?? '',
        },
        sdr: { id: ownerId, name: sdrName, email: '' },
        status: props.estado_prospeccion_vol2 ?? 'Sin estado',
        notes: '',
        meetingLink: '',
        ejecutivo: props.ejecutivo_que_toma_la_reunion ?? '',
        fechaAgendamiento: new Date(entry.tsMs).toISOString(),
      });
    }

    const bySDR = Array.from(sdrCounts.values()).sort((a, b) => b.count - a.count);
    meetings.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return NextResponse.json({
      success: true,
      from,
      to,
      total: meetings.length,
      bySDR,
      meetings,
      scopeMissing: false,
    });
  } catch (error: any) {
    console.error('Error in /api/meetings/agendadas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching agendadas' },
      { status: 500 }
    );
  }
}
