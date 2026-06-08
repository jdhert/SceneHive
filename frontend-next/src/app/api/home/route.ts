import { NextResponse } from 'next/server';
import { fetchHomePayload } from '@/lib/home-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchHomePayload();

    return NextResponse.json(
      data,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
