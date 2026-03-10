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
  count: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'month'; // 'month' | 'day'
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
    const clientCounts = new Map<string, number>();

    for (const { contact, validHistory } of items) {
      const entry = getValidEntryInRange(validHistory, startMs, endMs);
      if (!entry) continue;

      const raw = contact.properties.fax as string | undefined;
      const name = raw?.trim().replace(/\s+/g, ' ') || 'Sin cliente';
      clientCounts.set(name, (clientCounts.get(name) ?? 0) + 1);
    }

    const clients: ClientCount[] = Array.from(clientCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      period,
      from: period === 'day' ? from : undefined,
      to:   period === 'day' ? to   : undefined,
      total: clients.reduce((s, c) => s + c.count, 0),
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
