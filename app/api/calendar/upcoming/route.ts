import { NextRequest, NextResponse } from 'next/server';
import eventsData from '@/data/economic-events.json';

interface EconEvent {
  date: string;
  time: string;
  country: string;
  flag: string;
  title: string;
  importance: 1 | 2 | 3;
  forecast: string;
  previous: string;
}

// ?days=7&minImportance=1&limit=20
export async function GET(request: NextRequest) {
  const days = Math.min(Number(request.nextUrl.searchParams.get('days') || 7), 60);
  const minImportance = Math.max(
    1,
    Math.min(Number(request.nextUrl.searchParams.get('minImportance') || 1), 3)
  );
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 100), 200);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today.getTime() + days * 86400000);

  const filtered = (eventsData.events as EconEvent[])
    .filter((e) => {
      const d = new Date(`${e.date}T00:00:00`);
      return d >= today && d <= endDate && e.importance >= minImportance;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    })
    .slice(0, limit);

  return NextResponse.json(
    { events: filtered, updatedAt: eventsData.updatedAt, source: eventsData.source },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
  );
}
