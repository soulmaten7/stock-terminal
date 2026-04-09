import { NextResponse } from 'next/server';
import { getKisToken } from '@/lib/kis';

export async function GET() {
  try {
    const token = await getKisToken();
    return NextResponse.json({ success: true, token: token.slice(0, 20) + '...' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
