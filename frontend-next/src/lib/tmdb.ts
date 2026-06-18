import 'server-only';

import {
  makeTranslationCacheKey,
  translateTextToKorean,
  translateTextsToKorean,
} from '@/lib/translation';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OMDB_BASE_URL = process.env.OMDB_BASE_URL || 'https://www.omdbapi.com/';
const OMDB_API_KEY = process.env.OMDB_API_KEY;

const DEFAULT_LANGUAGE = 'ko-KR';
const DEFAULT_REGION = 'KR';
const DEFAULT_REVALIDATE_SECONDS = 600;
const NOW_PLAYING_LOOKUP_PAGE_LIMIT = 5;
const OMDB_RATINGS_CACHE_TTL_SECONDS = Number(
  process.env.OMDB_RATINGS_CACHE_TTL_SECONDS ?? 86400
);

export type TmdbMovie = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
};

export type TmdbTv = {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  first_air_date: string;
  genre_ids: number[];
  original_language: string;
  origin_country: string[];
};

export type TmdbPersonKnownFor = {
  id: number;
  title?: string;
  name?: string;
  media_type?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
};

export type TmdbPerson = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  adult: boolean;
  gender: number;
  known_for?: TmdbPersonKnownFor[];
};

export type TmdbPersonMovieCredit = {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  character?: string;
  job?: string;
  department?: string;
};

export type TmdbGenre = {
  id: number;
  name: string;
};

export type TmdbDiscoverMediaType = 'movie' | 'tv';

export type TmdbDiscoverSort = 'popular' | 'rating' | 'recent' | 'votes';

export type TmdbDiscoverParams = {
  mediaType: TmdbDiscoverMediaType;
  genreIds?: number[];
  sort?: TmdbDiscoverSort;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  page?: number;
};

export type TmdbWatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
};

export type TmdbWatchProviderRegion = {
  link?: string;
  flatrate?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
  ads?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
};

export type TmdbWatchProvidersResponse = {
  id: number;
  results: Record<string, TmdbWatchProviderRegion>;
};

export type TmdbTheatricalStatus = {
  region: string;
  is_now_playing: boolean;
  source: 'tmdb_now_playing';
  checked_pages: number;
  total_pages: number;
};

export type ExternalRatingsPayload = {
  imdb_id: string;
  source: 'omdb';
  cached_at: string;
  rotten_tomatoes?: {
    value: number;
    scale: 100;
    url: string;
  } | null;
  imdb?: {
    value: number;
    scale: 10;
    votes: string | null;
    url: string;
  } | null;
  metascore?: {
    value: number;
    scale: 100;
    url: string;
  } | null;
};

export type TmdbMovieDetail = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  release_date: string;
  runtime: number | null;
  status: string;
  tagline: string | null;
  homepage: string | null;
  imdb_id: string | null;
  budget: number;
  revenue: number;
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  production_companies: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  genres: TmdbGenre[];
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }[];
  };
  videos?: {
    results: {
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
      published_at: string;
    }[];
  };
  recommendations?: {
    results: TmdbMovie[];
  };
  watch_providers?: TmdbWatchProvidersResponse | null;
  theatrical_status?: TmdbTheatricalStatus | null;
  external_ratings?: ExternalRatingsPayload | null;
};

export type TmdbVideoListResponse = {
  results: {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
    published_at: string;
  }[];
};

export type TmdbPersonDetail = {
  id: number;
  name: string;
  also_known_as: string[];
  biography: string;
  birthday: string | null;
  deathday: string | null;
  gender: number;
  homepage: string | null;
  imdb_id: string | null;
  known_for_department: string;
  place_of_birth: string | null;
  popularity: number;
  profile_path: string | null;
  external_ids?: {
    imdb_id?: string;
    instagram_id?: string;
    facebook_id?: string;
    twitter_id?: string;
    youtube_id?: string;
    wikidata_id?: string;
    tiktok_id?: string;
  };
  movie_credits?: {
    cast: TmdbPersonMovieCredit[];
    crew: TmdbPersonMovieCredit[];
  };
  images?: {
    profiles: {
      aspect_ratio: number;
      height: number;
      width: number;
      file_path: string | null;
    }[];
  };
};

export type TmdbSearchMultiItem = {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  profile_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
  known_for_department?: string;
};

export type TmdbTrendingAllItem =
  | (TmdbMovie & { media_type: 'movie' })
  | (TmdbTv & { media_type: 'tv' })
  | (TmdbPerson & { media_type: 'person' });

type TmdbMovieListResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

type TmdbTvListResponse = {
  page: number;
  results: TmdbTv[];
  total_pages: number;
  total_results: number;
};

type TmdbPersonListResponse = {
  page: number;
  results: TmdbPerson[];
  total_pages: number;
  total_results: number;
};

type TmdbTrendingAllResponse = {
  page: number;
  results: TmdbTrendingAllItem[];
  total_pages: number;
  total_results: number;
};

type TmdbGenreListResponse = {
  genres: TmdbGenre[];
};

type TmdbMultiSearchResponse = {
  page: number;
  results: TmdbSearchMultiItem[];
  total_pages: number;
  total_results: number;
};

export type TmdbTvDetail = {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  first_air_date: string;
  last_air_date: string;
  number_of_episodes: number;
  number_of_seasons: number;
  episode_run_time: number[];
  status: string;
  tagline: string;
  homepage: string | null;
  in_production: boolean;
  genres: TmdbGenre[];
  networks: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  origin_country: string[];
  production_companies: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }[];
  };
  videos?: {
    results: {
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
      published_at: string;
    }[];
  };
  recommendations?: {
    results: TmdbTv[];
  };
  watch_providers?: TmdbWatchProvidersResponse | null;
  external_ids?: {
    imdb_id?: string | null;
  };
  external_ratings?: ExternalRatingsPayload | null;
};

type TmdbFetchOptions = {
  revalidate?: number;
  language?: string;
};

type OmdbRating = {
  Source: string;
  Value: string;
};

type OmdbResponse = {
  Response: 'True' | 'False';
  Error?: string;
  Title?: string;
  imdbID?: string;
  imdbRating?: string;
  imdbVotes?: string;
  Metascore?: string;
  Ratings?: OmdbRating[];
};

type ExternalRatingsCacheEntry = {
  expiresAt: number;
  value: ExternalRatingsPayload | null;
};

type ExternalRatingsRequestOptions = {
  mediaType?: 'movie' | 'tv';
  metacriticTitle?: string | null;
};

const externalRatingsCache = new Map<string, ExternalRatingsCacheEntry>();

function omdbCacheTtlSeconds() {
  if (!Number.isFinite(OMDB_RATINGS_CACHE_TTL_SECONDS) || OMDB_RATINGS_CACHE_TTL_SECONDS <= 0) {
    return 86400;
  }

  return OMDB_RATINGS_CACHE_TTL_SECONDS;
}

function parseNumber(value: string | undefined | null) {
  if (!value || value === 'N/A') {
    return null;
  }

  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRatingValue(ratings: OmdbRating[] | undefined, source: string) {
  const rating = ratings?.find((item) => item.Source.toLowerCase() === source.toLowerCase());
  if (!rating) {
    return null;
  }

  const [rawValue] = rating.Value.split('/');
  return parseNumber(rawValue);
}

function parsePercentValue(value: string | undefined | null) {
  if (!value || value === 'N/A') {
    return null;
  }

  const normalized = value.trim().replace('%', '');
  return parseNumber(normalized);
}

function parsePercentRatingValue(ratings: OmdbRating[] | undefined, source: string) {
  const rating = ratings?.find((item) => item.Source.toLowerCase() === source.toLowerCase());
  if (!rating) {
    return null;
  }

  return parsePercentValue(rating.Value);
}

function slugifyMetacriticTitle(title: string) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildMetacriticUrl(options: ExternalRatingsRequestOptions | undefined) {
  if (!options?.mediaType || !options.metacriticTitle?.trim()) {
    return null;
  }

  const slug = slugifyMetacriticTitle(options.metacriticTitle);
  if (!slug) {
    return null;
  }

  return `https://www.metacritic.com/${options.mediaType}/${slug}/`;
}

function slugifyRottenTomatoesTitle(title: string) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildRottenTomatoesUrl(options: ExternalRatingsRequestOptions | undefined) {
  if (!options?.mediaType || !options.metacriticTitle?.trim()) {
    return null;
  }

  const slug = slugifyRottenTomatoesTitle(options.metacriticTitle);
  if (!slug) {
    return null;
  }

  const pathPrefix = options.mediaType === 'tv' ? 'tv' : 'm';
  return `https://www.rottentomatoes.com/${pathPrefix}/${slug}`;
}

async function fetchExternalRatingsByImdbId(
  imdbId: string | null | undefined,
  options?: ExternalRatingsRequestOptions
) {
  if (!imdbId || !OMDB_API_KEY) {
    return null;
  }

  const ttlSeconds = omdbCacheTtlSeconds();
  const cached = externalRatingsCache.get(imdbId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const url = new URL(OMDB_BASE_URL);
  url.searchParams.set('apikey', OMDB_API_KEY);
  url.searchParams.set('i', imdbId);
  url.searchParams.set('r', 'json');
  url.searchParams.set('plot', 'short');
  url.searchParams.set('tomatoes', 'true');

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: ttlSeconds },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as OmdbResponse;
    if (payload.Response !== 'True') {
      const value = null;
      externalRatingsCache.set(imdbId, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return value;
    }

    const imdbValue =
      parseNumber(payload.imdbRating) ??
      parseRatingValue(payload.Ratings, 'Internet Movie Database');
    const metascoreValue =
      parseNumber(payload.Metascore) ??
      parseRatingValue(payload.Ratings, 'Metacritic');
    const rottenTomatoesValue = parsePercentRatingValue(payload.Ratings, 'Rotten Tomatoes');
    const titleOptions = {
      ...options,
      metacriticTitle: options?.metacriticTitle ?? payload.Title,
    };
    const metacriticUrl = buildMetacriticUrl(titleOptions);
    const rottenTomatoesUrl = buildRottenTomatoesUrl(titleOptions);

    const value: ExternalRatingsPayload | null =
      imdbValue !== null || metascoreValue !== null || rottenTomatoesValue !== null
        ? {
            imdb_id: payload.imdbID || imdbId,
            source: 'omdb',
            cached_at: new Date().toISOString(),
            rotten_tomatoes: rottenTomatoesValue !== null
              ? {
                  value: rottenTomatoesValue,
                  scale: 100,
                  url: rottenTomatoesUrl ?? `https://www.rottentomatoes.com/search?search=${encodeURIComponent(payload.Title ?? imdbId)}`,
                }
              : null,
            imdb: imdbValue !== null
              ? {
                  value: imdbValue,
                  scale: 10,
                  votes: payload.imdbVotes && payload.imdbVotes !== 'N/A' ? payload.imdbVotes : null,
                  url: `https://www.imdb.com/title/${imdbId}/`,
                }
              : null,
            metascore: metascoreValue !== null
              ? {
                  value: metascoreValue,
                  scale: 100,
                  url: metacriticUrl ?? `https://www.metacritic.com/search/${encodeURIComponent(payload.Title ?? imdbId)}/`,
                }
              : null,
          }
        : null;

    externalRatingsCache.set(imdbId, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return value;
  } catch {
    return null;
  }
}

function hasOverview(text: string | null | undefined): text is string {
  return Boolean(text?.trim());
}

function hasKoreanText(text: string | null | undefined) {
  return /[\u3131-\u318E\uAC00-\uD7A3]/.test(text ?? '');
}

function needsKoreanTextFallback(text: string | null | undefined) {
  return !hasOverview(text) || !hasKoreanText(text);
}

async function fillMissingMovieOverviews(
  path: string,
  params: Record<string, string | number | undefined>,
  source: TmdbMovieListResponse
) {
  const needsFallback = source.results.some((movie) => needsKoreanTextFallback(movie.overview));
  if (!needsFallback) {
    return source;
  }

  try {
    const fallbackEn = await tmdbFetch<TmdbMovieListResponse>(path, params, { language: 'en-US' });
    const fallbackEntries = (fallbackEn.results ?? [])
      .filter((movie) => hasOverview(movie.overview))
      .map((movie) => ({
        id: movie.id,
        key: makeTranslationCacheKey('movie', movie.id, 'overview', movie.overview),
        text: movie.overview,
      }));
    const translatedOverviews = await translateTextsToKorean(fallbackEntries);
    const fallbackMap = new Map(
      fallbackEntries.map((entry) => [entry.id, translatedOverviews.get(entry.key) ?? entry.text])
    );

    return {
      ...source,
      results: source.results.map((movie) => {
        if (hasKoreanText(movie.overview)) {
          return movie;
        }

        const overviewEn = fallbackMap.get(movie.id);
        if (!hasOverview(overviewEn)) {
          return movie;
        }

        return {
          ...movie,
          overview: overviewEn,
        };
      }),
    };
  } catch {
    return source;
  }
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  options: TmdbFetchOptions = {}
): Promise<T> {
  const revalidate = options.revalidate ?? DEFAULT_REVALIDATE_SECONDS;
  const language = options.language ?? DEFAULT_LANGUAGE;

  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured');
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', language);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchTrendingMovies() {
  const response = await tmdbFetch<TmdbMovieListResponse>('/trending/movie/day');
  return fillMissingMovieOverviews('/trending/movie/day', {}, response);
}

async function fillMissingTvOverviews(
  path: string,
  params: Record<string, string | number | undefined>,
  source: TmdbTvListResponse
) {
  const needsFallback = source.results.some((show) => needsKoreanTextFallback(show.overview));
  if (!needsFallback) {
    return source;
  }

  try {
    const fallbackEn = await tmdbFetch<TmdbTvListResponse>(path, params, { language: 'en-US' });
    const fallbackEntries = (fallbackEn.results ?? [])
      .filter((show) => hasOverview(show.overview))
      .map((show) => ({
        id: show.id,
        key: makeTranslationCacheKey('tv', show.id, 'overview', show.overview),
        text: show.overview,
      }));
    const translatedOverviews = await translateTextsToKorean(fallbackEntries);
    const fallbackMap = new Map(
      fallbackEntries.map((entry) => [entry.id, translatedOverviews.get(entry.key) ?? entry.text])
    );

    return {
      ...source,
      results: source.results.map((show) => {
        if (hasKoreanText(show.overview)) {
          return show;
        }

        const overviewEn = fallbackMap.get(show.id);
        if (!hasOverview(overviewEn)) {
          return show;
        }

        return {
          ...show,
          overview: overviewEn,
        };
      }),
    };
  } catch {
    return source;
  }
}

async function fillMissingTrendingAllOverviews(source: TmdbTrendingAllResponse) {
  const needsFallback = source.results.some(
    (item) =>
      (item.media_type === 'movie' || item.media_type === 'tv') &&
      needsKoreanTextFallback(item.overview)
  );

  if (!needsFallback) {
    return source;
  }

  try {
    const fallbackEn = await tmdbFetch<TmdbTrendingAllResponse>(
      '/trending/all/day',
      {},
      { language: 'en-US' }
    );
    const fallbackEntries: {
      id: number;
      mediaType: 'movie' | 'tv';
      key: string;
      text: string;
    }[] = [];

    for (const item of fallbackEn.results ?? []) {
      if (item.media_type !== 'movie' && item.media_type !== 'tv') {
        continue;
      }

      if (hasOverview(item.overview)) {
        fallbackEntries.push({
          id: item.id,
          mediaType: item.media_type,
          key: makeTranslationCacheKey(item.media_type, item.id, 'overview', item.overview),
          text: item.overview,
        });
      }
    }

    const translatedOverviews = await translateTextsToKorean(fallbackEntries);
    const fallbackMap = new Map(
      fallbackEntries.map((entry) => [
        `${entry.mediaType}:${entry.id}`,
        translatedOverviews.get(entry.key) ?? entry.text,
      ])
    );

    return {
      ...source,
      results: source.results.map((item): TmdbTrendingAllItem => {
        if (item.media_type !== 'movie' && item.media_type !== 'tv') {
          return item;
        }

        if (hasKoreanText(item.overview)) {
          return item;
        }

        const overviewEn = fallbackMap.get(`${item.media_type}:${item.id}`);
        if (!hasOverview(overviewEn)) {
          return item;
        }

        return {
          ...item,
          overview: overviewEn,
        };
      }),
    };
  } catch {
    return source;
  }
}

export async function fetchTrendingAll() {
  const response = await tmdbFetch<TmdbTrendingAllResponse>('/trending/all/day');
  return fillMissingTrendingAllOverviews(response);
}

export async function fetchTrendingTv() {
  const response = await tmdbFetch<TmdbTvListResponse>('/trending/tv/day');
  return fillMissingTvOverviews('/trending/tv/day', {}, response);
}

export async function fetchTrendingPeople() {
  return tmdbFetch<TmdbPersonListResponse>('/trending/person/day');
}

export async function fetchNowPlayingMovies() {
  const params = {
    region: DEFAULT_REGION,
    page: 1,
  };
  const response = await tmdbFetch<TmdbMovieListResponse>('/movie/now_playing', params);
  return fillMissingMovieOverviews('/movie/now_playing', params, response);
}

export async function fetchUpcomingMovies() {
  const params = {
    region: DEFAULT_REGION,
    page: 1,
  };
  const response = await tmdbFetch<TmdbMovieListResponse>('/movie/upcoming', params);
  return fillMissingMovieOverviews('/movie/upcoming', params, response);
}

export async function fetchTopRatedMovies() {
  const params = {
    page: 1,
  };
  const response = await tmdbFetch<TmdbMovieListResponse>('/movie/top_rated', params);
  return fillMissingMovieOverviews('/movie/top_rated', params, response);
}

export async function fetchPopularMovies() {
  const params = {
    page: 1,
  };
  const response = await tmdbFetch<TmdbMovieListResponse>('/movie/popular', params);
  return fillMissingMovieOverviews('/movie/popular', params, response);
}

export async function fetchPopularTv() {
  const params = {
    page: 1,
  };
  const response = await tmdbFetch<TmdbTvListResponse>('/tv/popular', params);
  return fillMissingTvOverviews('/tv/popular', params, response);
}

export async function fetchAiringTodayTv() {
  const params = {
    timezone: 'Asia/Seoul',
    page: 1,
  };
  const response = await tmdbFetch<TmdbTvListResponse>('/tv/airing_today', params);
  return fillMissingTvOverviews('/tv/airing_today', params, response);
}

export async function fetchMoviesByGenres(genreIds: number[], page = 1) {
  const normalizedIds = Array.from(new Set(genreIds.filter((id) => id > 0)));
  if (!normalizedIds.length) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    } satisfies TmdbMovieListResponse;
  }

  const params = {
    with_genres: normalizedIds.join(','),
    sort_by: 'popularity.desc',
    include_adult: 'false',
    page,
  };
  const response = await tmdbFetch<TmdbMovieListResponse>('/discover/movie', params);
  return fillMissingMovieOverviews('/discover/movie', params, response);
}

export async function fetchGenres() {
  return tmdbFetch<TmdbGenreListResponse>('/genre/movie/list');
}

export async function fetchTvGenres() {
  return tmdbFetch<TmdbGenreListResponse>('/genre/tv/list');
}

function mapMovieDiscoverSort(sort: TmdbDiscoverSort) {
  if (sort === 'rating') return 'vote_average.desc';
  if (sort === 'recent') return 'primary_release_date.desc';
  if (sort === 'votes') return 'vote_count.desc';
  return 'popularity.desc';
}

function mapTvDiscoverSort(sort: TmdbDiscoverSort) {
  if (sort === 'rating') return 'vote_average.desc';
  if (sort === 'recent') return 'first_air_date.desc';
  if (sort === 'votes') return 'vote_count.desc';
  return 'popularity.desc';
}

function yearStart(year: number | undefined) {
  return year ? `${year}-01-01` : undefined;
}

function yearEnd(year: number | undefined) {
  return year ? `${year}-12-31` : undefined;
}

export async function fetchDiscoverMovies({
  genreIds = [],
  sort = 'popular',
  yearFrom,
  yearTo,
  minRating,
  page = 1,
}: Omit<TmdbDiscoverParams, 'mediaType'>) {
  const params = {
    include_adult: 'false',
    region: DEFAULT_REGION,
    sort_by: mapMovieDiscoverSort(sort),
    with_genres: genreIds.length ? genreIds.join(',') : undefined,
    'primary_release_date.gte': yearStart(yearFrom),
    'primary_release_date.lte': yearEnd(yearTo),
    'vote_average.gte': minRating && minRating > 0 ? minRating : undefined,
    'vote_count.gte': minRating && minRating >= 7 ? 80 : 20,
    page,
  };
  const response = await tmdbFetch<TmdbMovieListResponse>('/discover/movie', params);
  return fillMissingMovieOverviews('/discover/movie', params, response);
}

export async function fetchDiscoverTv({
  genreIds = [],
  sort = 'popular',
  yearFrom,
  yearTo,
  minRating,
  page = 1,
}: Omit<TmdbDiscoverParams, 'mediaType'>) {
  const params = {
    include_adult: 'false',
    include_null_first_air_dates: 'false',
    sort_by: mapTvDiscoverSort(sort),
    with_genres: genreIds.length ? genreIds.join(',') : undefined,
    'first_air_date.gte': yearStart(yearFrom),
    'first_air_date.lte': yearEnd(yearTo),
    'vote_average.gte': minRating && minRating > 0 ? minRating : undefined,
    'vote_count.gte': minRating && minRating >= 7 ? 80 : 20,
    page,
  };
  const response = await tmdbFetch<TmdbTvListResponse>('/discover/tv', params);
  return fillMissingTvOverviews('/discover/tv', params, response);
}

export async function fetchMovieVideos(movieId: number) {
  const primary = await tmdbFetch<TmdbVideoListResponse>(`/movie/${movieId}/videos`);
  const hasTrailer = (primary.results ?? []).some(
    (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
  );

  if (hasTrailer) {
    return primary;
  }

  try {
    const fallbackEn = await tmdbFetch<TmdbVideoListResponse>(
      `/movie/${movieId}/videos`,
      {},
      { language: 'en-US' }
    );

    return {
      results: [...(primary.results ?? []), ...(fallbackEn.results ?? [])].filter(
        (video, index, array) =>
          array.findIndex((item) => item.key === video.key && item.site === video.site) === index
      ),
    };
  } catch {
    return primary;
  }
}

export async function fetchMovieWatchProviders(movieId: number) {
  return tmdbFetch<TmdbWatchProvidersResponse>(`/movie/${movieId}/watch/providers`);
}

export async function fetchTvWatchProviders(tvId: number) {
  return tmdbFetch<TmdbWatchProvidersResponse>(`/tv/${tvId}/watch/providers`);
}

export async function fetchMovieTheatricalStatus(
  movieId: number,
  region = DEFAULT_REGION
): Promise<TmdbTheatricalStatus> {
  const firstPage = await tmdbFetch<TmdbMovieListResponse>('/movie/now_playing', {
    region,
    page: 1,
  });
  const totalPages = firstPage.total_pages ?? 1;
  const pageLimit = Math.max(1, Math.min(totalPages, NOW_PLAYING_LOOKUP_PAGE_LIMIT));

  if ((firstPage.results ?? []).some((movie) => movie.id === movieId)) {
    return {
      region,
      is_now_playing: true,
      source: 'tmdb_now_playing',
      checked_pages: 1,
      total_pages: totalPages,
    };
  }

  const pageNumbers = Array.from({ length: pageLimit - 1 }, (_, index) => index + 2);
  const pages = await Promise.all(
    pageNumbers.map((page) =>
      tmdbFetch<TmdbMovieListResponse>('/movie/now_playing', { region, page }).catch(() => null)
    )
  );
  const checkedPages = 1 + pages.filter(Boolean).length;
  const isNowPlaying = pages.some((page) =>
    (page?.results ?? []).some((movie) => movie.id === movieId)
  );

  return {
    region,
    is_now_playing: isNowPlaying,
    source: 'tmdb_now_playing',
    checked_pages: checkedPages,
    total_pages: totalPages,
  };
}

export async function fetchSearchMovies(query: string, page = 1) {
  const params = {
    query,
    page,
    include_adult: 'false',
  };
  const response = await tmdbFetch<TmdbMovieListResponse>('/search/movie', params);
  return fillMissingMovieOverviews('/search/movie', params, response);
}

export async function fetchSearchMulti(query: string, page = 1) {
  const params = {
    query,
    page,
    include_adult: 'false',
  };

  const primary = await tmdbFetch<TmdbMultiSearchResponse>('/search/multi', params);
  const needOverviewFallback = (primary.results ?? []).some(
    (item) =>
      (item.media_type === 'movie' || item.media_type === 'tv') &&
      needsKoreanTextFallback(item.overview)
  );

  if (!needOverviewFallback) {
    return primary;
  }

  try {
    const fallbackEn = await tmdbFetch<TmdbMultiSearchResponse>(
      '/search/multi',
      params,
      { language: 'en-US' }
    );
    const fallbackEntries = (fallbackEn.results ?? [])
      .filter(
        (item) =>
          (item.media_type === 'movie' || item.media_type === 'tv') &&
          hasOverview(item.overview)
      )
      .map((item) => ({
        id: item.id,
        mediaType: item.media_type as 'movie' | 'tv',
        key: makeTranslationCacheKey(
          item.media_type as 'movie' | 'tv',
          item.id,
          'overview',
          item.overview ?? ''
        ),
        text: item.overview ?? '',
      }));
    const translatedOverviews = await translateTextsToKorean(fallbackEntries);
    const fallbackMap = new Map(
      fallbackEntries.map((item) => [
        `${item.mediaType}:${item.id}`,
        translatedOverviews.get(item.key) ?? item.text,
      ])
    );

    return {
      ...primary,
      results: (primary.results ?? []).map((item) => {
        if (
          item.media_type !== 'movie' &&
          item.media_type !== 'tv'
        ) {
          return item;
        }
        if (hasKoreanText(item.overview)) {
          return item;
        }
        const fallbackOverview = fallbackMap.get(`${item.media_type}:${item.id}`);
        if (!hasOverview(fallbackOverview)) {
          return item;
        }
        return {
          ...item,
          overview: fallbackOverview,
        };
      }),
    };
  } catch {
    return primary;
  }
}

export async function fetchSearchPeople(query: string, page = 1) {
  return tmdbFetch<TmdbPersonListResponse>('/search/person', {
    query,
    page,
    include_adult: 'false',
  });
}

export async function fetchPersonDetails(personId: number) {
  const detail = await tmdbFetch<TmdbPersonDetail>(`/person/${personId}`, {
    append_to_response: 'movie_credits,external_ids,images',
  });

  if (detail.biography?.trim()) {
    return detail;
  }

  try {
    const fallbackEn = await tmdbFetch<TmdbPersonDetail>(
      `/person/${personId}`,
      { append_to_response: 'movie_credits,external_ids,images' },
      { language: 'en-US' }
    );

    return {
      ...detail,
      biography: fallbackEn.biography || detail.biography,
    };
  } catch {
    return detail;
  }
}

async function fetchTvDetailsBase(
  tvId: number,
  includeSupplemental: boolean,
  translateFallbackText = true
) {
  const appendToResponse = includeSupplemental
    ? 'credits,videos,recommendations,external_ids'
    : 'credits,videos';
  const detail = await tmdbFetch<TmdbTvDetail>(`/tv/${tvId}`, {
    append_to_response: appendToResponse,
  });

  const needOverview = needsKoreanTextFallback(detail.overview);
  const needTagline = needsKoreanTextFallback(detail.tagline);
  const hasKoreanTrailer = (detail.videos?.results ?? []).some(
    (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
  );
  const needTrailerFallback = !hasKoreanTrailer;

  if (!needOverview && !needTagline && !needTrailerFallback) {
    return detail;
  }

  try {
    const fallbackEn = await tmdbFetch<TmdbTvDetail>(
      `/tv/${tvId}`,
      { append_to_response: appendToResponse },
      { language: 'en-US' }
    );

    const mergedVideos = needTrailerFallback
      ? [...(detail.videos?.results ?? []), ...(fallbackEn.videos?.results ?? [])].filter(
          (video, index, array) =>
            array.findIndex((item) => item.key === video.key && item.site === video.site) === index
        )
      : detail.videos?.results ?? [];
    const overviewSource = hasOverview(fallbackEn.overview)
      ? fallbackEn.overview
      : detail.overview;
    const taglineSource = hasOverview(fallbackEn.tagline)
      ? fallbackEn.tagline
      : detail.tagline;
    const [translatedOverview, translatedTagline] = await Promise.all([
      needOverview && hasOverview(overviewSource) && translateFallbackText
        ? translateTextToKorean(
            overviewSource,
            makeTranslationCacheKey('tv', tvId, 'overview', overviewSource)
          )
        : overviewSource,
      needTagline && hasOverview(taglineSource) && translateFallbackText
        ? translateTextToKorean(
            taglineSource,
            makeTranslationCacheKey('tv', tvId, 'tagline', taglineSource)
          )
        : taglineSource,
    ]);

    return {
      ...detail,
      overview: needOverview ? translatedOverview : detail.overview,
      tagline: needTagline ? translatedTagline : detail.tagline,
      videos: {
        results: mergedVideos,
      },
    };
  } catch {
    return detail;
  }
}

export async function fetchTvDetailsPrimary(tvId: number) {
  return fetchTvDetailsBase(tvId, false, false);
}

export async function fetchTvDetailsSupplemental(tvId: number, baseDetail?: TmdbTvDetail) {
  const detail =
    baseDetail ??
    (await tmdbFetch<TmdbTvDetail>(`/tv/${tvId}`, {
      append_to_response: 'recommendations,external_ids',
    }));

  const [watchProviders, externalRatings] = await Promise.all([
    fetchTvWatchProviders(tvId).catch(() => null),
    fetchExternalRatingsByImdbId(detail.external_ids?.imdb_id, {
      mediaType: 'tv',
      metacriticTitle: detail.original_name || detail.name,
    }).catch(() => null),
  ]);

  return {
    watch_providers: watchProviders,
    external_ratings: externalRatings,
    recommendations: {
      results: detail.recommendations?.results ?? [],
    },
  };
}

export async function fetchTvDetails(tvId: number) {
  const detail = await fetchTvDetailsBase(tvId, true);
  const supplemental = await fetchTvDetailsSupplemental(tvId, detail);

  return {
    ...detail,
    ...supplemental,
  };
}

export async function fetchTvDetailsTextTranslation(tvId: number) {
  const detail = await fetchTvDetailsBase(tvId, false, true);

  return {
    overview: detail.overview,
    tagline: detail.tagline,
  };
}

async function fetchSimilarMovies(movieId: number) {
  return tmdbFetch<TmdbMovieListResponse>(`/movie/${movieId}/similar`, {
    page: 1,
  });
}

async function fetchDiscoverMoviesByGenres(genreIds: number[]) {
  if (!genreIds.length) {
    return null;
  }

  return tmdbFetch<TmdbMovieListResponse>('/discover/movie', {
    with_genres: genreIds.join(','),
    sort_by: 'popularity.desc',
    page: 1,
  });
}

async function fetchPopularMoviesFallback() {
  return tmdbFetch<TmdbMovieListResponse>('/movie/popular', {
    page: 1,
  });
}

async function fetchMovieDetailsBase(
  movieId: number,
  includeSupplemental: boolean,
  translateFallbackText = true
) {
  const appendToResponse = includeSupplemental
    ? 'credits,videos,recommendations'
    : 'credits,videos';
  const detail = await tmdbFetch<TmdbMovieDetail>(`/movie/${movieId}`, {
    append_to_response: appendToResponse,
  });
  let mergedDetail = detail;
  const needOverview = needsKoreanTextFallback(detail.overview);
  const needTagline = needsKoreanTextFallback(detail.tagline);
  const hasKoreanTrailer = (detail.videos?.results ?? []).some(
    (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
  );
  const needTrailerFallback = !hasKoreanTrailer;

  if (needOverview || needTagline || needTrailerFallback) {
    try {
      const fallbackEn = await tmdbFetch<TmdbMovieDetail>(
        `/movie/${movieId}`,
        { append_to_response: appendToResponse },
        { language: 'en-US' }
      );

      const mergedVideos = needTrailerFallback
        ? [...(detail.videos?.results ?? []), ...(fallbackEn.videos?.results ?? [])].filter(
            (video, index, array) =>
              array.findIndex((item) => item.key === video.key && item.site === video.site) === index
          )
        : detail.videos?.results ?? [];
      const overviewSource = hasOverview(fallbackEn.overview)
        ? fallbackEn.overview
        : detail.overview;
      const taglineSource = hasOverview(fallbackEn.tagline)
        ? fallbackEn.tagline
        : detail.tagline;
      const [translatedOverview, translatedTagline] = await Promise.all([
        needOverview && hasOverview(overviewSource) && translateFallbackText
          ? translateTextToKorean(
              overviewSource,
              makeTranslationCacheKey('movie', movieId, 'overview', overviewSource)
            )
          : overviewSource,
        needTagline && hasOverview(taglineSource) && translateFallbackText
          ? translateTextToKorean(
              taglineSource,
              makeTranslationCacheKey('movie', movieId, 'tagline', taglineSource)
            )
          : taglineSource,
      ]);

      mergedDetail = {
        ...detail,
        overview: needOverview ? translatedOverview : detail.overview,
        tagline: needTagline ? translatedTagline : detail.tagline,
        videos: {
          results: mergedVideos,
        },
      };
    } catch {
      // ignore fallback language errors and continue
    }
  }

  return mergedDetail;
}

export async function fetchMovieDetailsPrimary(movieId: number) {
  return fetchMovieDetailsBase(movieId, false, false);
}

export async function fetchMovieDetailsSupplemental(movieId: number, baseDetail?: TmdbMovieDetail) {
  const detail =
    baseDetail ??
    (await tmdbFetch<TmdbMovieDetail>(`/movie/${movieId}`, {
      append_to_response: 'recommendations',
    }));

  const [watchProviders, theatricalStatus, externalRatings] = await Promise.all([
    fetchMovieWatchProviders(movieId).catch(() => null),
    fetchMovieTheatricalStatus(movieId).catch(() => null),
    fetchExternalRatingsByImdbId(detail.imdb_id, {
      mediaType: 'movie',
      metacriticTitle: detail.original_title || detail.title,
    }).catch(() => null),
  ]);

  let recommendationCandidates = detail.recommendations?.results ?? [];

  if (!recommendationCandidates.length) {
    try {
      const similar = await fetchSimilarMovies(movieId);
      recommendationCandidates = similar.results ?? [];
    } catch {
      // ignore and continue next fallback
    }
  }

  if (!recommendationCandidates.length) {
    try {
      const discover = await fetchDiscoverMoviesByGenres(
        detail.genres?.map((genre) => genre.id).slice(0, 3) ?? []
      );
      recommendationCandidates = discover?.results ?? [];
    } catch {
      // ignore and continue next fallback
    }
  }

  if (!recommendationCandidates.length) {
    try {
      const popular = await fetchPopularMoviesFallback();
      recommendationCandidates = popular.results ?? [];
    } catch {
      // no more fallback
    }
  }

  const dedupedRecommendations = recommendationCandidates.filter(
    (movie, index, array) =>
      movie.id !== movieId &&
      array.findIndex((item) => item.id === movie.id) === index
  );

  return {
    watch_providers: watchProviders,
    theatrical_status: theatricalStatus,
    external_ratings: externalRatings,
    recommendations: {
      results: dedupedRecommendations,
    },
  };
}

export async function fetchMovieDetails(movieId: number) {
  const detail = await fetchMovieDetailsBase(movieId, true);
  const supplemental = await fetchMovieDetailsSupplemental(movieId, detail);

  return {
    ...detail,
    ...supplemental,
  };
}

export async function fetchMovieDetailsTextTranslation(movieId: number) {
  const detail = await fetchMovieDetailsBase(movieId, false, true);

  return {
    overview: detail.overview,
    tagline: detail.tagline,
  };
}
