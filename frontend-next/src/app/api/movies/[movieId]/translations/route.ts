import { NextResponse } from 'next/server';
import { fetchMovieDetailsTextTranslation } from '@/lib/tmdb';

type RouteContext = {
  params: {
    movieId: string;
  };
};

export const revalidate = 86400;

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
};

export async function GET(_: Request, { params }: RouteContext) {
  const movieId = Number(params.movieId);
  if (Number.isNaN(movieId) || movieId <= 0) {
    return NextResponse.json({ message: 'Invalid movie id' }, { status: 400 });
  }

  try {
    const translations = await fetchMovieDetailsTextTranslation(movieId);
    return NextResponse.json(translations, { headers: CACHE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
