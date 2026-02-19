import 'server-only';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const DEFAULT_LANGUAGE = 'ko-KR';
const DEFAULT_REGION = 'KR';
const DEFAULT_REVALIDATE_SECONDS = 600;

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

export type TmdbGenre = {
  id: number;
  name: string;
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
};

type TmdbMovieListResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

type TmdbGenreListResponse = {
  genres: TmdbGenre[];
};

type TmdbFetchOptions = {
  revalidate?: number;
  language?: string;
};

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
  return tmdbFetch<TmdbMovieListResponse>('/trending/movie/day');
}

export async function fetchNowPlayingMovies() {
  return tmdbFetch<TmdbMovieListResponse>('/movie/now_playing', {
    region: DEFAULT_REGION,
    page: 1,
  });
}

export async function fetchUpcomingMovies() {
  return tmdbFetch<TmdbMovieListResponse>('/movie/upcoming', {
    region: DEFAULT_REGION,
    page: 1,
  });
}

export async function fetchTopRatedMovies() {
  return tmdbFetch<TmdbMovieListResponse>('/movie/top_rated', {
    page: 1,
  });
}

export async function fetchGenres() {
  return tmdbFetch<TmdbGenreListResponse>('/genre/movie/list');
}

export async function fetchSearchMovies(query: string, page = 1) {
  return tmdbFetch<TmdbMovieListResponse>('/search/movie', {
    query,
    page,
    include_adult: 'false',
  });
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

async function fetchPopularMovies() {
  return tmdbFetch<TmdbMovieListResponse>('/movie/popular', {
    page: 1,
  });
}

export async function fetchMovieDetails(movieId: number) {
  const detail = await tmdbFetch<TmdbMovieDetail>(`/movie/${movieId}`, {
    append_to_response: 'credits,videos,recommendations',
  });

  let mergedDetail = detail;
  const needOverview = !detail.overview?.trim();
  const needTagline = !detail.tagline?.trim();
  const hasKoreanTrailer = (detail.videos?.results ?? []).some(
    (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
  );
  const needTrailerFallback = !hasKoreanTrailer;

  if (needOverview || needTagline || needTrailerFallback) {
    try {
      const fallbackEn = await tmdbFetch<TmdbMovieDetail>(
        `/movie/${movieId}`,
        { append_to_response: 'credits,videos,recommendations' },
        { language: 'en-US' }
      );

      const mergedVideos = needTrailerFallback
        ? [...(detail.videos?.results ?? []), ...(fallbackEn.videos?.results ?? [])].filter(
            (video, index, array) =>
              array.findIndex((item) => item.key === video.key && item.site === video.site) === index
          )
        : detail.videos?.results ?? [];

      mergedDetail = {
        ...detail,
        overview: needOverview ? fallbackEn.overview : detail.overview,
        tagline: needTagline ? fallbackEn.tagline : detail.tagline,
        videos: {
          results: mergedVideos,
        },
      };
    } catch {
      // ignore fallback language errors and continue
    }
  }

  let recommendationCandidates = mergedDetail.recommendations?.results ?? [];

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
        mergedDetail.genres?.map((genre) => genre.id).slice(0, 3) ?? []
      );
      recommendationCandidates = discover?.results ?? [];
    } catch {
      // ignore and continue next fallback
    }
  }

  if (!recommendationCandidates.length) {
    try {
      const popular = await fetchPopularMovies();
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
    ...mergedDetail,
    recommendations: {
      results: dedupedRecommendations,
    },
  };
}
