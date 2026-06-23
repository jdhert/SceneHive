'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ChevronLeft, Film, RotateCcw, Search, SlidersHorizontal, Star, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/layout/user-menu';
import { SceneHiveIcon } from '@/components/layout/scenehive-icon';
import { useUser } from '@/providers/user-provider';
import { prefetchMediaDetail } from '@/lib/detail-prefetch';

const BG = '#04060C';
const PANEL = 'rgba(9,13,24,0.68)';
const BLUE = '#55A8FF';
const BLUE_DARK = '#2A6FD2';
const RATING = '#F7B267';
const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

type DiscoverMediaType = 'movie' | 'tv';
type DiscoverSort = 'popular' | 'rating' | 'recent' | 'votes';

type Genre = {
  id: number;
  name: string;
};

type GenrePayload = {
  movie: Genre[];
  tv: Genre[];
};

type DiscoverItem = {
  id: number;
  media_type: DiscoverMediaType;
  title: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string;
  genre_ids: number[];
};

type DiscoverPayload = {
  type: DiscoverMediaType;
  sort: DiscoverSort;
  genre_ids: number[];
  year_from: number | null;
  year_to: number | null;
  min_rating: number | null;
  page: number;
  total_pages: number;
  total_results: number;
  results: DiscoverItem[];
};

type DiscoverFilters = {
  mediaType: DiscoverMediaType;
  sort: DiscoverSort;
  genreIds: number[];
  yearFrom: string;
  yearTo: string;
  minRating: string;
};

const SORT_OPTIONS: Array<{ value: DiscoverSort; label: string }> = [
  { value: 'popular', label: '인기순' },
  { value: 'rating', label: '평점순' },
  { value: 'recent', label: '최신순' },
  { value: 'votes', label: '투표수순' },
];

const RATING_OPTIONS = [
  { value: '', label: '전체 평점' },
  { value: '6', label: '6점 이상' },
  { value: '7', label: '7점 이상' },
  { value: '8', label: '8점 이상' },
];

function imageUrl(path: string | null | undefined) {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/w500${path}`;
}

function toYear(date: string | null | undefined) {
  if (!date) return '미정';
  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? '미정' : String(year);
}

function toExcerpt(text: string, max = 90) {
  if (!text) return '줄거리 정보가 없습니다.';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function parseMediaType(value: string | null): DiscoverMediaType {
  return value === 'tv' ? 'tv' : 'movie';
}

function parseSort(value: string | null): DiscoverSort {
  return SORT_OPTIONS.some((option) => option.value === value) ? (value as DiscoverSort) : 'popular';
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

function mediaLabel(type: DiscoverMediaType) {
  return type === 'movie' ? '영화' : 'TV';
}

function hrefFor(item: DiscoverItem) {
  return item.media_type === 'movie' ? `/movies/${item.id}` : `/tv/${item.id}`;
}

function buildQuery(filters: DiscoverFilters, page = 1) {
  const params = new URLSearchParams();
  params.set('type', filters.mediaType);
  params.set('sort', filters.sort);
  params.set('page', String(page));

  if (filters.genreIds.length) params.set('genres', filters.genreIds.join(','));
  if (filters.yearFrom.trim()) params.set('yearFrom', filters.yearFrom.trim());
  if (filters.yearTo.trim()) params.set('yearTo', filters.yearTo.trim());
  if (filters.minRating) params.set('rating', filters.minRating);

  return params;
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverFallback />}>
      <DiscoverPageContent />
    </Suspense>
  );
}

function DiscoverFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="text-xl" style={{ color: BLUE }}>Loading...</div>
    </div>
  );
}

function DiscoverPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const hasLoadedInitialResults = useRef(false);

  const [mediaType, setMediaType] = useState<DiscoverMediaType>(() => parseMediaType(searchParams.get('type')));
  const [sort, setSort] = useState<DiscoverSort>(() => parseSort(searchParams.get('sort')));
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>(() => parseGenreIds(searchParams.get('genres')));
  const [yearFrom, setYearFrom] = useState(searchParams.get('yearFrom') ?? '');
  const [yearTo, setYearTo] = useState(searchParams.get('yearTo') ?? '');
  const [minRating, setMinRating] = useState(searchParams.get('rating') ?? '');
  const [genres, setGenres] = useState<GenrePayload>({ movie: [], tv: [] });
  const [results, setResults] = useState<DiscoverItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentFilters = useMemo<DiscoverFilters>(
    () => ({
      mediaType,
      sort,
      genreIds: selectedGenreIds,
      yearFrom,
      yearTo,
      minRating,
    }),
    [mediaType, minRating, selectedGenreIds, sort, yearFrom, yearTo]
  );
  const activeGenres = mediaType === 'movie' ? genres.movie : genres.tv;
  const selectedGenreNames = useMemo(
    () =>
      activeGenres
        .filter((genre) => selectedGenreIds.includes(genre.id))
        .map((genre) => genre.name),
    [activeGenres, selectedGenreIds]
  );

  const loadGenres = useCallback(async () => {
    try {
      const response = await fetch('/api/discover/genres');
      if (!response.ok) return;
      const data = (await response.json()) as GenrePayload;
      setGenres({
        movie: data.movie ?? [],
        tv: data.tv ?? [],
      });
    } catch {
      // ignore genre list failure and keep the result grid usable
    }
  }, []);

  const loadDiscover = useCallback(
    async (filters: DiscoverFilters, page = 1, append = false, replaceUrl = true) => {
      try {
        setIsDiscoverLoading(true);
        setError(null);

        const params = buildQuery(filters, page);
        const response = await fetch(`/api/discover?${params.toString()}`);
        if (!response.ok) {
          throw new Error('탐색 결과를 불러오지 못했습니다.');
        }

        const data = (await response.json()) as DiscoverPayload;
        setResults((prev) => {
          const incoming = data.results ?? [];
          if (!append) return incoming;

          const existing = new Set(prev.map((item) => `${item.media_type}:${item.id}`));
          const merged = [...prev];
          for (const item of incoming) {
            const key = `${item.media_type}:${item.id}`;
            if (existing.has(key)) continue;
            existing.add(key);
            merged.push(item);
          }
          return merged;
        });
        setCurrentPage(data.page ?? page);
        setTotalPages(data.total_pages ?? 0);
        setTotalCount(data.total_results ?? 0);

        if (replaceUrl && !append) {
          router.replace(`/discover?${buildQuery(filters, 1).toString()}`, { scroll: false });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
        setError(message);
        if (!append) {
          setResults([]);
          setTotalPages(0);
          setTotalCount(0);
          setCurrentPage(1);
        }
      } finally {
        setIsDiscoverLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  useEffect(() => {
    if (hasLoadedInitialResults.current) return;
    hasLoadedInitialResults.current = true;
    void loadDiscover(currentFilters, 1, false, false);
  }, [currentFilters, loadDiscover]);

  const updateMediaType = async (nextType: DiscoverMediaType) => {
    const nextFilters = {
      ...currentFilters,
      mediaType: nextType,
      genreIds: [],
    };
    setMediaType(nextType);
    setSelectedGenreIds([]);
    await loadDiscover(nextFilters, 1, false);
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenreIds((prev) => (
      prev.includes(genreId)
        ? prev.filter((item) => item !== genreId)
        : [...prev, genreId]
    ));
  };

  const applyFilters = async () => {
    await loadDiscover(currentFilters, 1, false);
  };

  const resetFilters = async () => {
    const nextFilters: DiscoverFilters = {
      mediaType: 'movie',
      sort: 'popular',
      genreIds: [],
      yearFrom: '',
      yearTo: '',
      minRating: '',
    };
    setMediaType(nextFilters.mediaType);
    setSort(nextFilters.sort);
    setSelectedGenreIds(nextFilters.genreIds);
    setYearFrom(nextFilters.yearFrom);
    setYearTo(nextFilters.yearTo);
    setMinRating(nextFilters.minRating);
    await loadDiscover(nextFilters, 1, false);
  };

  const applyPreset = async (preset: DiscoverFilters) => {
    setMediaType(preset.mediaType);
    setSort(preset.sort);
    setSelectedGenreIds(preset.genreIds);
    setYearFrom(preset.yearFrom);
    setYearTo(preset.yearTo);
    setMinRating(preset.minRating);
    await loadDiscover(preset, 1, false);
  };

  const loadMore = async () => {
    if (isDiscoverLoading || currentPage >= totalPages) return;
    await loadDiscover(currentFilters, currentPage + 1, true, false);
  };

  const quickPresets: Array<{ label: string; filters: DiscoverFilters }> = [
    {
      label: '평점 높은 영화',
      filters: { mediaType: 'movie', sort: 'rating', genreIds: [], yearFrom: '', yearTo: '', minRating: '8' },
    },
    {
      label: '2020년대 TV',
      filters: { mediaType: 'tv', sort: 'popular', genreIds: [], yearFrom: '2020', yearTo: '', minRating: '7' },
    },
    {
      label: '최신 영화',
      filters: { mediaType: 'movie', sort: 'recent', genreIds: [], yearFrom: '2024', yearTo: '', minRating: '' },
    },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: BG }}>
      <header className="sticky top-0 z-40" style={{ background: 'linear-gradient(180deg, rgba(5,8,15,0.88) 0%, rgba(5,8,15,0.60) 68%, rgba(5,8,15,0) 100%)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-7xl mx-auto w-[calc(100vw-2rem)] sm:w-full px-0 sm:px-4 py-4 flex justify-between items-center gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/home" className="flex items-center gap-3 shrink-0">
              <SceneHiveIcon className="w-6 h-6 shrink-0" />
              <h1 className="font-header-en text-lg sm:text-xl font-black tracking-tight text-white">SceneHive</h1>
            </Link>
            <span className="font-header-en text-sm hidden md:inline" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Discover
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button asChild variant="outline"
              className="h-10 w-10 p-0 sm:w-auto sm:px-4 font-medium"
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
                <Button onClick={() => router.push('/login')} variant="outline"
                  className="font-medium"
                  style={{ borderColor: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.92)' }}>
                  로그인
                </Button>
                <Button onClick={() => router.push('/register')}
                  className="hidden sm:inline-flex font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})` }}>
                  회원가입
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto w-[calc(100vw-2rem)] sm:w-full min-w-0 px-0 sm:px-4 py-8">
        <section
          className="w-full max-w-full overflow-hidden rounded-2xl border p-5 md:p-6"
          style={{ borderColor: 'rgba(85,168,255,0.18)', background: PANEL }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(85,168,255,0.82)' }}>
                Discover
              </p>
              <h2 className="text-2xl md:text-4xl font-black text-white">조건으로 찾기</h2>
              <p className="text-sm mt-2 max-w-2xl break-words" style={{ color: 'rgba(255,255,255,0.62)' }}>
                장르, 연도, 평점, 정렬 기준을 조합해 지금 볼만한 영화와 TV 시리즈를 찾아보세요.
              </p>
            </div>
            <Button asChild variant="outline"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.86)', background: 'rgba(255,255,255,0.03)' }}>
              <Link href="/home" className="inline-flex items-center gap-1.5">
                <ChevronLeft className="w-4 h-4" />
                홈으로
              </Link>
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.filters)}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: 'rgba(85,168,255,0.24)', background: 'rgba(85,168,255,0.10)', color: 'rgba(207,231,255,0.96)' }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 w-full max-w-full overflow-hidden rounded-2xl border p-4 md:p-5" style={{ borderColor: 'rgba(85,168,255,0.16)', background: 'rgba(13,16,32,0.70)' }}>
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4" style={{ color: BLUE }} />
            <h3 className="text-sm font-bold text-white">필터</h3>
          </div>

          <div className="grid min-w-0 gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="min-w-0">
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.58)' }}>콘텐츠</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateMediaType('movie')}
                  className="h-11 rounded-lg border text-sm font-semibold inline-flex items-center justify-center gap-2"
                  style={{
                    borderColor: mediaType === 'movie' ? 'rgba(85,168,255,0.56)' : 'rgba(255,255,255,0.18)',
                    background: mediaType === 'movie' ? 'rgba(85,168,255,0.16)' : 'rgba(255,255,255,0.04)',
                    color: mediaType === 'movie' ? '#CFE7FF' : 'rgba(255,255,255,0.76)',
                  }}
                >
                  <Film className="w-4 h-4" />
                  영화
                </button>
                <button
                  type="button"
                  onClick={() => updateMediaType('tv')}
                  className="h-11 rounded-lg border text-sm font-semibold inline-flex items-center justify-center gap-2"
                  style={{
                    borderColor: mediaType === 'tv' ? 'rgba(85,168,255,0.56)' : 'rgba(255,255,255,0.18)',
                    background: mediaType === 'tv' ? 'rgba(85,168,255,0.16)' : 'rgba(255,255,255,0.04)',
                    color: mediaType === 'tv' ? '#CFE7FF' : 'rgba(255,255,255,0.76)',
                  }}
                >
                  <Tv className="w-4 h-4" />
                  TV
                </button>
              </div>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <label className="block min-w-0">
                <span className="text-xs block mb-2" style={{ color: 'rgba(255,255,255,0.58)' }}>정렬</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as DiscoverSort)}
                  className="h-11 w-full min-w-0 rounded-lg border px-3 text-sm text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.05)' }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#0D1020]">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="text-xs block mb-2" style={{ color: 'rgba(255,255,255,0.58)' }}>평점</span>
                <select
                  value={minRating}
                  onChange={(event) => setMinRating(event.target.value)}
                  className="h-11 w-full min-w-0 rounded-lg border px-3 text-sm text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.05)' }}
                >
                  {RATING_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value} className="bg-[#0D1020]">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
            <label className="block min-w-0">
              <span className="text-xs block mb-2" style={{ color: 'rgba(255,255,255,0.58)' }}>시작 연도</span>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.42)' }} />
                <input
                  value={yearFrom}
                  onChange={(event) => setYearFrom(event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                  inputMode="numeric"
                  placeholder="예: 2020"
                  className="h-11 w-full min-w-0 rounded-lg border pl-10 pr-3 text-sm text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            </label>
            <label className="block min-w-0">
              <span className="text-xs block mb-2" style={{ color: 'rgba(255,255,255,0.58)' }}>종료 연도</span>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.42)' }} />
                <input
                  value={yearTo}
                  onChange={(event) => setYearTo(event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                  inputMode="numeric"
                  placeholder="예: 2026"
                  className="h-11 w-full min-w-0 rounded-lg border pl-10 pr-3 text-sm text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            </label>
            <div className="flex min-w-0 items-end gap-2">
              <Button
                type="button"
                onClick={applyFilters}
                className="h-11 flex-1 text-white font-bold"
                style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})` }}
              >
                적용
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="h-11 w-11 p-0"
                aria-label="필터 초기화"
                style={{ borderColor: 'rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.84)', background: 'rgba(255,255,255,0.04)' }}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(85,168,255,0.82)' }}>
                Genres
              </p>
              <p className="max-w-full break-words text-xs sm:text-right" style={{ color: 'rgba(255,255,255,0.50)' }}>
                {selectedGenreNames.length ? selectedGenreNames.join(', ') : '장르 전체'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeGenres.map((genre) => {
                const isActive = selectedGenreIds.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => toggleGenre(genre.id)}
                    className="px-3 py-1.5 rounded-full text-xs border"
                    style={{
                      borderColor: isActive ? 'rgba(85,168,255,0.48)' : 'rgba(255,255,255,0.2)',
                      background: isActive ? 'rgba(85,168,255,0.14)' : 'rgba(255,255,255,0.04)',
                      color: isActive ? 'rgba(207,231,255,0.96)' : 'rgba(255,255,255,0.78)',
                    }}
                  >
                    {genre.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-white">{mediaLabel(mediaType)} 탐색 결과</h3>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.62)' }}>
                총 {totalCount.toLocaleString()}건
              </p>
            </div>
          </div>

          {isDiscoverLoading && results.length === 0 ? (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>불러오는 중입니다...</p>
          ) : null}

          {error ? (
            <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(248,113,113,0.45)', background: 'rgba(127,29,29,0.22)', color: '#FCA5A5' }}>
              {error}
            </div>
          ) : null}

          {!isDiscoverLoading && !error && results.length === 0 ? (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>
              조건에 맞는 결과가 없습니다.
            </p>
          ) : null}

          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 xl:grid-cols-6">
              {results.map((item) => (
                <DiscoverCard key={`${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
          ) : null}

          {results.length > 0 && currentPage < totalPages ? (
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={isDiscoverLoading}
                onClick={loadMore}
                style={{ borderColor: 'rgba(85,168,255,0.35)', color: 'rgba(207,231,255,0.95)', background: 'rgba(85,168,255,0.08)' }}
              >
                {isDiscoverLoading ? '불러오는 중...' : '더보기'}
              </Button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function DiscoverCard({ item }: { item: DiscoverItem }) {
  const href = hrefFor(item);

  return (
    <Link
      href={href}
      onPointerEnter={() => prefetchMediaDetail(href)}
      onFocus={() => prefetchMediaDetail(href)}
      onTouchStart={() => prefetchMediaDetail(href)}
      className="group block"
    >
      <div
        className="relative aspect-[2/3] rounded-xl overflow-hidden border"
        style={{ borderColor: 'rgba(85,168,255,0.16)', background: 'rgba(255,255,255,0.03)' }}
      >
        {item.poster_path ? (
          <Image
            src={imageUrl(item.poster_path)}
            alt={item.title}
            fill
            sizes="(min-width: 1280px) 16.66vw, (min-width: 768px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            NO POSTER
          </div>
        )}
      </div>
      <h4 className="mt-2 text-sm font-semibold text-white line-clamp-2">{item.title}</h4>
      <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full mr-2"
          style={{ background: 'rgba(85,168,255,0.14)', color: 'rgba(191,224,255,0.96)' }}
        >
          {mediaLabel(item.media_type)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Star className="w-3.5 h-3.5" style={{ fill: RATING, color: RATING }} />
          {item.vote_average.toFixed(1)} · {toYear(item.release_date)}
        </span>
      </div>
      <p className="text-xs mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.52)' }}>
        {toExcerpt(item.overview)}
      </p>
    </Link>
  );
}
