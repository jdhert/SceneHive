import { NextResponse } from 'next/server';
import { fetchMovieVideos } from '@/lib/tmdb';

type RouteContext = {
  params: {
    movieId: string;
  };
};

export const revalidate = 600;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
};

export async function GET(_: Request, { params }: RouteContext) {
  const movieId = Number(params.movieId);
  if (Number.isNaN(movieId) || movieId <= 0) {
    return NextResponse.json({ message: 'Invalid movie id' }, { status: 400 });
  }

  try {
    const videos = await fetchMovieVideos(movieId);
    return NextResponse.json(videos, { headers: CACHE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
