'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/providers/user-provider';
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
  vote_average: number;
  release_date: string;
};

type SearchPayload = {
  query: string;
  page: number;
  total_pages: number;
  total_results: number;
  results: Movie[];
};

function posterUrl(path: string | null) {
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
  const [results, setResults] = useState<Movie[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(initialQuery.trim().length >= 2);

  const runSearch = async (searchText: string) => {
    const normalized = searchText.trim();
    setSearchedQuery(normalized);
    setError(null);

    if (normalized.length < 2) {
      setHasSearched(false);
      setResults([]);
      setTotalCount(0);
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(true);
      const response = await fetch(`/api/movies/search?q=${encodeURIComponent(normalized)}`);
      if (!response.ok) {
        throw new Error('검색 중 오류가 발생했습니다.');
      }
      const data = (await response.json()) as SearchPayload;
      setResults(data.results ?? []);
      setTotalCount(data.total_results ?? 0);
    } catch (e) {
      const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
      setError(message);
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      runSearch(initialQuery);
    }
  }, [initialQuery]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim();
    router.replace(normalized ? `/search?q=${encodeURIComponent(normalized)}` : '/search');
    await runSearch(normalized);
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
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: 'rgba(245,158,11,0.16)', background: 'rgba(7,9,18,0.88)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2">
              <span className="text-xl">🎬</span>
              <h1 className="text-xl font-black tracking-tight" style={{ color: AMBER }}>SceneHive</h1>
            </Link>
            <span className="text-sm hidden md:inline" style={{ color: 'rgba(255,255,255,0.55)' }}>
              영화 검색
            </span>
          </div>
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
        <section
          className="rounded-2xl border p-5 md:p-6"
          style={{ borderColor: 'rgba(245,158,11,0.18)', background: PANEL }}
        >
          <h2 className="text-2xl md:text-3xl font-black text-white">영화 검색</h2>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            영화 제목으로 검색하면 TMDB 기반 정보를 확인할 수 있습니다.
          </p>

          <form className="mt-5 flex gap-2" onSubmit={onSubmit}>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.45)' }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: 인터스텔라, 기생충, 듄"
                className="w-full h-11 rounded-lg pl-10 pr-3 text-sm bg-transparent border text-white"
                style={{ borderColor: 'rgba(245,158,11,0.24)' }}
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
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                  {results.map((movie) => (
                    <Link key={movie.id} href={`/movies/${movie.id}`} className="group block">
                      <div
                        className="rounded-xl overflow-hidden border"
                        style={{ borderColor: 'rgba(245,158,11,0.18)', background: 'rgba(255,255,255,0.03)' }}
                      >
                        {movie.poster_path ? (
                          <img
                            src={posterUrl(movie.poster_path)}
                            alt={movie.title}
                            className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            NO POSTER
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-white line-clamp-2">{movie.title}</h3>
                      <p className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        <Star className="w-3.5 h-3.5" style={{ fill: AMBER, color: AMBER }} />
                        {movie.vote_average.toFixed(1)} · {toYear(movie.release_date)}
                      </p>
                      <p className="text-xs mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.52)' }}>
                        {toExcerpt(movie.overview)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
