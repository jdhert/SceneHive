'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useUser } from '@/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import UserMenu from '@/components/layout/user-menu';

const BG = '#070912';
const PANEL = '#0d1020';
const AMBER = '#F59E0B';
const AMBER_DARK = '#B45309';
const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
};

type Genre = {
  id: number;
  name: string;
};

type MovieListPayload = {
  results: Movie[];
};

type GenrePayload = {
  genres: Genre[];
};

function movieImage(path: string | null, size: 'w500' | 'w780' = 'w500') {
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
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isMovieLoading, setIsMovieLoading] = useState(true);
  const [movieError, setMovieError] = useState<string | null>(null);

  const heroMovie = useMemo(() => trending[0] ?? null, [trending]);
  const trendingWithoutHero = useMemo(() => (trending.length > 1 ? trending.slice(1) : trending), [trending]);

  useEffect(() => {
    let isMounted = true;

    async function loadMovieSections() {
      try {
        setIsMovieLoading(true);
        setMovieError(null);

        const [trendingRes, nowPlayingRes, upcomingRes, topRatedRes, genresRes] = await Promise.all([
          fetch('/api/movies/trending'),
          fetch('/api/movies/now-playing'),
          fetch('/api/movies/upcoming'),
          fetch('/api/movies/top-rated'),
          fetch('/api/movies/genres'),
        ]);

        const responses = [trendingRes, nowPlayingRes, upcomingRes, topRatedRes, genresRes];
        const hasFailure = responses.some((res) => !res.ok);
        if (hasFailure) {
          throw new Error('영화 데이터를 불러오지 못했습니다.');
        }

        const [trendingData, nowPlayingData, upcomingData, topRatedData, genresData] = (await Promise.all([
          trendingRes.json(),
          nowPlayingRes.json(),
          upcomingRes.json(),
          topRatedRes.json(),
          genresRes.json(),
        ])) as [MovieListPayload, MovieListPayload, MovieListPayload, MovieListPayload, GenrePayload];

        if (!isMounted) return;

        setTrending(trendingData.results ?? []);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-amber-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: BG }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.30), transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)' }} />
      </div>

      <header className="sticky top-0 z-40 border-b" style={{ borderColor: 'rgba(245,158,11,0.16)', background: 'rgba(7,9,18,0.88)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎬</span>
            <h1 className="text-xl font-black tracking-tight" style={{ color: AMBER }}>SceneHive</h1>
          </div>
          <nav className="hidden lg:flex items-center gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.72)' }}>
            <a href="#trending" className="hover:text-white transition-colors">Trending</a>
            <a href="#now-playing" className="hover:text-white transition-colors">Now Playing</a>
            <a href="#upcoming" className="hover:text-white transition-colors">Upcoming</a>
            <a href="#top-rated" className="hover:text-white transition-colors">Top Rated</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline"
              className="font-medium"
              style={{ borderColor: 'rgba(245,158,11,0.28)', background: 'rgba(245,158,11,0.08)', color: 'rgba(245,158,11,0.95)' }}>
              <Link href="/search">영화 검색</Link>
            </Button>
            {user ? (
              <>
                <Button asChild className="text-white font-medium"
                  style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <Link href="/workspaces">영화 클럽</Link>
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Button onClick={() => router.push('/login')} variant="outline"
                  className="font-medium"
                  style={{ borderColor: 'rgba(245,158,11,0.4)', background: 'transparent', color: 'rgba(245,158,11,0.9)' }}>
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

      <section className="relative z-10 max-w-7xl mx-auto px-4 pt-8 md:pt-10">
        <div
          className="relative overflow-hidden rounded-2xl border min-h-[460px] p-8 md:p-10 flex items-end"
          style={{ borderColor: 'rgba(245,158,11,0.2)', background: PANEL }}
        >
          {heroMovie?.backdrop_path && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(7,9,18,0.22) 0%, rgba(7,9,18,0.92) 70%), linear-gradient(90deg, rgba(7,9,18,0.88) 5%, rgba(7,9,18,0.35) 55%, rgba(7,9,18,0.9) 100%), url(${movieImage(heroMovie.backdrop_path, 'w780')})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
          <div className="relative max-w-3xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 uppercase tracking-wide"
              style={{ background: 'rgba(245,158,11,0.12)', color: AMBER, border: '1px solid rgba(245,158,11,0.3)' }}
            >
              오늘의 스포트라이트
            </div>
            {heroMovie ? (
              <>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">{heroMovie.title}</h2>
                <p className="mt-4 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  {heroMovie.overview || '줄거리 정보가 아직 등록되지 않았습니다.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <Star className="w-3.5 h-3.5" style={{ fill: AMBER, color: AMBER }} />
                    {heroMovie.vote_average.toFixed(1)}
                  </span>
                  <span className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    개봉 {yearFromDate(heroMovie.release_date)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">SceneHive Movie Feed</h2>
                <p className="mt-4 text-sm md:text-base" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  지금 상영작과 트렌딩 영화를 홈에서 바로 확인하세요.
                </p>
              </>
            )}
            <div className="mt-7">
              {user ? (
                <Button
                  asChild
                  className="text-white font-bold"
                  style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
                >
                  <Link href="/workspaces">영화 클럽 입장하기</Link>
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/register')}
                  className="text-white font-bold"
                  style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
                >
                  회원가입하고 토론 시작
                </Button>
              )}
            </div>
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
          <Card className="border-0 mb-8" style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(248,113,113,0.35)' }}>
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

        <div className="mt-10">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Genres
          </h3>
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 12).map((genre) => (
              <span
                key={genre.id}
                className="px-3 py-1.5 rounded-full text-sm"
                style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.28)',
                  color: 'rgba(245,158,11,0.92)',
                }}
              >
                {genre.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {!user && (
        <section className="relative z-10 max-w-3xl mx-auto px-4 py-16">
          <Card className="border-0"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', backdropFilter: 'blur(20px)' }}>
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
      <footer className="relative z-10 border-t py-8 mt-8" style={{ borderColor: 'rgba(245,158,11,0.1)' }}>
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

  if (!movies.length) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -640 : 640,
      behavior: 'smooth',
    });
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
            className="h-9 w-9 rounded-full border flex items-center justify-center"
            style={{ borderColor: 'rgba(245,158,11,0.24)', color: 'rgba(255,255,255,0.84)', background: 'rgba(255,255,255,0.04)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label={`${title} right`}
            onClick={() => scroll('right')}
            className="h-9 w-9 rounded-full border flex items-center justify-center"
            style={{ borderColor: 'rgba(245,158,11,0.24)', color: 'rgba(255,255,255,0.84)', background: 'rgba(255,255,255,0.04)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 hide-scrollbar scroll-mask">
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
    <Link href={`/movies/${movie.id}`} className="relative w-40 md:w-48 shrink-0 group block">
      {numbered && (
        <span
          className="absolute -left-3 -bottom-1 text-7xl font-black leading-none z-10 select-none"
          style={{ color: 'rgba(255,255,255,0.13)' }}
        >
          {index + 1}
        </span>
      )}
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: 'rgba(245,158,11,0.18)', background: 'rgba(255,255,255,0.03)' }}
      >
        {movie.poster_path ? (
          <img
            src={movieImage(movie.poster_path)}
            alt={movie.title}
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
          {yearFromDate(movie.release_date)} · 평점 {movie.vote_average.toFixed(1)}
        </p>
        <p className="text-xs mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {shortText(movie.overview, 78)}
        </p>
      </div>
    </Link>
  );
}
