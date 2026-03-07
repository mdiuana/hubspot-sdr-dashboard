import { NextResponse } from 'next/server';
import { getContactsByDateRange, getMonthRangeEST, getAllOwners } from '@/lib/hubspot';

const WHITELISTED = [
  'antonia romero ampuero',
  'pedro farren',
  'jose bacarreza',
  'josé bacarreza',
  'diego escobar',
  'martin hidalgo',
  'martín hidalgo',
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
    const [contacts, ownersMap] = await Promise.all([
      getContactsByDateRange(startMs, endMs),
      getAllOwners(),
    ]);

    const scopeMissing = ownersMap.size === 0;
    const counts = new Map<string, { name: string; email: string; count: number }>();

    for (const contact of contacts) {
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

    return NextResponse.json({ success: true, ranking, total: contacts.length, scopeMissing });
  } catch (error: any) {
    console.error('Error in /api/leaderboard:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
