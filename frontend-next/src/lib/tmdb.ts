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

type TmdbMovieListResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

type TmdbPersonListResponse = {
  page: number;
  results: TmdbPerson[];
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
};

type TmdbFetchOptions = {
  revalidate?: number;
  language?: string;
};

function hasOverview(text: string | null | undefined) {
  return Boolean(text?.trim());
}

async function fillMissingMovieOverviews(
  path: string,
  params: Record<string, string | number | undefined>,
  source: TmdbMovieListResponse
) {
  const needsFallback = source.results.some((movie) => !hasOverview(movie.overview));
  if (!needsFallback) {
    return source;
  }

  try {
    const fallbackEn = await tmdbFetch<TmdbMovieListResponse>(path, params, { language: 'en-US' });
    const fallbackMap = new Map(
      (fallbackEn.results ?? []).map((movie) => [movie.id, movie.overview])
    );

    return {
      ...source,
      results: source.results.map((movie) => {
        if (hasOverview(movie.overview)) {
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
      !(item.overview ?? '').trim()
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
    const fallbackMap = new Map(
      (fallbackEn.results ?? []).map((item) => [`${item.media_type}:${item.id}`, item])
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
        if ((item.overview ?? '').trim()) {
          return item;
        }
        const fallback = fallbackMap.get(`${item.media_type}:${item.id}`);
        if (!fallback || !(fallback.overview ?? '').trim()) {
          return item;
        }
        return {
          ...item,
          overview: fallback.overview,
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

export async function fetchTvDetails(tvId: number) {
  const detail = await tmdbFetch<TmdbTvDetail>(`/tv/${tvId}`, {
    append_to_response: 'credits,videos,recommendations',
  });

  const needOverview = !detail.overview?.trim();
  const hasKoreanTrailer = (detail.videos?.results ?? []).some(
    (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
  );
  const needTrailerFallback = !hasKoreanTrailer;

  if (!needOverview && !needTrailerFallback) {
    return detail;
  }

  try {
    const fallbackEn = await tmdbFetch<TmdbTvDetail>(
      `/tv/${tvId}`,
      { append_to_response: 'credits,videos,recommendations' },
      { language: 'en-US' }
    );

    const mergedVideos = needTrailerFallback
      ? [...(detail.videos?.results ?? []), ...(fallbackEn.videos?.results ?? [])].filter(
          (video, index, array) =>
            array.findIndex((item) => item.key === video.key && item.site === video.site) === index
        )
      : detail.videos?.results ?? [];

    return {
      ...detail,
      overview: needOverview ? fallbackEn.overview : detail.overview,
      videos: {
        results: mergedVideos,
      },
    };
  } catch {
    return detail;
  }
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
