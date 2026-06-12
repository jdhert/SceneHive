import { NextResponse } from 'next/server';
import { fetchGenres, fetchTvGenres } from '@/lib/tmdb';

export async function GET() {
  try {
    const [movieGenres, tvGenres] = await Promise.all([
      fetchGenres(),
      fetchTvGenres(),
    ]);

    return NextResponse.json({
      movie: movieGenres.genres ?? [],
      tv: tvGenres.genres ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
