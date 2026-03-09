import { NextResponse } from 'next/server';
import { getMonthRangeEST, getAllOwners } from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

const WHITELISTED = [
  'antonia romero ampuero',
  'pedro farren',
  'jose bacarreza',
  'josé bacarreza',
  'diego escobar',
  'martin hidalgo',
  'martín hidalgo',
];

const VALID_STATUSES = [
  'PR Agendada',
  'PR Agendada FONO',
  'PR Agendada WTSP',
  'Pr RE-Agendada',
];

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const NORM_LIST = WHITELISTED.map(normalize);

function isWhitelisted(name: string) {
  const n = normalize(name);
  return NORM_LIST.some(w => n === w || n.includes(w) || w.includes(n));
}

export async function GET() {
  try {
    const { startMs, endMs } = getMonthRangeEST();
    const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN no configurado');

    const properties = [
      'firstname', 'lastname', 'email', 'hubspot_owner_id',
      'estado_prospeccion_vol2', 'fecha_agendamiento',
    ];

    const all: any[] = [];
    let after: string | undefined;

    do {
      const body: Record<string, unknown> = {
        filterGroups: [{
          filters: [
            { propertyName: 'fecha_agendamiento', operator: 'GTE', value: startMs.toString() },
            { propertyName: 'fecha_agendamiento', operator: 'LT',  value: endMs.toString() },
            { propertyName: 'estado_prospeccion_vol2', operator: 'IN', values: VALID_STATUSES },
          ],
        }],
        properties,
        limit: 100,
      };
      if (after) body.after = after;

      const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      });

      if (!res.ok) throw new Error(`HubSpot error: ${res.status} - ${await res.text()}`);

      const data = await res.json();
      all.push(...(data.results ?? []));
      after = data.paging?.next?.after;
    } while (after);

    const ownersMap = await getAllOwners();
    const scopeMissing = ownersMap.size === 0;
    const counts = new Map<string, { name: string; email: string; count: number }>();

    for (const contact of all) {
      const ownerId = contact.properties.hubspot_owner_id;
      if (!ownerId) continue;

      const owner = ownersMap.get(ownerId);
      const name = owner ? `${owner.firstName} ${owner.lastName}`.trim() : `ID:${ownerId}`;
      const email = owner?.email ?? '';

      if (!scopeMissing && !isWhitelisted(name)) continue;

      if (counts.has(ownerId)) {
        counts.get(ownerId)!.count++;
      } else {
        counts.set(ownerId, { name, email, count: 1 });
      }
    }

    const ranking = Array.from(counts.entries())
      .map(([id, { name, email, count }]) => ({ id, name, email, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ success: true, ranking, total: all.length, scopeMissing });
  } catch (error: any) {
    console.error('Error in /api/leaderboard:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
