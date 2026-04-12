import { NextRequest } from 'next/server';
import { fetchSevenTimer } from '@/lib/api/seven-timer';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  if (!lat || !lng) {
    return Response.json({ error: 'lat and lng required' }, { status: 400 });
  }
  const la = Number.parseFloat(lat);
  const ln = Number.parseFloat(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) {
    return Response.json({ error: 'invalid coordinates' }, { status: 400 });
  }

  try {
    const sevenTimer = await fetchSevenTimer(la, ln);
    return Response.json(
      sevenTimer,
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ error: 'upstream_failed' }, { status: 502 });
  }
}
