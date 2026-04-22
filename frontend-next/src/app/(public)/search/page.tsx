'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/providers/user-provider';
import UserMenu from '@/components/layout/user-menu';

const BG = '#04060C';
const PANEL = 'rgba(9,13,24,0.58)';
const AMBER = '#55A8FF';
const AMBER_DARK = '#2A6FD2';
const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

type MediaType = 'movie' | 'person' | 'tv';
type FilterType = 'all' | MediaType;

type MultiSearchItem = {
  id: number;
  media_type: MediaType;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  profile_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  known_for_department?: string;
  popularity?: number;
};

type SearchPayload = {
  query: string;
  page: number;
  total_pages: number;
  total_results: number;
  results: MultiSearchItem[];
};

function imageUrl(path: string | null | undefined) {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/w500${path}`;
}

function toYear(date: string | null | undefined) {
  if (!date) return '미정';
  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? '미정' : String(year);
}

function toExcerpt(text: string, max = 88) {
  if (!text) return '줄거리 정보가 없습니다.';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function getItemTitle(item: MultiSearchItem) {
  return item.media_type === 'movie' ? (item.title || '제목 없음') : (item.name || '이름 없음');
}

function getItemHref(item: MultiSearchItem) {
  if (item.media_type === 'movie') return `/movies/${item.id}`;
  if (item.media_type === 'person') return `/people/${item.id}`;
  return `/tv/${item.id}`;
}

function getItemTypeLabel(type: MediaType) {
  if (type === 'movie') return '영화';
  if (type === 'person') return '인물';
  return 'TV';
}

export default function MovieSearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <MovieSearchPageContent />
    </Suspense>
  );
}

function SearchPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="text-amber-400 text-xl">Loading...</div>
    </div>
  );
}

function MovieSearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading } = useUser();

  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [searchedQuery, setSearchedQuery] = useState(initialQuery);
  const [results, setResults] = useState<MultiSearchItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(initialQuery.trim().length >= 2);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const personResults = useMemo(
    () => results.filter((item) => item.media_type === 'person'),
    [results]
  );
  const movieResults = useMemo(
    () => results.filter((item) => item.media_type === 'movie'),
    [results]
  );
  const tvResults = useMemo(
    () => results.filter((item) => item.media_type === 'tv'),
    [results]
  );
  const filteredResults = useMemo(() => {
    if (activeFilter === 'all') return results;
    return results.filter((item) => item.media_type === activeFilter);
  }, [results, activeFilter]);

  const runSearch = async (searchText: string, page = 1, append = false) => {
    const normalized = searchText.trim();
    setSearchedQuery(normalized);
    setError(null);

    if (normalized.length < 2) {
      setHasSearched(false);
      setResults([]);
      setTotalCount(0);
      setTotalPages(0);
      setCurrentPage(1);
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(true);
      const response = await fetch(`/api/search/multi?q=${encodeURIComponent(normalized)}&page=${page}`);
      if (!response.ok) {
        throw new Error('검색 중 오류가 발생했습니다.');
      }
      const data = (await response.json()) as SearchPayload;
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
      setTotalCount(data.total_results ?? 0);
      setTotalPages(data.total_pages ?? 0);
      setCurrentPage(data.page ?? page);
      if (!append) {
        setActiveFilter('all');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
      setError(message);
      if (!append) {
        setResults([]);
        setTotalCount(0);
        setTotalPages(0);
        setCurrentPage(1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      runSearch(initialQuery, 1, false);
    }
  }, [initialQuery]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim();
    router.replace(normalized ? `/search?q=${encodeURIComponent(normalized)}` : '/search');
    setActiveFilter('all');
    await runSearch(normalized, 1, false);
  };

  const onLoadMore = async () => {
    if (isLoading) return;
    if (!searchedQuery.trim() || currentPage >= totalPages) return;
    await runSearch(searchedQuery, currentPage + 1, true);
  };

  if (isUserLoading) {
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
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2">
              <span className="text-xl">🎬</span>
              <h1 className="text-xl font-black tracking-tight text-white">SceneHive</h1>
            </Link>
            <span className="text-sm hidden md:inline" style={{ color: 'rgba(255,255,255,0.55)' }}>
              통합 검색
            </span>
          </div>
          <div className="flex items-center gap-3">
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
                  className="hidden sm:inline-flex font-medium"
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

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <section
          className="rounded-2xl border p-5 md:p-6"
          style={{ borderColor: 'rgba(255,255,255,0.14)', background: PANEL }}
        >
          <h2 className="text-2xl md:text-3xl font-black text-white">통합 검색</h2>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            영화, 인물, TV 시리즈를 한 번에 검색할 수 있습니다.
          </p>

          <form className="mt-5 flex gap-2" onSubmit={onSubmit}>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.45)' }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: 인터스텔라, Leonardo DiCaprio, Breaking Bad"
                className="w-full h-11 rounded-lg pl-10 pr-3 text-sm bg-transparent border text-white"
                style={{ borderColor: 'rgba(255,255,255,0.24)' }}
              />
            </div>
            <Button
              type="submit"
              className="h-11 px-5 text-white font-semibold"
              style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
            >
              검색
            </Button>
          </form>
        </section>

        <section className="mt-7">
          {isLoading && (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
              검색 중입니다...
            </p>
          )}

          {!isLoading && error && (
            <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(248,113,113,0.45)', background: 'rgba(127,29,29,0.22)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}

          {!isLoading && !error && !hasSearched && (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              최소 2자 이상 입력해서 검색해 주세요.
            </p>
          )}

          {!isLoading && !error && hasSearched && (
            <div>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.68)' }}>
                &quot;{searchedQuery}&quot; 검색 결과 {totalCount.toLocaleString()}건
              </p>
              {results.length === 0 ? (
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>
                  결과가 없습니다.
                </p>
              ) : (
                <div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      className="px-3 py-1.5 rounded-full text-xs border"
                      style={{
                        borderColor: activeFilter === 'all' ? 'rgba(85,168,255,0.45)' : 'rgba(255,255,255,0.2)',
                        color: activeFilter === 'all' ? 'rgba(191,224,255,0.96)' : 'rgba(255,255,255,0.78)',
                        background: activeFilter === 'all' ? 'rgba(85,168,255,0.14)' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      All ({results.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('person')}
                      className="px-3 py-1.5 rounded-full text-xs border"
                      style={{
                        borderColor: activeFilter === 'person' ? 'rgba(85,168,255,0.45)' : 'rgba(255,255,255,0.2)',
                        color: activeFilter === 'person' ? 'rgba(191,224,255,0.96)' : 'rgba(255,255,255,0.78)',
                        background: activeFilter === 'person' ? 'rgba(85,168,255,0.14)' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      Person ({personResults.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('movie')}
                      className="px-3 py-1.5 rounded-full text-xs border"
                      style={{
                        borderColor: activeFilter === 'movie' ? 'rgba(85,168,255,0.45)' : 'rgba(255,255,255,0.2)',
                        color: activeFilter === 'movie' ? 'rgba(191,224,255,0.96)' : 'rgba(255,255,255,0.78)',
                        background: activeFilter === 'movie' ? 'rgba(85,168,255,0.14)' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      Movie ({movieResults.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('tv')}
                      className="px-3 py-1.5 rounded-full text-xs border"
                      style={{
                        borderColor: activeFilter === 'tv' ? 'rgba(85,168,255,0.45)' : 'rgba(255,255,255,0.2)',
                        color: activeFilter === 'tv' ? 'rgba(191,224,255,0.96)' : 'rgba(255,255,255,0.78)',
                        background: activeFilter === 'tv' ? 'rgba(85,168,255,0.14)' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      TV ({tvResults.length})
                    </button>
                  </div>

                  {filteredResults.length === 0 ? (
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>
                      선택한 카테고리에 결과가 없습니다.
                    </p>
                  ) : activeFilter === 'all' ? (
                    <div className="space-y-7">
                      <SearchResultSection title={`Person (${personResults.length})`} items={personResults} />
                      <SearchResultSection title={`Movie (${movieResults.length})`} items={movieResults} />
                      <SearchResultSection title={`TV (${tvResults.length})`} items={tvResults} />
                    </div>
                  ) : (
                    <SearchResultSection
                      title={`${getItemTypeLabel(activeFilter)} (${filteredResults.length})`}
                      items={filteredResults}
                    />
                  )}

                  {currentPage < totalPages ? (
                    <div className="mt-6 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        onClick={onLoadMore}
                        style={{ borderColor: 'rgba(255,255,255,0.24)', color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.08)' }}
                      >
                        {isLoading ? '불러오는 중...' : `더보기 (24개)`}
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SearchResultSection({ title, items }: { title: string; items: MultiSearchItem[] }) {
  if (!items.length) return null;

  return (
    <section>
      <h3 className="text-base font-semibold text-white mb-3">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {items.map((item) => (
          <SearchResultCard key={`${item.media_type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function SearchResultCard({ item }: { item: MultiSearchItem }) {
  return (
    <Link href={getItemHref(item)} className="group block">
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.03)' }}
      >
        {(item.poster_path || item.profile_path) ? (
          <img
            src={imageUrl(item.poster_path || item.profile_path)}
            alt={getItemTitle(item)}
            className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full aspect-[2/3] flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            NO POSTER
          </div>
        )}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-white line-clamp-2">{getItemTitle(item)}</h3>
      <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full mr-2"
          style={{ background: 'rgba(85,168,255,0.14)', color: 'rgba(191,224,255,0.96)' }}
        >
          {getItemTypeLabel(item.media_type)}
        </span>
        {item.media_type === 'person' ? (
          <span>{item.known_for_department || '분야 정보 없음'}</span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Star className="w-3.5 h-3.5" style={{ fill: '#F7B267', color: '#F7B267' }} />
            {(item.vote_average ?? 0).toFixed(1)} · {toYear(item.release_date || item.first_air_date)}
          </span>
        )}
      </div>
      <p className="text-xs mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.52)' }}>
        {toExcerpt(item.overview || (item.media_type === 'person' ? '인물 소개 정보가 없습니다.' : '줄거리 정보가 없습니다.'))}
      </p>
    </Link>
  );
}
