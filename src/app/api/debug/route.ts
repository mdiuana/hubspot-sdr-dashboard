import { NextResponse } from 'next/server';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

export async function GET() {
  if (!ACCESS_TOKEN) {
    return NextResponse.json({ error: 'No token' }, { status: 500 });
  }

  // HubSpot DATE se guarda como midnight UTC del día en EST
  const EST_OFFSET_MS = 5 * 60 * 60 * 1000;
  const nowEST = new Date(Date.now() - EST_OFFSET_MS);
  const y = nowEST.getUTCFullYear(), m = nowEST.getUTCMonth(), dd = nowEST.getUTCDate();
  const todayTimestamp = Date.UTC(y, m, dd);          // midnight UTC del día EST
  const tomorrowTimestamp = todayTimestamp + 24 * 60 * 60 * 1000;

  const validStatuses = ['PR Agendada FONO', 'PR Agendada WTSP', 'Pr RE-Agendada'];

  // Buscar por fecha_agendamiento = hoy
  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            { propertyName: 'fecha_agendamiento', operator: 'GTE', value: todayTimestamp.toString() },
            { propertyName: 'fecha_agendamiento', operator: 'LT', value: tomorrowTimestamp.toString() },
            { propertyName: 'estado_prospeccion_vol2', operator: 'IN', values: validStatuses },
          ],
        },
      ],
      properties: [
        'firstname', 'lastname', 'email',
        'hubspot_owner_id',
        'estado_prospeccion_vol2',
        'fecha_agendamiento',
        'proxima_reunion',
      ],
      limit: 100,
    }),
  });

  const raw = await res.json();

  // También buscar los owners de los contactos encontrados
  const ownerIds = [...new Set(
    (raw.results ?? [])
      .map((c: any) => c.properties?.hubspot_owner_id)
      .filter(Boolean)
  )];

  // Cargar todos los owners de una vez
  const ownersRes = await fetch(`${HUBSPOT_API_BASE}/crm/v3/owners?limit=100`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
  });
  const ownersData = ownersRes.ok ? await ownersRes.json() : { results: [] };
  const ownersMap: Record<string, any> = {};
  for (const o of (ownersData.results ?? [])) {
    ownersMap[o.id] = `${o.firstName} ${o.lastName}`;
  }

  return NextResponse.json({
    todayTimestamp,
    tomorrowTimestamp,
    totalFound: raw.total,
    dateRangeUTC: { start: new Date(todayTimestamp).toISOString(), end: new Date(tomorrowTimestamp).toISOString() },
    contacts: (raw.results ?? []).map((c: any) => ({
      id: c.id,
      name: `${c.properties.firstname ?? ''} ${c.properties.lastname ?? ''}`.trim(),
      hubspot_owner_id: c.properties.hubspot_owner_id,
        ownerName: ownersMap[c.properties.hubspot_owner_id] ?? 'NOT FOUND',
      estado_prospeccion_vol2: c.properties.estado_prospeccion_vol2,
      fecha_agendamiento_raw: c.properties.fecha_agendamiento,
      fecha_agendamiento_parsed: c.properties.fecha_agendamiento
        ? new Date(parseInt(c.properties.fecha_agendamiento)).toISOString()
        : null,
      proxima_reunion_raw: c.properties.proxima_reunion,
      proxima_reunion_parsed: c.properties.proxima_reunion
        ? new Date(parseInt(c.properties.proxima_reunion)).toISOString()
        : null,
    })),
    rawHubSpotResponse: raw,
  });
}
