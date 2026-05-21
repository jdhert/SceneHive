import { NextResponse } from 'next/server';
import { fetchTvDetails } from '@/lib/tmdb';

type RouteContext = {
  params: {
    tvId: string;
  };
};

export const revalidate = 600;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
};

export async function GET(_: Request, { params }: RouteContext) {
  const tvId = Number(params.tvId);
  if (Number.isNaN(tvId) || tvId <= 0) {
    return NextResponse.json({ message: 'Invalid tv id' }, { status: 400 });
  }

  try {
    const tv = await fetchTvDetails(tvId);
    return NextResponse.json(tv, { headers: CACHE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
