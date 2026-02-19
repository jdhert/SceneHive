import { NextResponse } from 'next/server';
import { fetchNowPlayingMovies } from '@/lib/tmdb';

export async function GET() {
  try {
    const data = await fetchNowPlayingMovies();
    return NextResponse.json({ results: data.results.slice(0, 12) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
