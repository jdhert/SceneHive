export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count?: number;
  release_date: string;
  genre_ids?: number[];
  href?: string;
  display_meta?: string;
  recommendation_reason?: string;
  media_type?: 'movie' | 'tv' | 'person';
};

export type Genre = {
  id: number;
  name: string;
};

export type Tv = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  vote_count?: number;
  first_air_date: string;
  genre_ids?: number[];
};

export type Person = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
};

export type MovieListPayload = {
  results: Movie[];
};

export type TvListPayload = {
  results: Tv[];
};

export type PersonListPayload = {
  results: Person[];
};

export type GenrePayload = {
  genres: Genre[];
};

export type HomePayload = {
  trendingNow: MovieListPayload;
  trending: MovieListPayload;
  trendingTv: TvListPayload;
  trendingPeople: PersonListPayload;
  nowPlaying: MovieListPayload;
  upcoming: MovieListPayload;
  popularMovies: MovieListPayload;
  popularTv: TvListPayload;
  airingTodayTv: TvListPayload;
  genres: GenrePayload;
};
