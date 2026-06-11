'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Info, Play, Search, Sparkles, Star } from 'lucide-react';
import { useUser } from '@/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import UserMenu from '@/components/layout/user-menu';
import { SceneHiveIcon } from '@/components/layout/scenehive-icon';
import { useFavorites } from '@/queries/favorites';
import { genrePreferenceService, recentlyViewedService } from '@/services/api';
import {
  getPreferredGenreIds,
  mergePreferredGenreIds,
  normalizePreferredGenreIds,
  PREFERRED_GENRE_LIMIT,
  savePreferredGenreIds,
} from '@/lib/genre-preferences';
import {
  fromRecentlyViewedResponse,
  getRecentlyViewed,
  MAX_RECENT_ITEMS,
  mergeRecentlyViewedItems,
  saveRecentlyViewed,
  toRecentlyViewedRequest,
  type RecentlyViewedItem,
} from '@/lib/recently-viewed';
import type { FavoriteItem, FavoriteTargetType, GenrePreferenceItem } from '@/types';
import type { Genre, HomePayload, Movie, Person, Tv } from '@/types/home';

const BG = '#04060C';
const AMBER = '#55A8FF';
const AMBER_DARK = '#2A6FD2';
const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';
const DRAG_MULTIPLIER = 1.35;
const MOMENTUM_MULTIPLIER = 18;
const MOMENTUM_DECAY = 0.9;
const MOMENTUM_STOP_THRESHOLD = 0.4;
const DRAG_START_THRESHOLD = 6;
const EDGE_AUTO_SCROLL_ZONE = 88;
const EDGE_AUTO_SCROLL_MAX_STEP = 14;
const MASK_START_THRESHOLD = 48;

type MovieTrailerPayload = {
  results?: Array<{
    key: string;
    site: string;
    type: string;
  }>;
};

type GenreRecommendationPayload = {
  results?: Movie[];
};

function movieImage(path: string | null, size: 'w500' | 'w780' | 'w1280' | 'original' = 'w500') {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function yearFromDate(date: string | null | undefined) {
  if (!date) return '미정';
  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? '미정' : String(year);
}

function shortText(text: string, maxLength = 120) {
  if (!text) return '줄거리 정보가 없습니다.';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function targetTypeLabel(type: FavoriteTargetType) {
  if (type === 'MOVIE') return '영화';
  if (type === 'TV') return 'TV';
  return '인물';
}

function favoriteHref(item: FavoriteItem) {
  if (item.targetType === 'MOVIE') return `/movies/${item.targetId}`;
  if (item.targetType === 'TV') return `/tv/${item.targetId}`;
  return `/people/${item.targetId}`;
}

function recentToMovie(item: RecentlyViewedItem): Movie {
  return {
    id: item.targetId,
    title: item.title,
    overview: item.subtitle || '최근 확인한 콘텐츠입니다.',
    poster_path: item.imagePath ?? null,
    backdrop_path: null,
    vote_average: 0,
    release_date: '',
    href: item.href,
    display_meta: `${targetTypeLabel(item.targetType)} · 최근 본 콘텐츠`,
  };
}

function favoriteToMovie(item: FavoriteItem): Movie {
  return {
    id: item.targetId,
    title: item.displayName,
    overview: '내가 찜한 콘텐츠입니다.',
    poster_path: item.imagePath ?? null,
    backdrop_path: null,
    vote_average: 0,
    release_date: '',
    href: favoriteHref(item),
    display_meta: `${targetTypeLabel(item.targetType)} · 즐겨찾기`,
  };
}

function tvToMovie(show: Tv, label = 'TV'): Movie {
  return {
    id: show.id,
    title: show.name,
    overview: show.overview,
    poster_path: show.poster_path,
    backdrop_path: show.backdrop_path ?? null,
    vote_average: show.vote_average,
    vote_count: show.vote_count,
    release_date: show.first_air_date,
    genre_ids: show.genre_ids,
    href: `/tv/${show.id}`,
    display_meta: `${label} · ${yearFromDate(show.first_air_date)} · 평점 ${show.vote_average.toFixed(1)}`,
    media_type: 'tv',
  };
}

function personToMovie(person: Person): Movie {
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

function getTopGenre(recentItems: RecentlyViewedItem[], genres: Genre[]) {
  const validGenreIds = new Set(genres.map((genre) => genre.id));
  const counts = new Map<number, number>();

  recentItems.forEach((item) => {
    item.genreIds?.forEach((genreId) => {
      if (!validGenreIds.has(genreId)) return;
      counts.set(genreId, (counts.get(genreId) ?? 0) + 1);
    });
  });

  const [topGenreId] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!topGenreId) return null;

  return genres.find((genre) => genre.id === topGenreId) ?? null;
}

function getMoviePreferenceGenreIds(preferences: GenrePreferenceItem[]) {
  return preferences
    .filter((preference) => preference.mediaType === 'MOVIE')
    .sort((a, b) => a.priority - b.priority)
    .map((preference) => preference.genreId);
}

function sameGenreIds(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  return left.every((genreId, index) => genreId === right[index]);
}

function toMoviePreferencePayload(genreIds: number[], genres: Genre[]) {
  const genreMap = new Map(genres.map((genre) => [genre.id, genre.name]));

  return {
    mediaType: 'MOVIE' as const,
    genres: genreIds.map((genreId) => ({
      genreId,
      genreName: genreMap.get(genreId) ?? null,
    })),
  };
}

type HomeClientProps = {
  initialData: HomePayload | null;
  initialError?: string | null;
};

type MovieTab = {
  id: string;
  title: string;
  subtitle: string;
  movies: Movie[];
  numbered?: boolean;
};

export default function HomeClient({ initialData, initialError = null }: HomeClientProps) {
  const router = useRouter();
  const { user } = useUser();
  const [trendingNow, setTrendingNow] = useState<Movie[]>(() => initialData?.trendingNow.results ?? []);
  const [trending, setTrending] = useState<Movie[]>(() => initialData?.trending.results ?? []);
  const [trendingTv, setTrendingTv] = useState<Tv[]>(() => initialData?.trendingTv.results ?? []);
  const [trendingPeople, setTrendingPeople] = useState<Person[]>(() => initialData?.trendingPeople.results ?? []);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>(() => initialData?.nowPlaying.results ?? []);
  const [upcoming, setUpcoming] = useState<Movie[]>(() => initialData?.upcoming.results ?? []);
  const [popularMovies, setPopularMovies] = useState<Movie[]>(() => initialData?.popularMovies.results ?? []);
  const [popularTv, setPopularTv] = useState<Tv[]>(() => initialData?.popularTv.results ?? []);
  const [airingTodayTv, setAiringTodayTv] = useState<Tv[]>(() => initialData?.airingTodayTv.results ?? []);
  const [genres, setGenres] = useState<Genre[]>(() => initialData?.genres.genres ?? []);
  const [isMovieLoading, setIsMovieLoading] = useState(!initialData && !initialError);
  const [movieError, setMovieError] = useState<string | null>(initialError);
  const [heroTrailerUrl, setHeroTrailerUrl] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [preferredGenreIds, setPreferredGenreIds] = useState<number[]>([]);
  const [isGenreOnboardingOpen, setIsGenreOnboardingOpen] = useState(false);
  const [syncedRecentlyViewedUserId, setSyncedRecentlyViewedUserId] = useState<number | null>(null);
  const [syncedGenrePreferenceUserId, setSyncedGenrePreferenceUserId] = useState<number | null>(null);
  const [tasteRecommendations, setTasteRecommendations] = useState<Movie[]>([]);
  const { data: favorites = [] } = useFavorites(undefined, Boolean(user));
  const userId = user?.id ?? null;
  const handleBrandReload = () => {
    window.location.reload();
  };

  const heroMovie = useMemo(
    () => trendingNow.find((item) => item.media_type !== 'person') ?? trending[0] ?? null,
    [trendingNow, trending]
  );
  const heroMediaLabel = heroMovie?.media_type === 'tv' ? 'TV Series' : 'Movie';
  const heroGenreNames = useMemo(() => {
    if (!heroMovie?.genre_ids?.length || !genres.length) return [] as string[];
    const genreMap = new Map(genres.map((genre) => [genre.id, genre.name]));
    return heroMovie.genre_ids
      .map((genreId) => genreMap.get(genreId))
      .filter((name): name is string => Boolean(name))
      .slice(0, 3);
  }, [heroMovie, genres]);
  const heroOverview = useMemo(
    () => shortText(heroMovie?.overview ?? '줄거리 정보가 아직 등록되지 않았습니다.', 170),
    [heroMovie?.overview]
  );
  const trendingNowWithoutHero = useMemo(() => {
    if (!heroMovie) return trendingNow;
    return trendingNow.filter((item) => item.href !== heroMovie.href).slice(0, 12);
  }, [heroMovie, trendingNow]);
  const recentMovies = useMemo(() => recentlyViewed.map(recentToMovie), [recentlyViewed]);
  const favoriteMovies = useMemo(() => (user ? favorites.slice(0, 12).map(favoriteToMovie) : []), [favorites, user]);
  const topRecentGenre = useMemo(() => getTopGenre(recentlyViewed, genres), [recentlyViewed, genres]);
  const preferredGenres = useMemo(() => {
    const genreMap = new Map(genres.map((genre) => [genre.id, genre]));
    return preferredGenreIds
      .map((genreId) => genreMap.get(genreId))
      .filter((genre): genre is Genre => Boolean(genre));
  }, [genres, preferredGenreIds]);
  const activePreferredGenres = useMemo(() => (user ? preferredGenres : []), [preferredGenres, user]);
  const recommendationGenres = useMemo(() => {
    if (activePreferredGenres.length) return activePreferredGenres;
    return topRecentGenre ? [topRecentGenre] : [];
  }, [activePreferredGenres, topRecentGenre]);
  const recommendationGenreIds = useMemo(
    () => recommendationGenres.map((genre) => genre.id),
    [recommendationGenres]
  );
  const recommendationSubtitle = useMemo(() => {
    if (!recommendationGenres.length) return '';
    if (activePreferredGenres.length) {
      return `${recommendationGenres.map((genre) => genre.name).join(', ')} 취향에서 고른 영화`;
    }

    return `최근 본 ${recommendationGenres[0].name} 장르와 어울리는 영화`;
  }, [activePreferredGenres.length, recommendationGenres]);
  const isGenrePreferenceSyncPending = userId !== null && syncedGenrePreferenceUserId !== userId;
  const shouldShowGenreOnboarding = Boolean(user) && !isGenrePreferenceSyncPending && genres.length > 0 && isGenreOnboardingOpen;
  const shouldShowGenreSummary = Boolean(user) && preferredGenres.length > 0 && !isGenreOnboardingOpen;
  const trendingTvAsMovies = useMemo(
    () => trendingTv.map((show) => tvToMovie(show, '트렌딩 TV')),
    [trendingTv]
  );
  const popularTvAsMovies = useMemo(
    () => popularTv.map((show) => tvToMovie(show, '인기 TV')),
    [popularTv]
  );
  const airingTodayTvAsMovies = useMemo(
    () => airingTodayTv.map((show) => tvToMovie(show, '오늘 방영')),
    [airingTodayTv]
  );
  const trendingPeopleAsMovies = useMemo(
    () => trendingPeople.map(personToMovie),
    [trendingPeople]
  );
  const forYouTabs = useMemo<MovieTab[]>(() => {
    const tabs: MovieTab[] = [];

    if (tasteRecommendations.length) {
      tabs.push({
        id: 'recommendations',
        title: activePreferredGenres.length ? '내 관심 장르 추천' : '최근 취향 기반 추천',
        subtitle: recommendationSubtitle,
        movies: tasteRecommendations,
      });
    }
    if (recentMovies.length) {
      tabs.push({
        id: 'recently-viewed',
        title: '최근 본 콘텐츠',
        subtitle: '방금 둘러본 영화, TV, 인물',
        movies: recentMovies,
      });
    }
    if (favoriteMovies.length) {
      tabs.push({
        id: 'favorites',
        title: '내가 찜한 콘텐츠',
        subtitle: '다시 보고 싶은 작품과 인물',
        movies: favoriteMovies,
      });
    }

    return tabs;
  }, [activePreferredGenres.length, favoriteMovies, recentMovies, recommendationSubtitle, tasteRecommendations]);
  const movieTabs = useMemo<MovieTab[]>(
    () => [
      {
        id: 'now-playing',
        title: '현재 상영작',
        subtitle: '극장에서 바로 만날 수 있는 영화',
        movies: nowPlaying,
      },
      {
        id: 'upcoming',
        title: '개봉 예정작',
        subtitle: '곧 공개될 기대작',
        movies: upcoming,
      },
      {
        id: 'popular',
        title: '인기 영화',
        subtitle: '요즘 많이 찾는 영화',
        movies: popularMovies,
      },
    ].filter((tab) => tab.movies.length),
    [nowPlaying, popularMovies, upcoming]
  );
  const tvTabs = useMemo<MovieTab[]>(
    () => [
      {
        id: 'trending-tv',
        title: '트렌딩 TV',
        subtitle: '지금 화제인 TV 시리즈',
        movies: trendingTvAsMovies,
      },
      {
        id: 'popular-tv',
        title: '인기 TV',
        subtitle: '많이 찾는 시리즈',
        movies: popularTvAsMovies,
      },
      {
        id: 'airing-today',
        title: '오늘 방영',
        subtitle: '오늘 새 에피소드가 방영되는 시리즈',
        movies: airingTodayTvAsMovies,
      },
    ].filter((tab) => tab.movies.length),
    [airingTodayTvAsMovies, popularTvAsMovies, trendingTvAsMovies]
  );

  const handleGenrePreferencesSave = (genreIds: number[]) => {
    const normalizedGenreIds = normalizePreferredGenreIds(genreIds);
    savePreferredGenreIds(normalizedGenreIds);
    setPreferredGenreIds(normalizedGenreIds);
    setIsGenreOnboardingOpen(false);

    if (user) {
      genrePreferenceService
        .replace(toMoviePreferencePayload(normalizedGenreIds, genres))
        .catch((error) => console.error('Failed to save genre preferences:', error));
    }
  };

  useEffect(() => {
    const syncRecentlyViewed = () => {
      setRecentlyViewed(getRecentlyViewed(12));
    };

    syncRecentlyViewed();
    window.addEventListener('focus', syncRecentlyViewed);
    window.addEventListener('storage', syncRecentlyViewed);

    return () => {
      window.removeEventListener('focus', syncRecentlyViewed);
      window.removeEventListener('storage', syncRecentlyViewed);
    };
  }, []);

  useEffect(() => {
    if (userId === null) {
      setSyncedRecentlyViewedUserId(null);
      return;
    }
    if (syncedRecentlyViewedUserId === userId) {
      return;
    }

    let isMounted = true;
    const currentUserId = userId;

    async function syncServerRecentlyViewed() {
      const localItems = getRecentlyViewed(MAX_RECENT_ITEMS);

      try {
        const response = await recentlyViewedService.sync({
          items: localItems.map(toRecentlyViewedRequest),
        });
        if (!isMounted) return;

        const serverItems = response.data.map(fromRecentlyViewedResponse);
        const mergedItems = mergeRecentlyViewedItems(serverItems, localItems);
        saveRecentlyViewed(mergedItems);
        setRecentlyViewed(mergedItems.slice(0, 12));
        setSyncedRecentlyViewedUserId(currentUserId);
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to sync recently viewed contents:', error);
        setRecentlyViewed(localItems.slice(0, 12));
        setSyncedRecentlyViewedUserId(currentUserId);
      }
    }

    syncServerRecentlyViewed();

    return () => {
      isMounted = false;
    };
  }, [syncedRecentlyViewedUserId, userId]);

  useEffect(() => {
    const syncPreferredGenres = () => {
      const storedGenreIds = getPreferredGenreIds();
      setPreferredGenreIds(storedGenreIds);
      setIsGenreOnboardingOpen(storedGenreIds.length === 0);
    };

    syncPreferredGenres();
    window.addEventListener('focus', syncPreferredGenres);
    window.addEventListener('storage', syncPreferredGenres);

    return () => {
      window.removeEventListener('focus', syncPreferredGenres);
      window.removeEventListener('storage', syncPreferredGenres);
    };
  }, []);

  useEffect(() => {
    if (userId === null) {
      setSyncedGenrePreferenceUserId(null);
      return;
    }
    if (!genres.length || syncedGenrePreferenceUserId === userId) {
      return;
    }

    let isMounted = true;
    const currentUserId = userId;

    async function syncServerGenrePreferences() {
      const localGenreIds = getPreferredGenreIds();

      try {
        const response = await genrePreferenceService.getAll();
        if (!isMounted) return;

        const serverGenreIds = normalizePreferredGenreIds(getMoviePreferenceGenreIds(response.data.preferences ?? []));
        const mergedGenreIds = mergePreferredGenreIds(serverGenreIds, localGenreIds);

        savePreferredGenreIds(mergedGenreIds);
        setPreferredGenreIds(mergedGenreIds);
        setIsGenreOnboardingOpen(mergedGenreIds.length === 0);
        setSyncedGenrePreferenceUserId(currentUserId);

        if (!sameGenreIds(serverGenreIds, mergedGenreIds)) {
          await genrePreferenceService.replace(toMoviePreferencePayload(mergedGenreIds, genres));
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to sync genre preferences:', error);
        setPreferredGenreIds(localGenreIds);
        setIsGenreOnboardingOpen(localGenreIds.length === 0);
        setSyncedGenrePreferenceUserId(currentUserId);
      }
    }

    syncServerGenrePreferences();

    return () => {
      isMounted = false;
    };
  }, [genres, syncedGenrePreferenceUserId, userId]);

  useEffect(() => {
    if (initialData) {
      return;
    }

    let isMounted = true;

    async function loadMovieSections() {
      try {
        setIsMovieLoading(true);
        setMovieError(null);

        const response = await fetch('/api/home');
        if (!response.ok) {
          throw new Error('영화 데이터를 불러오지 못했습니다.');
        }

        const data = (await response.json()) as HomePayload;

        if (!isMounted) return;

        setTrendingNow(data.trendingNow.results ?? []);
        setTrending(data.trending.results ?? []);
        setTrendingTv(data.trendingTv.results ?? []);
        setTrendingPeople(data.trendingPeople.results ?? []);
        setNowPlaying(data.nowPlaying.results ?? []);
        setUpcoming(data.upcoming.results ?? []);
        setPopularMovies(data.popularMovies.results ?? []);
        setPopularTv(data.popularTv.results ?? []);
        setAiringTodayTv(data.airingTodayTv.results ?? []);
        setGenres(data.genres.genres ?? []);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        setMovieError(message);
      } finally {
        if (isMounted) {
          setIsMovieLoading(false);
        }
      }
    }

    loadMovieSections();

    return () => {
      isMounted = false;
    };
  }, [initialData]);

  useEffect(() => {
    let isMounted = true;

    async function loadHeroTrailer() {
      if (!heroMovie?.id) {
        if (isMounted) setHeroTrailerUrl(null);
        return;
      }

      const fallbackTrailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${heroMovie.title} trailer`)}`;

      if (heroMovie.media_type && heroMovie.media_type !== 'movie') {
        if (isMounted) setHeroTrailerUrl(fallbackTrailerUrl);
        return;
      }

      try {
        const res = await fetch(`/api/movies/${heroMovie.id}/videos`);
        if (!res.ok) throw new Error('failed');
        const data = (await res.json()) as MovieTrailerPayload;
        const trailer = data.results?.find(
          (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
        );
        if (!isMounted) return;
        if (trailer?.key) {
          setHeroTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
        } else {
          setHeroTrailerUrl(fallbackTrailerUrl);
        }
      } catch {
        if (!isMounted) return;
        setHeroTrailerUrl(fallbackTrailerUrl);
      }
    }

    loadHeroTrailer();

    return () => {
      isMounted = false;
    };
  }, [heroMovie?.id, heroMovie?.media_type, heroMovie?.title]);

  useEffect(() => {
    if (!recommendationGenreIds.length) {
      setTasteRecommendations([]);
      return;
    }

    const genreIds = recommendationGenreIds;
    setTasteRecommendations([]);
    const recentMovieIds = new Set(
      recentlyViewed
        .filter((item) => item.targetType === 'MOVIE')
        .map((item) => item.targetId)
    );
    let isMounted = true;

    async function loadTasteRecommendations() {
      try {
        const genrePayloads = await Promise.all(
          genreIds.map(async (genreId) => {
            const response = await fetch(`/api/movies/genre/${genreId}?page=1`);
            if (!response.ok) throw new Error('failed');
            return (await response.json()) as GenreRecommendationPayload;
          })
        );

        if (!isMounted) return;

        const seenMovieIds = new Set<number>();
        const recommendations = genrePayloads
          .flatMap((payload) => payload.results ?? [])
          .filter((movie) => {
            if (recentMovieIds.has(movie.id) || seenMovieIds.has(movie.id)) return false;
            seenMovieIds.add(movie.id);
            return true;
          })
          .slice(0, 12);
        setTasteRecommendations(recommendations);
      } catch {
        if (isMounted) {
          setTasteRecommendations([]);
        }
      }
    }

    loadTasteRecommendations();

    return () => {
      isMounted = false;
    };
  }, [recentlyViewed, recommendationGenreIds]);

  return (
    <div className="min-h-screen relative" style={{ background: BG }}>
      <header className="sticky top-0 z-40" style={{ background: 'linear-gradient(180deg, rgba(5,8,15,0.78) 0%, rgba(5,8,15,0.40) 60%, rgba(5,8,15,0) 100%)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <button type="button" onClick={handleBrandReload} className="flex items-center gap-3">
            <SceneHiveIcon className="w-6 h-6 shrink-0" />
            <h1 className="text-xl font-black tracking-tight text-white">SceneHive</h1>
          </button>
          <nav className="hidden lg:flex items-center gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.64)' }}>
            <a href="#for-you" className="hover:text-white transition-colors">For You</a>
            <a href="#trending" className="hover:text-white transition-colors">Trending</a>
            <a href="#movies" className="hover:text-white transition-colors">Movies</a>
            <a href="#tv-series" className="hover:text-white transition-colors">TV Series</a>
            <a href="#people" className="hover:text-white transition-colors">People</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline"
              className="font-medium"
              style={{ borderColor: 'rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.90)' }}>
              <Link href="/search" className="inline-flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">통합 검색</span>
              </Link>
            </Button>
            {user ? (
              <>
                <Button asChild className="hidden sm:inline-flex text-white font-medium"
                  style={{ background: 'rgba(85,168,255,0.20)', border: '1px solid rgba(85,168,255,0.30)' }}>
                  <Link href="/workspaces">영화 클럽</Link>
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Button asChild variant="outline"
                  className="font-medium"
                  style={{ borderColor: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.92)' }}>
                  <Link href="/login">로그인</Link>
                </Button>
                <Button asChild
                  className="hidden sm:inline-flex font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}>
                  <Link href="/register">회원가입</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section
        className="relative z-10 w-full -mt-20 pt-32 md:pt-36 pb-20 md:pb-24 min-h-[calc(100vh-64px)] md:min-h-[90vh] flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(4,6,12,0.30) 0%, rgba(4,6,12,0.76) 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          {heroMovie?.backdrop_path ? (
            <div className="absolute inset-0">
              <Image
                src={movieImage(heroMovie.backdrop_path, 'w1280')}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
                style={{
                  objectPosition: 'center center',
                  filter: 'saturate(1.04) contrast(1.06)',
                }}
              />
            </div>
          ) : null}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(126% 108% at 26% 46%, rgba(6,8,16,0.06) 0%, rgba(6,8,16,0.42) 52%, rgba(6,8,16,0.80) 100%), linear-gradient(90deg, rgba(6,8,16,0.90) 0%, rgba(6,8,16,0.18) 48%, rgba(6,8,16,0.62) 100%), linear-gradient(180deg, rgba(6,8,16,0.02) 0%, rgba(6,8,16,0.20) 68%, rgba(6,8,16,0.84) 100%)',
            }}
          />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="max-w-[700px]">
            {heroMovie ? (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: 'rgba(85,168,255,0.28)', color: '#CFE7FF' }}
                  >
                    Trending Now
                  </span>
                  {(heroGenreNames.length ? heroGenreNames : [heroMediaLabel]).map((genre) => (
                    <span
                      key={genre}
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                      style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.82)' }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.06] tracking-tight">
                  {heroMovie.title}
                </h2>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-xl md:text-2xl font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                  <span
                    className="inline-flex items-center gap-2"
                  >
                    <Star className="w-5 h-5" style={{ fill: '#F7B267', color: '#F7B267' }} />
                    {heroMovie.vote_average.toFixed(1)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.72)' }}>{yearFromDate(heroMovie.release_date)}</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>•</span>
                  {typeof heroMovie.vote_count === 'number' ? (
                    <span style={{ color: 'rgba(255,255,255,0.66)' }}>{heroMovie.vote_count.toLocaleString()} votes</span>
                  ) : null}
                </div>
                <p
                  className="mt-6 max-w-[620px] text-base md:text-lg leading-relaxed line-clamp-4"
                  style={{ color: 'rgba(255,255,255,0.76)' }}
                >
                  {heroOverview}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="text-white font-semibold px-7 py-6 text-base rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
                >
                  <a
                    href={
                      heroTrailerUrl ??
                      `https://www.youtube.com/results?search_query=${encodeURIComponent(`${heroMovie.title} trailer`)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Watch Trailer
                  </a>
                </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="font-semibold px-7 py-6 text-base rounded-2xl"
                    style={{ borderColor: 'rgba(255,255,255,0.24)', background: 'rgba(255,255,255,0.08)', color: 'white' }}
                  >
                    <Link href={heroMovie.href ?? `/movies/${heroMovie.id}`} className="inline-flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      More Info
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.06] tracking-tight">
                  SceneHive Feed
                </h2>
                <p className="mt-7 text-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  영화, TV 시리즈, 인물을 홈에서 바로 탐색하세요.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-4 pb-8 pt-8">
        {isMovieLoading && (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
            영화 정보를 불러오는 중입니다...
          </div>
        )}
        {movieError && (
          <Card className="border-0 mb-8" style={{ background: 'rgba(127,29,29,0.25)' }}>
            <CardContent className="py-4 text-sm" style={{ color: '#FCA5A5' }}>
              {movieError}
            </CardContent>
          </Card>
        )}

        {shouldShowGenreOnboarding && (
          <GenreOnboardingCard
            genres={genres}
            initialSelectedIds={preferredGenreIds}
            onSave={handleGenrePreferencesSave}
          />
        )}
        {shouldShowGenreSummary && (
          <GenrePreferenceSummary
            genres={preferredGenres}
            onEdit={() => setIsGenreOnboardingOpen(true)}
          />
        )}

        <TabbedMovieSection
          id="for-you"
          title="For You"
          subtitle="추천, 최근 본 콘텐츠, 찜한 콘텐츠를 한 곳에서 확인하세요"
          tabs={forYouTabs}
        />
        <MovieCarouselSection
          id="trending"
          title="Trending Now"
          subtitle="영화, TV, 인물을 한 번에 훑어보는 지금의 화제작"
          movies={trendingNowWithoutHero}
          numbered
        />
        <TabbedMovieSection
          id="movies"
          title="Movies"
          subtitle="상영작, 개봉 예정작, 인기 영화를 탭으로 빠르게 전환하세요"
          tabs={movieTabs}
        />
        <TabbedMovieSection
          id="tv-series"
          title="TV Series"
          subtitle="트렌딩, 인기, 오늘 방영되는 시리즈를 한 곳에 모았습니다"
          tabs={tvTabs}
        />
        <MovieCarouselSection
          id="people"
          title="People"
          subtitle="지금 주목받는 배우와 제작진"
          movies={trendingPeopleAsMovies}
        />

        <div id="genres" className="mt-10">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Genres
          </h3>
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 12).map((genre) => (
              <Link
                key={genre.id}
                href={`/genres/${genre.id}?name=${encodeURIComponent(genre.name)}`}
                className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                style={{
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'rgba(255,255,255,0.88)',
                }}
              >
                {genre.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {!user && (
        <section className="relative z-10 max-w-3xl mx-auto px-4 py-16">
          <Card className="border-0"
            style={{ background: 'rgba(85,168,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(20px)' }}>
            <CardContent className="py-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-3">영화 클럽을 만들어 보세요</h3>
              <p className="mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
                무료로 클럽을 개설하고 친구들을 초대하세요
              </p>
              <Button onClick={() => router.push('/register')} size="lg"
                className="text-white font-bold px-10 py-5"
                style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}>
                지금 시작하기
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <p>SceneHive — 영화 팬을 위한 실시간 토론 공간</p>
          <p className="mt-1">Powered by TMDB API. TMDB의 인증 또는 보증을 받지 않았습니다.</p>
        </div>
      </footer>
    </div>
  );
}

function GenreOnboardingCard({
  genres,
  initialSelectedIds,
  onSave,
}: {
  genres: Genre[];
  initialSelectedIds: number[];
  onSave: (genreIds: number[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    initialSelectedIds.slice(0, PREFERRED_GENRE_LIMIT)
  );
  const selectedCount = selectedIds.length;

  useEffect(() => {
    setSelectedIds(initialSelectedIds.slice(0, PREFERRED_GENRE_LIMIT));
  }, [initialSelectedIds]);

  const toggleGenre = (genreId: number) => {
    setSelectedIds((current) => {
      if (current.includes(genreId)) {
        return current.filter((selectedId) => selectedId !== genreId);
      }

      if (current.length >= PREFERRED_GENRE_LIMIT) {
        return current;
      }

      return [...current, genreId];
    });
  };

  return (
    <Card
      className="border-0 mb-12 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(85,168,255,0.14), rgba(255,255,255,0.04))',
        border: '1px solid rgba(85,168,255,0.20)',
      }}
    >
      <CardContent className="py-6 px-5 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#CFE7FF' }}>
              <Sparkles className="w-4 h-4" />
              관심 장르 온보딩
            </p>
            <h3 className="text-xl font-black text-white">좋아하는 장르를 고르면 홈 추천이 바로 바뀝니다</h3>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.58)' }}>
              처음 로그인한 사용자도 취향 데이터 없이 시작하지 않도록 최대 {PREFERRED_GENRE_LIMIT}개 장르를 먼저 반영합니다.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.58)' }}>
              {selectedCount}/{PREFERRED_GENRE_LIMIT}
            </span>
            <Button
              type="button"
              disabled={!selectedCount}
              onClick={() => onSave(selectedIds)}
              className="text-white font-semibold"
              style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
            >
              관심 장르 저장
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {genres.map((genre) => {
            const isSelected = selectedIds.includes(genre.id);
            const isLimitReached = selectedCount >= PREFERRED_GENRE_LIMIT && !isSelected;

            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: isSelected ? 'rgba(85,168,255,0.26)' : 'rgba(255,255,255,0.08)',
                  border: isSelected ? '1px solid rgba(85,168,255,0.52)' : '1px solid rgba(255,255,255,0.14)',
                  color: isSelected ? '#E6F3FF' : 'rgba(255,255,255,0.78)',
                  opacity: isLimitReached ? 0.45 : 1,
                }}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                {genre.name}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function GenrePreferenceSummary({
  genres,
  onEdit,
}: {
  genres: Genre[];
  onEdit: () => void;
}) {
  return (
    <div
      className="mb-8 flex flex-col gap-4 rounded-2xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      style={{
        background: 'rgba(255,255,255,0.055)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: '#CFE7FF' }}>
          선택한 관심 장르
        </p>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <span
              key={genre.id}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold"
              style={{ background: 'rgba(85,168,255,0.18)', color: 'rgba(255,255,255,0.88)' }}
            >
              {genre.name}
            </span>
          ))}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onEdit}
        className="font-semibold shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.06)', color: 'white' }}
      >
        관심 장르 수정
      </Button>
    </div>
  );
}

function TabbedMovieSection({
  id,
  title,
  subtitle,
  tabs,
}: {
  id: string;
  title: string;
  subtitle: string;
  tabs: MovieTab[];
}) {
  const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id ?? '');
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  useEffect(() => {
    if (!tabs.length) {
      setActiveTabId('');
      return;
    }

    if (!tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [activeTabId, tabs]);

  if (!tabs.length || !activeTab) return null;

  return (
    <section id={id} className="mb-12">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tight" style={{ color: 'rgba(255,255,255,0.94)' }}>
            {title}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.58)' }}>
            {subtitle}
          </p>
        </div>
        <div
          className="flex w-full gap-2 overflow-x-auto pb-1 hide-scrollbar md:w-auto"
          aria-label={`${title} tabs`}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(85,168,255,0.24)' : 'rgba(255,255,255,0.07)',
                  border: isActive ? '1px solid rgba(85,168,255,0.48)' : '1px solid rgba(255,255,255,0.12)',
                  color: isActive ? '#E6F3FF' : 'rgba(255,255,255,0.68)',
                }}
              >
                {tab.title}
              </button>
            );
          })}
        </div>
      </div>
      <MovieCarouselSection
        key={activeTab.id}
        id={`${id}-${activeTab.id}`}
        title={activeTab.title}
        subtitle={activeTab.subtitle}
        movies={activeTab.movies}
        numbered={activeTab.numbered}
        compact
      />
    </section>
  );
}

function MovieCarouselSection({
  id,
  title,
  subtitle,
  movies,
  numbered = false,
  compact = false,
}: {
  id: string;
  title: string;
  subtitle: string;
  movies: Movie[];
  numbered?: boolean;
  compact?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const isPointerDownRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const pointerClientXRef = useRef(0);
  const velocityRef = useRef(0);
  const momentumFrameRef = useRef<number | null>(null);
  const edgeAutoFrameRef = useRef<number | null>(null);

  if (!movies.length) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -640 : 640,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    setIsAtStart(scrollRef.current.scrollLeft <= MASK_START_THRESHOLD);
  };

  const stopMomentum = () => {
    if (momentumFrameRef.current !== null) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }
  };

  const stopEdgeAutoScroll = () => {
    if (edgeAutoFrameRef.current !== null) {
      cancelAnimationFrame(edgeAutoFrameRef.current);
      edgeAutoFrameRef.current = null;
    }
  };

  const startEdgeAutoScroll = () => {
    if (edgeAutoFrameRef.current !== null) return;

    const step = () => {
      if (!scrollRef.current || !isPointerDownRef.current || !hasDraggedRef.current) {
        edgeAutoFrameRef.current = null;
        return;
      }

      const rect = scrollRef.current.getBoundingClientRect();
      const leftGap = pointerClientXRef.current - rect.left;
      const rightGap = rect.right - pointerClientXRef.current;
      let autoStep = 0;

      if (leftGap < EDGE_AUTO_SCROLL_ZONE) {
        const ratio = Math.max(0, (EDGE_AUTO_SCROLL_ZONE - leftGap) / EDGE_AUTO_SCROLL_ZONE);
        autoStep = -EDGE_AUTO_SCROLL_MAX_STEP * ratio;
      } else if (rightGap < EDGE_AUTO_SCROLL_ZONE) {
        const ratio = Math.max(0, (EDGE_AUTO_SCROLL_ZONE - rightGap) / EDGE_AUTO_SCROLL_ZONE);
        autoStep = EDGE_AUTO_SCROLL_MAX_STEP * ratio;
      }

      if (autoStep !== 0) {
        scrollRef.current.scrollLeft += autoStep;
      }

      edgeAutoFrameRef.current = requestAnimationFrame(step);
    };

    edgeAutoFrameRef.current = requestAnimationFrame(step);
  };

  const runMomentum = () => {
    if (!scrollRef.current) return;
    let velocity = velocityRef.current * MOMENTUM_MULTIPLIER;

    const step = () => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollLeft += velocity;
      velocity *= MOMENTUM_DECAY;

      if (Math.abs(velocity) > MOMENTUM_STOP_THRESHOLD) {
        momentumFrameRef.current = requestAnimationFrame(step);
      } else {
        momentumFrameRef.current = null;
      }
    };

    stopMomentum();
    momentumFrameRef.current = requestAnimationFrame(step);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.pointerType !== 'mouse' && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    stopMomentum();
    stopEdgeAutoScroll();
    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    activePointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    lastXRef.current = event.clientX;
    pointerClientXRef.current = event.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || !scrollRef.current || activePointerIdRef.current !== event.pointerId) return;
    pointerClientXRef.current = event.clientX;
    const deltaFromStart = event.clientX - startXRef.current;
    if (Math.abs(deltaFromStart) > DRAG_START_THRESHOLD && !hasDraggedRef.current) {
      hasDraggedRef.current = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      startEdgeAutoScroll();
    }
    if (!hasDraggedRef.current) {
      return;
    }
    event.preventDefault();
    const deltaX = event.clientX - lastXRef.current;
    scrollRef.current.scrollLeft -= deltaX * DRAG_MULTIPLIER;

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      const dx = event.clientX - lastXRef.current;
      const instantVelocity = -(dx / dt);
      velocityRef.current = velocityRef.current * 0.75 + instantVelocity * 0.25;
    }
    lastXRef.current = event.clientX;
    lastTimeRef.current = now;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    isPointerDownRef.current = false;
    activePointerIdRef.current = null;
    stopEdgeAutoScroll();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
    if (hasDraggedRef.current && Math.abs(velocityRef.current) > 0.01) {
      runMomentum();
    }
    hasDraggedRef.current = false;
  };

  return (
    <section id={id} className={compact ? 'mb-0' : 'mb-12'}>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-2xl font-black tracking-tight" style={{ color: 'rgba(255,255,255,0.94)' }}>
            {title}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.58)' }}>
            {subtitle}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            aria-label={`${title} left`}
            onClick={() => scroll('left')}
            className="h-9 w-9 rounded-full border-0 flex items-center justify-center"
            style={{ color: 'rgba(255,255,255,0.88)', background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(6px)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label={`${title} right`}
            onClick={() => scroll('right')}
            className="h-9 w-9 rounded-full border-0 flex items-center justify-center"
            style={{ color: 'rgba(255,255,255,0.88)', background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(6px)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onScroll={handleScroll}
        onDragStart={(event) => event.preventDefault()}
        className={`flex gap-4 overflow-x-auto overflow-y-hidden pb-2 hide-scrollbar cursor-grab select-none touch-auto ${
          isAtStart ? 'scroll-mask-start-soft' : 'scroll-mask'
        }`}
      >
        {movies.map((movie, index) => (
          <MoviePosterCard
            key={movie.href ?? movie.id}
            movie={movie}
            index={index}
            numbered={numbered}
          />
        ))}
      </div>
    </section>
  );
}

function MoviePosterCard({
  movie,
  index,
  numbered,
}: {
  movie: Movie;
  index: number;
  numbered: boolean;
}) {
  return (
    <Link
      href={movie.href ?? `/movies/${movie.id}`}
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      className="relative w-40 md:w-48 shrink-0 group block transition-transform duration-300 hover:-translate-y-1"
    >
      {numbered && (
        <span
          className="absolute -left-3 -bottom-1 text-7xl font-black leading-none z-10 select-none"
          style={{ color: 'rgba(255,255,255,0.13)' }}
        >
          {index + 1}
        </span>
      )}
      <div
        className="relative h-56 md:h-72 rounded-xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 12px 34px rgba(0,0,0,0.42)' }}
      >
        {movie.poster_path ? (
          <Image
            src={movieImage(movie.poster_path)}
            alt={movie.title}
            fill
            sizes="(min-width: 768px) 12rem, 10rem"
            draggable={false}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            NO POSTER
          </div>
        )}
      </div>
      <div className="mt-2">
        <h4 className="text-sm font-semibold leading-tight text-white">{movie.title}</h4>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.62)' }}>
          {movie.display_meta ?? `${yearFromDate(movie.release_date)} · 평점 ${movie.vote_average.toFixed(1)}`}
        </p>
        <p className="text-xs mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {shortText(movie.overview, 78)}
        </p>
      </div>
    </Link>
  );
}
