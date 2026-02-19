import { NextResponse } from 'next/server';
import { fetchMovieDetails } from '@/lib/tmdb';

type RouteContext = {
  params: {
    movieId: string;
  };
};

export async function GET(_: Request, { params }: RouteContext) {
  const movieId = Number(params.movieId);
  if (Number.isNaN(movieId) || movieId <= 0) {
    return NextResponse.json({ message: 'Invalid movie id' }, { status: 400 });
  }

  try {
    const movie = await fetchMovieDetails(movieId);
    return NextResponse.json(movie);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
