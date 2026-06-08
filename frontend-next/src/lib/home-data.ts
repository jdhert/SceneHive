import 'server-only';

import {
  fetchGenres,
  fetchNowPlayingMovies,
  fetchTopRatedMovies,
  fetchTrendingMovies,
  fetchTrendingPeople,
  fetchTrendingTv,
  fetchUpcomingMovies,
} from '@/lib/tmdb';
import type { HomePayload } from '@/types/home';

const HOME_CACHE_TTL_MS = 10 * 60 * 1000;

let cachedHomePayload: {
  data: HomePayload;
  expiresAt: number;
} | null = null;

let pendingHomePayload: Promise<HomePayload> | null = null;

async function loadHomePayload(): Promise<HomePayload> {
  const [trending, trendingTv, trendingPeople, nowPlaying, upcoming, topRated, genres] = await Promise.all([
    fetchTrendingMovies(),
    fetchTrendingTv(),
    fetchTrendingPeople(),
    fetchNowPlayingMovies(),
    fetchUpcomingMovies(),
    fetchTopRatedMovies(),
    fetchGenres(),
  ]);

  return {
    trending: { results: trending.results.slice(0, 12) },
    trendingTv: { results: trendingTv.results.slice(0, 12) },
    trendingPeople: { results: trendingPeople.results.slice(0, 12) },
    nowPlaying: { results: nowPlaying.results.slice(0, 12) },
    upcoming: { results: upcoming.results.slice(0, 12) },
    topRated: { results: topRated.results.slice(0, 12) },
    genres: { genres: genres.genres },
  };
}

export async function fetchHomePayload(): Promise<HomePayload> {
  const now = Date.now();

  if (cachedHomePayload && cachedHomePayload.expiresAt > now) {
    return cachedHomePayload.data;
  }

  if (pendingHomePayload) {
    return pendingHomePayload;
  }

  pendingHomePayload = loadHomePayload()
    .then((data) => {
      cachedHomePayload = {
        data,
        expiresAt: Date.now() + HOME_CACHE_TTL_MS,
      };
      return data;
    })
    .catch((error) => {
      if (cachedHomePayload) {
        return cachedHomePayload.data;
      }
      throw error;
    })
    .finally(() => {
      pendingHomePayload = null;
    });

  return pendingHomePayload;
}
