import { NextResponse } from 'next/server';
import { getTodayBookedMeetings, getAllOwners, getTodayDateEST } from '@/lib/hubspot';
import type { Meeting } from '@/types/meeting';

export interface SDRCount {
  sdrId: string;
  sdrName: string;
  sdrEmail: string;
  count: number;
}

const WHITELISTED_SDR_NAMES = [
  'antonia romero ampuero',
  'pedro farren',
  'jose bacarreza',
  'josé bacarreza',
  'diego escobar',
  'martin hidalgo',
  'martín hidalgo',
];

function normalize(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const NORMALIZED_WHITELIST = WHITELISTED_SDR_NAMES.map(normalize);

function isWhitelisted(fullName: string) {
  const n = normalize(fullName);
  return NORMALIZED_WHITELIST.some(w => n === w || n.includes(w) || w.includes(n));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? getTodayDateEST();

  try {
    const [contacts, ownersMap] = await Promise.all([
      getTodayBookedMeetings(date),
      getAllOwners(),
    ]);

    const scopeMissing = ownersMap.size === 0;
    const sdrCounts = new Map<string, SDRCount>();
    const meetings: Meeting[] = [];

    for (const contact of contacts) {
      const props = contact.properties;
      const ownerId = props.hubspot_owner_id;
      if (!ownerId) continue;

      const owner = ownersMap.get(ownerId);
      const sdrName = owner ? `${owner.firstName} ${owner.lastName}`.trim() : `ID:${ownerId}`;
      const sdrEmail = owner?.email ?? '';

      // Aplicar whitelist solo cuando tenemos nombres reales
      if (!scopeMissing && !isWhitelisted(sdrName)) continue;

      // Contar por SDR
      if (sdrCounts.has(ownerId)) {
        sdrCounts.get(ownerId)!.count++;
      } else {
        sdrCounts.set(ownerId, { sdrId: ownerId, sdrName, sdrEmail, count: 1 });
      }

      // Construir meeting completa
      const proximaReunion = props.proxima_reunion;
      const meetingTime = proximaReunion
        ? new Date(isNaN(Number(proximaReunion)) ? proximaReunion : parseInt(proximaReunion))
        : null;

      const fechaAgStr = props.fecha_agendamiento;
      const fechaAgendamiento = fechaAgStr
        ? new Date(isNaN(Number(fechaAgStr)) ? fechaAgStr : parseInt(fechaAgStr))
        : null;

      meetings.push({
        id: contact.id,
        time: meetingTime?.toISOString() ?? new Date(0).toISOString(),
        contact: {
          name: `${props.firstname ?? ''} ${props.lastname ?? ''}`.trim(),
          email: props.email ?? '',
          company: props.company ?? '',
        },
        sdr: { id: ownerId, name: sdrName, email: sdrEmail },
        status: props.estado_prospeccion_vol2 ?? 'Sin estado',
        notes: '',
        meetingLink: '',
        ejecutivo: props.ejecutivo_que_toma_la_reunion ?? '',
        fechaAgendamiento: fechaAgendamiento?.toISOString() ?? '',
      });
    }

    const bySDR = Array.from(sdrCounts.values()).sort((a, b) => b.count - a.count);
    meetings.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return NextResponse.json({
      success: true,
      date,
      total: meetings.length,
      bySDR,
      meetings,
      scopeMissing,
    });
  } catch (error: any) {
    console.error('Error in /api/meetings/agendadas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching agendadas' },
      { status: 500 }
    );
  }
}
