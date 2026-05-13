import { NextResponse } from 'next/server';
import {
  fetchGenres,
  fetchNowPlayingMovies,
  fetchTopRatedMovies,
  fetchTrendingMovies,
  fetchTrendingPeople,
  fetchTrendingTv,
  fetchUpcomingMovies,
} from '@/lib/tmdb';

export const revalidate = 600;

export async function GET() {
  try {
    const [trending, trendingTv, trendingPeople, nowPlaying, upcoming, topRated, genres] = await Promise.all([
      fetchTrendingMovies(),
      fetchTrendingTv(),
      fetchTrendingPeople(),
      fetchNowPlayingMovies(),
      fetchUpcomingMovies(),
      fetchTopRatedMovies(),
      fetchGenres(),
    ]);

    return NextResponse.json(
      {
        trending: { results: trending.results.slice(0, 12) },
        trendingTv: { results: trendingTv.results.slice(0, 12) },
        trendingPeople: { results: trendingPeople.results.slice(0, 12) },
        nowPlaying: { results: nowPlaying.results.slice(0, 12) },
        upcoming: { results: upcoming.results.slice(0, 12) },
        topRated: { results: topRated.results.slice(0, 12) },
        genres: { genres: genres.genres },
      },
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
