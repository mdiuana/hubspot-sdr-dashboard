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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const today = getTodayDateEST();
    const from = searchParams.get('from');
    const to   = searchParams.get('to');

    let startMs: number;
    let endMs: number;

    if (from && to) {
      startMs = getDateRangeForString(from).startMs;
      endMs   = getDateRangeForString(to).endMs;
    } else {
      ({ startMs, endMs } = getMonthRangeEST());
    }

    const items = await getAllWhitelistedBookedContacts();
    const counts = new Map<string, { name: string; email: string; count: number }>();

    for (const { contact, validHistory } of items) {
      const entry = getValidEntryInRange(validHistory, startMs, endMs);
      if (!entry) continue;

      const ownerId = contact.properties.hubspot_owner_id!;
      const name = WHITELISTED_SDR_IDS.get(ownerId) ?? `ID:${ownerId}`;

      if (counts.has(ownerId)) {
        counts.get(ownerId)!.count++;
      } else {
        counts.set(ownerId, { name, email: '', count: 1 });
      }
    }

    const ranking = Array.from(counts.entries())
      .map(([id, { name, email, count }]) => ({ id, name, email, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      ranking,
      total: ranking.reduce((s, r) => s + r.count, 0),
      scopeMissing: false,
    });
  } catch (error: any) {
    console.error('Error in /api/leaderboard:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
