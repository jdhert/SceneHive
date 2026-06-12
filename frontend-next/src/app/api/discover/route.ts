import { NextRequest, NextResponse } from 'next/server';
import {
  fetchDiscoverMovies,
  fetchDiscoverTv,
  type TmdbDiscoverMediaType,
  type TmdbDiscoverSort,
  type TmdbMovie,
  type TmdbTv,
} from '@/lib/tmdb';

const CLIENT_PAGE_SIZE = 24;
const TMDB_PAGE_SIZE = 20;
const SORT_VALUES = new Set<TmdbDiscoverSort>(['popular', 'rating', 'recent', 'votes']);

function parseMediaType(value: string | null): TmdbDiscoverMediaType {
  return value === 'tv' ? 'tv' : 'movie';
}

function parseSort(value: string | null): TmdbDiscoverSort {
  if (value && SORT_VALUES.has(value as TmdbDiscoverSort)) {
    return value as TmdbDiscoverSort;
  }
  return 'popular';
}

function parsePage(value: string | null) {
  const page = Number(value ?? '1');
  return Number.isNaN(page) || page < 1 ? 1 : page;
}

function parseYear(value: string | null) {
  if (!value) return undefined;
  const year = Number(value);
  const currentYear = new Date().getFullYear() + 2;
  if (Number.isNaN(year) || year < 1900 || year > currentYear) return undefined;
  return year;
}

function parseMinRating(value: string | null) {
  if (!value) return undefined;
  const rating = Number(value);
  if (Number.isNaN(rating) || rating < 0 || rating > 10) return undefined;
  return rating;
}

function parseGenreIds(value: string | null) {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((item) => !Number.isNaN(item) && item > 0)
    )
  );
}

function normalizeMovie(movie: TmdbMovie) {
  return {
    id: movie.id,
    media_type: 'movie' as const,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    popularity: movie.popularity,
    release_date: movie.release_date,
    genre_ids: movie.genre_ids ?? [],
  };
}

function normalizeTv(show: TmdbTv) {
  return {
    id: show.id,
    media_type: 'tv' as const,
    title: show.name,
    overview: show.overview,
    poster_path: show.poster_path,
    backdrop_path: show.backdrop_path,
    vote_average: show.vote_average,
    vote_count: show.vote_count,
    popularity: show.popularity,
    release_date: show.first_air_date,
    genre_ids: show.genre_ids ?? [],
  };
}

async function fetchDiscoverPage({
  mediaType,
  genreIds,
  sort,
  yearFrom,
  yearTo,
  minRating,
  appPage,
}: {
  mediaType: TmdbDiscoverMediaType;
  genreIds: number[];
  sort: TmdbDiscoverSort;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  appPage: number;
}) {
  const offset = (appPage - 1) * CLIENT_PAGE_SIZE;
  const tmdbStartPage = Math.floor(offset / TMDB_PAGE_SIZE) + 1;
  const indexInStartPage = offset % TMDB_PAGE_SIZE;

  const request = {
    genreIds,
    sort,
    yearFrom,
    yearTo,
    minRating,
  };

  const first = mediaType === 'movie'
    ? await fetchDiscoverMovies({ ...request, page: tmdbStartPage })
    : await fetchDiscoverTv({ ...request, page: tmdbStartPage });
  const needItems = indexInStartPage + CLIENT_PAGE_SIZE;
  const morePages: number[] = [];

  if (needItems > TMDB_PAGE_SIZE && tmdbStartPage + 1 <= first.total_pages) {
    morePages.push(tmdbStartPage + 1);
  }
  if (needItems > TMDB_PAGE_SIZE * 2 && tmdbStartPage + 2 <= first.total_pages) {
    morePages.push(tmdbStartPage + 2);
  }

  const normalized = mediaType === 'movie'
    ? [
        ...(first.results as TmdbMovie[] ?? []),
        ...(
          morePages.length
            ? (await Promise.all(morePages.map((page) => fetchDiscoverMovies({ ...request, page }))))
                .flatMap((item) => item.results ?? [])
            : []
        ),
      ].map(normalizeMovie)
    : [
        ...(first.results as TmdbTv[] ?? []),
        ...(
          morePages.length
            ? (await Promise.all(morePages.map((page) => fetchDiscoverTv({ ...request, page }))))
                .flatMap((item) => item.results ?? [])
            : []
        ),
      ].map(normalizeTv);
  const results = normalized.slice(indexInStartPage, indexInStartPage + CLIENT_PAGE_SIZE);

  return {
    page: appPage,
    total_results: first.total_results,
    total_pages: Math.ceil(first.total_results / CLIENT_PAGE_SIZE),
    results,
  };
}

export async function GET(request: NextRequest) {
  const mediaType = parseMediaType(request.nextUrl.searchParams.get('type'));
  const sort = parseSort(request.nextUrl.searchParams.get('sort'));
  const page = parsePage(request.nextUrl.searchParams.get('page'));
  const genreIds = parseGenreIds(request.nextUrl.searchParams.get('genres'));
  const yearFrom = parseYear(request.nextUrl.searchParams.get('yearFrom'));
  const yearTo = parseYear(request.nextUrl.searchParams.get('yearTo'));
  const minRating = parseMinRating(request.nextUrl.searchParams.get('rating'));

  try {
    const discover = await fetchDiscoverPage({
      mediaType,
      genreIds,
      sort,
      yearFrom,
      yearTo,
      minRating,
      appPage: page,
    });

    return NextResponse.json({
      type: mediaType,
      sort,
      genre_ids: genreIds,
      year_from: yearFrom ?? null,
      year_to: yearTo ?? null,
      min_rating: minRating ?? null,
      ...discover,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
