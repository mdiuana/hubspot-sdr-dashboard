import { NextResponse } from 'next/server';
import { getTodayMeetings, getOwner, getCompany } from '@/lib/hubspot';
import type { Meeting, SDR } from '@/types/meeting';

// Cache owners para no hacer request por cada contacto
const ownersCache = new Map<string, SDR>();

export async function GET(request: Request) {
  try {
    // Fetch contacts with meetings today
    const contacts = await getTodayMeetings();

    // Transform to Meeting format
    const meetings: Meeting[] = await Promise.all(
      contacts.map(async (contact) => {
        const props = contact.properties;
        
        // Get owner (SDR) details
        let sdr: SDR | undefined;
        if (props.hubspot_owner_id) {
          if (ownersCache.has(props.hubspot_owner_id)) {
            sdr = ownersCache.get(props.hubspot_owner_id);
          } else {
            const owner = await getOwner(props.hubspot_owner_id);
            if (owner) {
              sdr = {
                id: owner.id,
                name: `${owner.firstName} ${owner.lastName}`,
                email: owner.email,
              };
              ownersCache.set(props.hubspot_owner_id, sdr);
            }
          }
        }

        // Get company name
        let companyName = props.company || '';

        // Parse meeting time from proxima_reunion (datetime en milisegundos)
        const meetingTimeStr = props.proxima_reunion;
        const meetingTime = meetingTimeStr ? new Date(parseInt(meetingTimeStr)) : new Date();

        // Parse fecha_agendamiento
        const fechaAgendamiento = props.fecha_agendamiento 
          ? new Date(parseInt(props.fecha_agendamiento))
          : null;

        // Build notes with additional info
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
            company: companyName,
          },
          sdr: sdr || { id: 'unknown', name: 'Sin asignar', email: '' },
          status: props.estado_prospeccion_vol2 || 'Sin estado',
          notes: notes,
          meetingLink: '', // Podrían agregar si tienen link de videollamada en otra propiedad
          ejecutivo: props.ejecutivo_que_toma_la_reunion || '',
          fechaAgendamiento: fechaAgendamiento?.toISOString() || '',
        } as Meeting;
      })
    );

    // Sort by time
    meetings.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return NextResponse.json({ 
      success: true, 
      count: meetings.length,
      meetings 
    });

  } catch (error: any) {
    console.error('Error in /api/meetings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error fetching meetings' 
      },
      { status: 500 }
    );
  }
}
