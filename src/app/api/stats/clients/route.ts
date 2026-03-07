import { NextResponse } from 'next/server';
import { getContactsByDateRange, getMonthRangeEST, getDateRangeForString, getTodayDateEST } from '@/lib/hubspot';

export interface ClientCount {
  name: string;
  count: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'month'; // 'month' | 'day'
  const date = searchParams.get('date') ?? getTodayDateEST();

  try {
    const range = period === 'month' ? getMonthRangeEST() : getDateRangeForString(date);
    const contacts = await getContactsByDateRange(range.startMs, range.endMs);

    // Agrupar por fax (normalizado: trim + sin espacios múltiples)
    const clientCounts = new Map<string, number>();
    for (const contact of contacts) {
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
      date: period === 'day' ? date : undefined,
      total: contacts.length,
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
