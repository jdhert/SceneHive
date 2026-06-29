import 'server-only';

import {
  fetchAiringTodayTv,
  fetchGenres,
  fetchMovieDetailsPrimary,
  fetchMovieDetailsSupplemental,
  fetchMovieDetailsTextTranslation,
  fetchNowPlayingMovies,
  fetchPopularMovies,
  fetchPopularTv,
  fetchTvDetailsPrimary,
  fetchTvDetailsSupplemental,
  fetchTvDetailsTextTranslation,
  fetchTrendingAll,
  fetchTrendingMovies,
  fetchTrendingPeople,
  fetchTrendingTv,
  fetchUpcomingMovies,
  type TmdbMovie,
  type TmdbPerson,
  type TmdbTrendingAllItem,
  type TmdbTv,
} from '@/lib/tmdb';
import { readPositiveNumber, runWithConcurrency } from '@/lib/server-memory-cache';
import type { HomePayload, Movie } from '@/types/home';

const HOME_FEED_SNAPSHOT_TTL_MS = readPositiveNumber(
  process.env.HOME_FEED_SNAPSHOT_TTL_SECONDS,
  10 * 60
) * 1000;
const HOME_BACKGROUND_ENRICHMENT_ENABLED =
  process.env.HOME_BACKGROUND_ENRICHMENT_ENABLED === 'true';
const HOME_BACKGROUND_ENRICHMENT_LIMIT = Math.floor(
  readPositiveNumber(process.env.HOME_BACKGROUND_ENRICHMENT_LIMIT, 2)
);
const HOME_BACKGROUND_ENRICHMENT_CONCURRENCY = Math.floor(
  readPositiveNumber(process.env.HOME_BACKGROUND_ENRICHMENT_CONCURRENCY, 1)
);

let cachedHomePayload: {
  data: HomePayload;
  expiresAt: number;
} | null = null;

let pendingHomePayload: Promise<HomePayload> | null = null;

function movieToCard(movie: TmdbMovie): Movie {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    release_date: movie.release_date,
    genre_ids: movie.genre_ids,
    href: `/movies/${movie.id}`,
    display_meta: `영화 · ${movie.release_date ? new Date(movie.release_date).getFullYear() : '개봉일 미정'} · 평점 ${movie.vote_average.toFixed(1)}`,
    media_type: 'movie',
  };
}

function tvToCard(show: TmdbTv): Movie {
  return {
    id: show.id,
    title: show.name,
    overview: show.overview,
    poster_path: show.poster_path,
    backdrop_path: show.backdrop_path,
    vote_average: show.vote_average,
    vote_count: show.vote_count,
    release_date: show.first_air_date,
    genre_ids: show.genre_ids,
    href: `/tv/${show.id}`,
    display_meta: `TV · ${show.first_air_date ? new Date(show.first_air_date).getFullYear() : '방영일 미정'} · 평점 ${show.vote_average.toFixed(1)}`,
    media_type: 'tv',
  };
}

function personToCard(person: TmdbPerson): Movie {
  return {
    id: person.id,
    title: person.name,
    overview: `인기도 ${person.popularity.toFixed(1)}`,
    poster_path: person.profile_path,
    backdrop_path: null,
    vote_average: 0,
    release_date: '',
    href: `/people/${person.id}`,
    display_meta: `인물 · ${person.known_for_department || '분야 미정'}`,
    media_type: 'person',
  };
}

function trendingToCard(item: TmdbTrendingAllItem): Movie {
  if (item.media_type === 'movie') return movieToCard(item);
  if (item.media_type === 'tv') return tvToCard(item);
  return personToCard(item);
}

type EnrichmentCandidate = {
  id: number;
  mediaType: 'movie' | 'tv';
};

function collectHomeEnrichmentCandidates(data: HomePayload) {
  const candidates = new Map<string, EnrichmentCandidate>();

  function add(item: Pick<Movie, 'id' | 'media_type'> | TmdbTv, mediaType?: 'movie' | 'tv') {
    const resolvedMediaType = mediaType ?? (item as Movie).media_type;
    if (resolvedMediaType !== 'movie' && resolvedMediaType !== 'tv') {
      return;
    }

    const key = `${resolvedMediaType}:${item.id}`;
    if (!candidates.has(key)) {
      candidates.set(key, {
        id: item.id,
        mediaType: resolvedMediaType,
      });
    }
  }

  data.trendingNow.results.forEach((item) => add(item));

  if (candidates.size < HOME_BACKGROUND_ENRICHMENT_LIMIT) {
    data.trending.results.forEach((item) => add(item, 'movie'));
  }

  if (candidates.size < HOME_BACKGROUND_ENRICHMENT_LIMIT) {
    data.trendingTv.results.forEach((item) => add(item, 'tv'));
  }

  return Array.from(candidates.values()).slice(0, HOME_BACKGROUND_ENRICHMENT_LIMIT);
}

async function warmHomeMediaEnrichment(data: HomePayload) {
  if (!HOME_BACKGROUND_ENRICHMENT_ENABLED) {
    return;
  }

  const candidates = collectHomeEnrichmentCandidates(data);
  if (!candidates.length) {
    return;
  }

  await runWithConcurrency(
    candidates,
    HOME_BACKGROUND_ENRICHMENT_CONCURRENCY,
    async ({ id, mediaType }) => {
      if (mediaType === 'movie') {
        await Promise.allSettled([
          fetchMovieDetailsPrimary(id),
          fetchMovieDetailsSupplemental(id),
          fetchMovieDetailsTextTranslation(id),
        ]);
        return;
      }

      await Promise.allSettled([
        fetchTvDetailsPrimary(id),
        fetchTvDetailsSupplemental(id),
        fetchTvDetailsTextTranslation(id),
      ]);
    }
  );
}

async function loadHomePayload(): Promise<HomePayload> {
  const [
    trendingNow,
    trending,
    trendingTv,
    trendingPeople,
    nowPlaying,
    upcoming,
    popularMovies,
    popularTv,
    airingTodayTv,
    genres,
  ] = await Promise.all([
    fetchTrendingAll(),
    fetchTrendingMovies(),
    fetchTrendingTv(),
    fetchTrendingPeople(),
    fetchNowPlayingMovies(),
    fetchUpcomingMovies(),
    fetchPopularMovies(),
    fetchPopularTv(),
    fetchAiringTodayTv(),
    fetchGenres(),
  ]);

  return {
    trendingNow: { results: trendingNow.results.map(trendingToCard).slice(0, 14) },
    trending: { results: trending.results.map(movieToCard).slice(0, 12) },
    trendingTv: { results: trendingTv.results.slice(0, 12) },
    trendingPeople: { results: trendingPeople.results.slice(0, 12) },
    nowPlaying: { results: nowPlaying.results.map(movieToCard).slice(0, 12) },
    upcoming: { results: upcoming.results.map(movieToCard).slice(0, 12) },
    popularMovies: { results: popularMovies.results.map(movieToCard).slice(0, 12) },
    popularTv: { results: popularTv.results.slice(0, 12) },
    airingTodayTv: { results: airingTodayTv.results.slice(0, 12) },
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
        expiresAt: Date.now() + HOME_FEED_SNAPSHOT_TTL_MS,
      };
      void warmHomeMediaEnrichment(data).catch(() => {
        // Home feed must stay fast even if enrichment preloading fails.
      });
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
