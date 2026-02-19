import { NextResponse } from 'next/server';
import { fetchUpcomingMovies } from '@/lib/tmdb';

export async function GET() {
  try {
    const data = await fetchUpcomingMovies();
    return NextResponse.json({ results: data.results.slice(0, 12) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
