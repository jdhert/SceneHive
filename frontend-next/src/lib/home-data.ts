import 'server-only';

import {
  fetchAiringTodayTv,
  fetchGenres,
  fetchNowPlayingMovies,
  fetchPopularMovies,
  fetchPopularTv,
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
import type { HomePayload, Movie } from '@/types/home';

const HOME_CACHE_TTL_MS = 10 * 60 * 1000;

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
