import { NextResponse } from 'next/server';
import { getTodayMeetings, getAllOwners } from '@/lib/hubspot';
import type { Meeting } from '@/types/meeting';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') ?? undefined;

    // Cargar contacts y owners en paralelo
    const [contacts, ownersMap] = await Promise.all([
      getTodayMeetings(dateStr),
      getAllOwners(),
    ]);

    const meetings: Meeting[] = contacts.map((contact) => {
      const props = contact.properties;

      // Resolver SDR desde el mapa de owners
      const ownerId = props.hubspot_owner_id;
      const owner = ownerId ? ownersMap.get(ownerId) : undefined;
      const sdr = owner
        ? { id: owner.id, name: `${owner.firstName} ${owner.lastName}`.trim(), email: owner.email }
        : { id: ownerId ?? 'unknown', name: 'Sin asignar', email: '' };

      // Parse meeting time — puede venir como ISO string o como ms
      const meetingTimeStr = props.proxima_reunion;
      const meetingTime = meetingTimeStr
        ? new Date(isNaN(Number(meetingTimeStr)) ? meetingTimeStr : parseInt(meetingTimeStr))
        : new Date();

      // Parse fecha_agendamiento — puede venir como ISO string o como ms
      const fechaAgStr = props.fecha_agendamiento;
      const fechaAgendamiento = fechaAgStr
        ? new Date(isNaN(Number(fechaAgStr)) ? fechaAgStr : parseInt(fechaAgStr))
        : null;

      const notes = [
        props.ejecutivo_que_toma_la_reunion && `Ejecutivo: ${props.ejecutivo_que_toma_la_reunion}`,
        fechaAgendamiento && `Agendada: ${fechaAgendamiento.toLocaleDateString('es-CL')}`,
      ].filter(Boolean).join(' · ');

      return {
        id: contact.id,
        time: meetingTime.toISOString(),
        contact: {
          name: `${props.firstname || ''} ${props.lastname || ''}`.trim(),
          email: props.email || '',
          company: props.company || '',
          fax: (props.fax as string | undefined)?.trim() || '',
        },
        sdr,
        status: props.estado_prospeccion_vol2 || 'Sin estado',
        notes,
        meetingLink: '',
        ejecutivo: props.ejecutivo_que_toma_la_reunion || '',
        fechaAgendamiento: fechaAgendamiento?.toISOString() || '',
      } as Meeting;
    });

    meetings.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return NextResponse.json({
      success: true,
      count: meetings.length,
      meetings,
    });

  } catch (error: any) {
    console.error('Error in /api/meetings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching meetings' },
      { status: 500 }
    );
  }
}
