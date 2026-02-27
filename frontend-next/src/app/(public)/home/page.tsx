'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Info, Play, Search, Star } from 'lucide-react';
import { useUser } from '@/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import UserMenu from '@/components/layout/user-menu';

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

type Movie = {
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
};

type Genre = {
  id: number;
  name: string;
};

type Tv = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string;
};

type Person = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
};

type MovieListPayload = {
  results: Movie[];
};

type TvListPayload = {
  results: Tv[];
};

type PersonListPayload = {
  results: Person[];
};

type GenrePayload = {
  genres: Genre[];
};

type MovieTrailerPayload = {
  videos?: {
    results?: Array<{
      key: string;
      site: string;
      type: string;
    }>;
  };
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

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [trendingTv, setTrendingTv] = useState<Tv[]>([]);
  const [trendingPeople, setTrendingPeople] = useState<Person[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isMovieLoading, setIsMovieLoading] = useState(true);
  const [movieError, setMovieError] = useState<string | null>(null);
  const [heroTrailerUrl, setHeroTrailerUrl] = useState<string | null>(null);
  const handleBrandReload = () => {
    window.location.reload();
  };

  const heroMovie = useMemo(() => trending[0] ?? null, [trending]);
  const heroGenreNames = useMemo(() => {
    if (!heroMovie?.genre_ids?.length || !genres.length) return [] as string[];
    const genreMap = new Map(genres.map((genre) => [genre.id, genre.name]));
    return heroMovie.genre_ids
      .map((genreId) => genreMap.get(genreId))
      .filter((name): name is string => Boolean(name))
      .slice(0, 3);
  }, [heroMovie, genres]);
  const trendingWithoutHero = useMemo(() => (trending.length > 1 ? trending.slice(1) : trending), [trending]);
  const trendingTvAsMovies = useMemo(
    () =>
      trendingTv.map((show) => ({
        id: show.id,
        title: show.name,
        overview: show.overview,
        poster_path: show.poster_path,
        backdrop_path: null,
        vote_average: show.vote_average,
        release_date: show.first_air_date,
        href: `/tv/${show.id}`,
      })),
    [trendingTv]
  );
  const trendingPeopleAsMovies = useMemo(
    () =>
      trendingPeople.map((person) => ({
        id: person.id,
        title: person.name,
        overview: `인기도 ${person.popularity.toFixed(1)}`,
        poster_path: person.profile_path,
        backdrop_path: null,
        vote_average: 0,
        release_date: '',
        href: `/people/${person.id}`,
        display_meta: `인물 · ${person.known_for_department || '분야 미정'}`,
      })),
    [trendingPeople]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadMovieSections() {
      try {
        setIsMovieLoading(true);
        setMovieError(null);

        const [trendingRes, trendingTvRes, trendingPeopleRes, nowPlayingRes, upcomingRes, topRatedRes, genresRes] = await Promise.all([
          fetch('/api/movies/trending'),
          fetch('/api/tv/trending'),
          fetch('/api/people/trending'),
          fetch('/api/movies/now-playing'),
          fetch('/api/movies/upcoming'),
          fetch('/api/movies/top-rated'),
          fetch('/api/movies/genres'),
        ]);

        const responses = [trendingRes, trendingTvRes, trendingPeopleRes, nowPlayingRes, upcomingRes, topRatedRes, genresRes];
        const hasFailure = responses.some((res) => !res.ok);
        if (hasFailure) {
          throw new Error('영화 데이터를 불러오지 못했습니다.');
        }

        const [trendingData, trendingTvData, trendingPeopleData, nowPlayingData, upcomingData, topRatedData, genresData] = (await Promise.all([
          trendingRes.json(),
          trendingTvRes.json(),
          trendingPeopleRes.json(),
          nowPlayingRes.json(),
          upcomingRes.json(),
          topRatedRes.json(),
          genresRes.json(),
        ])) as [MovieListPayload, TvListPayload, PersonListPayload, MovieListPayload, MovieListPayload, MovieListPayload, GenrePayload];

        if (!isMounted) return;

        setTrending(trendingData.results ?? []);
        setTrendingTv(trendingTvData.results ?? []);
        setTrendingPeople(trendingPeopleData.results ?? []);
        setNowPlaying(nowPlayingData.results ?? []);
        setUpcoming(upcomingData.results ?? []);
        setTopRated(topRatedData.results ?? []);
        setGenres(genresData.genres ?? []);
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
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHeroTrailer() {
      if (!heroMovie?.id) {
        if (isMounted) setHeroTrailerUrl(null);
        return;
      }

      try {
        const res = await fetch(`/api/movies/${heroMovie.id}`);
        if (!res.ok) throw new Error('failed');
        const data = (await res.json()) as MovieTrailerPayload;
        const trailer = data.videos?.results?.find(
          (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
        );
        if (!isMounted) return;
        if (trailer?.key) {
          setHeroTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
        } else {
          setHeroTrailerUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${heroMovie.title} trailer`)}`);
        }
      } catch {
        if (!isMounted) return;
        setHeroTrailerUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${heroMovie.title} trailer`)}`);
      }
    }

    loadHeroTrailer();

    return () => {
      isMounted = false;
    };
  }, [heroMovie?.id, heroMovie?.title]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-amber-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: BG }}>
      <header className="sticky top-0 z-40" style={{ background: 'linear-gradient(180deg, rgba(5,8,15,0.78) 0%, rgba(5,8,15,0.40) 60%, rgba(5,8,15,0) 100%)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <button type="button" onClick={handleBrandReload} className="flex items-center gap-3">
            <span className="text-xl">🎬</span>
            <h1 className="text-xl font-black tracking-tight text-white">SceneHive</h1>
          </button>
          <nav className="hidden lg:flex items-center gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.64)' }}>
            <a href="#trending" className="hover:text-white transition-colors">Trending</a>
            <a href="#now-playing" className="hover:text-white transition-colors">Now Playing</a>
            <a href="#upcoming" className="hover:text-white transition-colors">Upcoming</a>
            <a href="#top-rated" className="hover:text-white transition-colors">Top Rated</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline"
              className="font-medium"
              style={{ borderColor: 'rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.90)' }}>
              <Link href="/search" className="inline-flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                통합 검색
              </Link>
            </Button>
            {user ? (
              <>
                <Button asChild className="text-white font-medium"
                  style={{ background: 'rgba(85,168,255,0.20)', border: '1px solid rgba(85,168,255,0.30)' }}>
                  <Link href="/workspaces">영화 클럽</Link>
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Button onClick={() => router.push('/login')} variant="outline"
                  className="font-medium"
                  style={{ borderColor: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.92)' }}>
                  로그인
                </Button>
                <Button onClick={() => router.push('/register')}
                  className="font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}>
                  회원가입
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
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${movieImage(heroMovie.backdrop_path, 'original')})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                filter: 'saturate(1.04) contrast(1.06)',
              }}
            />
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
                    Trending
                  </span>
                  {(heroGenreNames.length ? heroGenreNames : ['Movie']).map((genre) => (
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
                <p className="mt-7 text-lg md:text-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  {heroMovie.overview || '줄거리 정보가 아직 등록되지 않았습니다.'}
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
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
                    <Link href={`/movies/${heroMovie.id}`} className="inline-flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      More Info
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.06] tracking-tight">
                  SceneHive Movie Feed
                </h2>
                <p className="mt-7 text-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  지금 상영작과 트렌딩 영화를 홈에서 바로 확인하세요.
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

        <MovieCarouselSection
          id="trending"
          title="Trending"
          subtitle="지금 가장 인기 있는 영화"
          movies={trendingWithoutHero}
          numbered
        />
        <MovieCarouselSection
          id="now-playing"
          title="Now Playing"
          subtitle="현재 상영작"
          movies={nowPlaying}
        />
        <MovieCarouselSection
          id="upcoming"
          title="Upcoming"
          subtitle="개봉 예정작"
          movies={upcoming}
        />
        <MovieCarouselSection
          id="top-rated"
          title="Top Rated"
          subtitle="평점 상위작"
          movies={topRated}
        />
        <MovieCarouselSection
          id="trending-tv"
          title="Trending TV"
          subtitle="지금 인기 있는 TV 시리즈"
          movies={trendingTvAsMovies}
        />
        <MovieCarouselSection
          id="trending-people"
          title="Trending People"
          subtitle="지금 주목받는 인물"
          movies={trendingPeopleAsMovies}
        />

        <div className="mt-10">
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

function MovieCarouselSection({
  id,
  title,
  subtitle,
  movies,
  numbered = false,
}: {
  id: string;
  title: string;
  subtitle: string;
  movies: Movie[];
  numbered?: boolean;
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
    if (event.pointerType !== 'mouse' || event.button !== 0 || !scrollRef.current) return;
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
    <section id={id} className="mb-12">
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
        className={`flex gap-4 overflow-x-auto overflow-y-hidden pb-2 hide-scrollbar cursor-grab select-none touch-pan-y ${
          isAtStart ? 'scroll-mask-start-soft' : 'scroll-mask'
        }`}
      >
        {movies.map((movie, index) => (
          <MoviePosterCard
            key={movie.id}
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
        className="rounded-xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 12px 34px rgba(0,0,0,0.42)' }}
      >
        {movie.poster_path ? (
          <img
            src={movieImage(movie.poster_path)}
            alt={movie.title}
            draggable={false}
            className="w-full h-56 md:h-72 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-56 md:h-72 flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
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
