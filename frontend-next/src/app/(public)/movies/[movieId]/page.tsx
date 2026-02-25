'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock3, ExternalLink, PlayCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/providers/user-provider';
import UserMenu from '@/components/layout/user-menu';
import FavoriteToggleButton from '@/components/favorite/favorite-toggle-button';

const BG = '#070912';
const PANEL = '#0d1020';
const AMBER = '#F59E0B';
const AMBER_DARK = '#B45309';
const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';
const DRAG_MULTIPLIER = 1.35;
const MOMENTUM_MULTIPLIER = 18;
const MOMENTUM_DECAY = 0.9;
const MOMENTUM_STOP_THRESHOLD = 0.4;
const DRAG_START_THRESHOLD = 6;
const EDGE_AUTO_SCROLL_ZONE = 88;
const EDGE_AUTO_SCROLL_MAX_STEP = 14;

type Genre = {
  id: number;
  name: string;
};

type Cast = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

type Crew = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
};

type Video = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
};

type MovieDetail = {
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
  } | null;
  production_companies: {
    id: number;
    name: string;
    origin_country: string;
  }[];
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  spoken_languages: {
    iso_639_1: string;
    name: string;
    english_name: string;
  }[];
  genres: Genre[];
  credits?: {
    cast: Cast[];
    crew: Crew[];
  };
  videos?: {
    results: Video[];
  };
  recommendations?: {
    results: {
      id: number;
      title: string;
      poster_path: string | null;
      vote_average: number;
      release_date: string;
    }[];
  };
};

function imageUrl(path: string | null, size: 'w500' | 'w780' = 'w780') {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function toYear(date: string | undefined | null) {
  if (!date) return '미정';
  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? '미정' : String(year);
}

function toCurrency(value: number) {
  if (!value || value <= 0) return '정보 없음';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MovieDetailPage() {
  const router = useRouter();
  const params = useParams<{ movieId: string }>();
  const { user, isLoading: isUserLoading } = useUser();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllCast, setShowAllCast] = useState(false);
  const [showAllCrew, setShowAllCrew] = useState(false);
  const recommendationsRef = useRef<HTMLDivElement | null>(null);
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

  const movieId = useMemo(() => Number(params.movieId), [params.movieId]);
  const castList = useMemo(() => movie?.credits?.cast ?? [], [movie]);
  const crewList = useMemo(() => {
    const crew = movie?.credits?.crew ?? [];
    if (!crew.length) return [];

    const priorityJobs = [
      'Director',
      'Screenplay',
      'Writer',
      'Producer',
      'Original Music Composer',
      'Director of Photography',
      'Editor',
      'Sound Designer',
      'Sound',
    ];

    const result: Crew[] = [];
    const seen = new Set<string>();

    for (const job of priorityJobs) {
      const matched = crew.filter((person) => person.job === job);
      for (const person of matched) {
        const key = `${person.id}:${person.job}:${person.department}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(person);
      }
    }

    for (const person of crew) {
      const key = `${person.id}:${person.job}:${person.department}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(person);
    }

    return result;
  }, [movie]);
  const visibleCast = useMemo(
    () => (showAllCast ? castList : castList.slice(0, 8)),
    [castList, showAllCast]
  );
  const visibleCrew = useMemo(
    () => (showAllCrew ? crewList : crewList.slice(0, 8)),
    [crewList, showAllCrew]
  );
  const trailer = useMemo(
    () =>
      movie?.videos?.results?.find(
        (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
      ) ?? null,
    [movie]
  );
  const trailerEmbedUrl = useMemo(
    () =>
      trailer
        ? `https://www.youtube-nocookie.com/embed/${trailer.key}?rel=0&modestbranding=1`
        : null,
    [trailer]
  );
  const recommendations = useMemo(() => movie?.recommendations?.results?.slice(0, 12) ?? [], [movie]);

  const scrollRecommendations = (direction: 'left' | 'right') => {
    if (!recommendationsRef.current) return;
    recommendationsRef.current.scrollBy({
      left: direction === 'left' ? -640 : 640,
      behavior: 'smooth',
    });
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
      if (!recommendationsRef.current || !isPointerDownRef.current || !hasDraggedRef.current) {
        edgeAutoFrameRef.current = null;
        return;
      }

      const rect = recommendationsRef.current.getBoundingClientRect();
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
        recommendationsRef.current.scrollLeft += autoStep;
      }

      edgeAutoFrameRef.current = requestAnimationFrame(step);
    };

    edgeAutoFrameRef.current = requestAnimationFrame(step);
  };

  const runMomentum = () => {
    if (!recommendationsRef.current) return;
    let velocity = velocityRef.current * MOMENTUM_MULTIPLIER;

    const step = () => {
      if (!recommendationsRef.current) return;
      recommendationsRef.current.scrollLeft += velocity;
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

  const handleRecommendationsPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !recommendationsRef.current) return;
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
    recommendationsRef.current.style.cursor = 'grabbing';
  };

  const handleRecommendationsPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || !recommendationsRef.current || activePointerIdRef.current !== event.pointerId) return;
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
    recommendationsRef.current.scrollLeft -= deltaX * DRAG_MULTIPLIER;

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

  const handleRecommendationsPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    isPointerDownRef.current = false;
    activePointerIdRef.current = null;
    stopEdgeAutoScroll();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (recommendationsRef.current) {
      recommendationsRef.current.style.cursor = 'grab';
    }
    if (hasDraggedRef.current && Math.abs(velocityRef.current) > 0.01) {
      runMomentum();
    }
    hasDraggedRef.current = false;
  };

  useEffect(() => {
    let isMounted = true;

    async function loadMovie() {
      if (Number.isNaN(movieId) || movieId <= 0) {
        setError('잘못된 영화 ID입니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/movies/${movieId}`);
        if (!res.ok) {
          throw new Error('영화 상세 정보를 불러오지 못했습니다.');
        }
        const data = (await res.json()) as MovieDetail;
        if (!isMounted) return;
        setMovie(data);
      } catch (e) {
        if (!isMounted) return;
        const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
        setError(message);
        setMovie(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMovie();

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  useEffect(() => {
    return () => {
      if (momentumFrameRef.current !== null) {
        cancelAnimationFrame(momentumFrameRef.current);
      }
      if (edgeAutoFrameRef.current !== null) {
        cancelAnimationFrame(edgeAutoFrameRef.current);
      }
    };
  }, []);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-amber-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: BG }}>
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: 'rgba(245,158,11,0.16)', background: 'rgba(7,9,18,0.88)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <Link href="/home" className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <h1 className="text-xl font-black tracking-tight" style={{ color: AMBER }}>SceneHive</h1>
          </Link>
          <div className="flex items-center gap-3">
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

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            영화 상세 정보를 불러오는 중입니다...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(248,113,113,0.45)', background: 'rgba(127,29,29,0.22)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        {!isLoading && !error && movie && (
          <>
            <section
              className="relative overflow-hidden rounded-2xl border min-h-[360px] p-6 md:p-8"
              style={{ borderColor: 'rgba(245,158,11,0.22)', background: PANEL }}
            >
              {movie.backdrop_path && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(7,9,18,0.20) 0%, rgba(7,9,18,0.90) 70%), linear-gradient(90deg, rgba(7,9,18,0.88) 10%, rgba(7,9,18,0.45) 55%, rgba(7,9,18,0.92) 100%), url(${imageUrl(movie.backdrop_path, 'w780')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}
              <div className="relative flex flex-col md:flex-row gap-6">
                <div className="w-48 shrink-0 rounded-xl overflow-hidden border hidden md:block"
                  style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                  {movie.poster_path ? (
                    <img src={imageUrl(movie.poster_path, 'w500')} alt={movie.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-72 flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      NO POSTER
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(245,158,11,0.9)' }}>
                    Movie Detail
                  </p>
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                    {movie.title}
                  </h2>
                  {movie.tagline && (
                    <p className="mt-3 text-sm md:text-base italic" style={{ color: 'rgba(255,255,255,0.72)' }}>
                      {movie.tagline}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <Star className="w-3.5 h-3.5" style={{ fill: AMBER, color: AMBER }} />
                      {movie.vote_average.toFixed(1)} ({movie.vote_count.toLocaleString()} votes)
                    </span>
                    <span className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      {toYear(movie.release_date)}
                    </span>
                    {movie.runtime ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <Clock3 className="w-3.5 h-3.5" />
                        {movie.runtime}분
                      </span>
                    ) : null}
                    <span className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      {movie.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      Popularity {movie.popularity.toFixed(1)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
                      <Link
                        key={genre.id}
                        href={`/genres/${genre.id}`}
                        className="px-2.5 py-1 rounded-full text-xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                        title={`${genre.name} 장르 보기`}
                        style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', color: 'rgba(245,158,11,0.92)' }}
                      >
                        {genre.name}
                      </Link>
                    ))}
                  </div>

                  <p className="mt-5 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.74)' }}>
                    {movie.overview || '상세 줄거리 정보가 없습니다.'}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <FavoriteToggleButton
                      targetType="MOVIE"
                      targetId={movie.id}
                      displayName={movie.title}
                      imagePath={movie.poster_path}
                    />
                    <Button asChild variant="outline"
                      style={{ borderColor: 'rgba(245,158,11,0.35)', color: 'rgba(245,158,11,0.95)', background: 'rgba(245,158,11,0.08)' }}>
                      <Link href="/home">홈으로</Link>
                    </Button>
                    <Button asChild
                      className="text-white font-semibold"
                      style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}>
                      <Link href="/search">통합 검색으로</Link>
                    </Button>
                    {trailer ? (
                      <Button asChild variant="outline"
                        style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}>
                        <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                          <PlayCircle className="w-4 h-4" />
                          트레일러
                        </a>
                      </Button>
                    ) : null}
                    {movie.homepage ? (
                      <Button asChild variant="outline"
                        style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}>
                        <a href={movie.homepage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          공식 페이지
                        </a>
                      </Button>
                    ) : null}
                    {movie.imdb_id ? (
                      <Button asChild variant="outline"
                        style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}>
                        <a href={`https://www.imdb.com/title/${movie.imdb_id}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          IMDb
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {trailerEmbedUrl ? (
              <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'rgba(245,158,11,0.18)', background: PANEL }}>
                <h3 className="text-lg font-bold text-white">트레일러</h3>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.58)' }}>
                  {trailer?.name || 'YouTube Trailer'}
                </p>
                <div
                  className="mt-3 rounded-xl overflow-hidden border"
                  style={{ borderColor: 'rgba(245,158,11,0.16)', background: 'rgba(0,0,0,0.35)' }}
                >
                  <div className="aspect-video w-full">
                    <iframe
                      src={trailerEmbedUrl}
                      title={`${movie.title} trailer`}
                      className="w-full h-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </div>
              </section>
            ) : null}

            <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(245,158,11,0.18)', background: PANEL }}>
                <h3 className="text-lg font-bold text-white mb-4">핵심 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <InfoRow label="원제" value={movie.original_title || '정보 없음'} />
                  <InfoRow label="개봉연도" value={toYear(movie.release_date)} />
                  <InfoRow label="예산" value={toCurrency(movie.budget)} />
                  <InfoRow label="수익" value={toCurrency(movie.revenue)} />
                  <InfoRow label="시리즈" value={movie.belongs_to_collection?.name || '단일 작품'} />
                  <InfoRow label="상영시간" value={movie.runtime ? `${movie.runtime}분` : '정보 없음'} />
                </div>
              </div>

              <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(245,158,11,0.18)', background: PANEL }}>
                <h3 className="text-lg font-bold text-white mb-4">제작 정보</h3>
                <div className="space-y-3 text-sm">
                  <InfoRow
                    label="제작사"
                    value={
                      movie.production_companies?.length
                        ? movie.production_companies.slice(0, 3).map((company) => company.name).join(', ')
                        : '정보 없음'
                    }
                  />
                  <InfoRow
                    label="제작국"
                    value={
                      movie.production_countries?.length
                        ? movie.production_countries.map((country) => country.name).join(', ')
                        : '정보 없음'
                    }
                  />
                  <InfoRow
                    label="언어"
                    value={
                      movie.spoken_languages?.length
                        ? movie.spoken_languages.map((language) => language.name).join(', ')
                        : '정보 없음'
                    }
                  />
                </div>
              </div>
            </section>

            {castList.length > 0 ? (
              <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'rgba(245,158,11,0.18)', background: PANEL }}>
                <h3 className="text-lg font-bold text-white mb-4">주요 출연진</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                  {visibleCast.map((cast) => (
                    <Link
                      key={cast.id}
                      href={`/people/${cast.id}`}
                      className="rounded-lg border p-2 block"
                      style={{ borderColor: 'rgba(245,158,11,0.12)', background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="w-full aspect-square rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {cast.profile_path ? (
                          <img src={imageUrl(cast.profile_path, 'w500')} alt={cast.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            NO IMAGE
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-white mt-2 line-clamp-1">{cast.name}</p>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'rgba(255,255,255,0.58)' }}>{cast.character || '역할 정보 없음'}</p>
                    </Link>
                  ))}
                </div>
                {castList.length > 8 ? (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAllCast((prev) => !prev)}
                      style={{ borderColor: 'rgba(245,158,11,0.35)', color: 'rgba(245,158,11,0.95)', background: 'rgba(245,158,11,0.08)' }}
                    >
                      {showAllCast ? '출연진 접기' : `출연진 더보기 (${castList.length - 8}명)`}
                    </Button>
                  </div>
                ) : null}
              </section>
            ) : null}

            {crewList.length > 0 ? (
              <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'rgba(245,158,11,0.18)', background: PANEL }}>
                <h3 className="text-lg font-bold text-white mb-4">주요 스태프</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                  {visibleCrew.map((crew) => (
                    <Link
                      key={`${crew.id}-${crew.job}-${crew.department}`}
                      href={`/people/${crew.id}`}
                      className="rounded-lg border p-2 block"
                      style={{ borderColor: 'rgba(245,158,11,0.12)', background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="w-full aspect-square rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {crew.profile_path ? (
                          <img src={imageUrl(crew.profile_path, 'w500')} alt={crew.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            NO IMAGE
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-white mt-2 line-clamp-1">{crew.name}</p>
                      <p className="text-xs mt-1 line-clamp-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
                        직무: {crew.job || '정보 없음'}
                      </p>
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.58)' }}>
                        부서: {crew.department || '정보 없음'}
                      </p>
                    </Link>
                  ))}
                </div>
                {crewList.length > 8 ? (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAllCrew((prev) => !prev)}
                      style={{ borderColor: 'rgba(245,158,11,0.35)', color: 'rgba(245,158,11,0.95)', background: 'rgba(245,158,11,0.08)' }}
                    >
                      {showAllCrew ? '스태프 접기' : `스태프 더보기 (${crewList.length - 8}명)`}
                    </Button>
                  </div>
                ) : null}
              </section>
            ) : null}

            {recommendations.length > 0 ? (
              <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'rgba(245,158,11,0.18)', background: PANEL }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">비슷한 영화 추천</h3>
                  <div className="hidden md:flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="recommendations left"
                      onClick={() => scrollRecommendations('left')}
                      className="h-9 w-9 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'rgba(245,158,11,0.24)', color: 'rgba(255,255,255,0.84)', background: 'rgba(255,255,255,0.04)' }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="recommendations right"
                      onClick={() => scrollRecommendations('right')}
                      className="h-9 w-9 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'rgba(245,158,11,0.24)', color: 'rgba(255,255,255,0.84)', background: 'rgba(255,255,255,0.04)' }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div
                  ref={recommendationsRef}
                  onPointerDown={handleRecommendationsPointerDown}
                  onPointerMove={handleRecommendationsPointerMove}
                  onPointerUp={handleRecommendationsPointerEnd}
                  onPointerCancel={handleRecommendationsPointerEnd}
                  onDragStart={(event) => event.preventDefault()}
                  className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 hide-scrollbar scroll-mask cursor-grab select-none touch-pan-y"
                >
                  {recommendations.map((item) => (
                    <Link
                      key={item.id}
                      href={`/movies/${item.id}`}
                      draggable={false}
                      onDragStart={(event) => event.preventDefault()}
                      className="group rounded-lg border p-2 block w-40 md:w-48 shrink-0"
                      style={{ borderColor: 'rgba(245,158,11,0.12)', background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="w-full h-56 md:h-72 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {item.poster_path ? (
                          <img src={imageUrl(item.poster_path, 'w500')} alt={item.title} draggable={false} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            NO POSTER
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-white mt-2 line-clamp-2">{item.title}</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.58)' }}>
                        {toYear(item.release_date)} · {item.vote_average.toFixed(1)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </p>
      <p className="text-sm mt-1 text-white">{value}</p>
    </div>
  );
}
