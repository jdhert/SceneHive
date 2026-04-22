'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/providers/user-provider';
import UserMenu from '@/components/layout/user-menu';

const BG = '#070912';
const PANEL = '#0d1020';
const AMBER = '#F59E0B';
const AMBER_DARK = '#B45309';
const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

type KnownFor = {
  id: number;
  title?: string;
  name?: string;
};

type Person = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for?: KnownFor[];
};

type PersonSearchResponse = {
  page: number;
  results: Person[];
  total_pages: number;
  total_results: number;
};

function imageUrl(path: string | null, size: 'w500' | 'w780' = 'w500') {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function PeopleSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading } = useUser();

  const query = searchParams.get('q')?.trim() ?? '';
  const page = useMemo(() => {
    const raw = Number(searchParams.get('page') ?? '1');
    if (Number.isNaN(raw) || raw < 1) return 1;
    return raw;
  }, [searchParams]);

  const [input, setInput] = useState(query);
  const [result, setResult] = useState<PersonSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    async function loadPeople() {
      if (!query) {
        setResult(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/people/search?query=${encodeURIComponent(query)}&page=${page}`);
        if (!res.ok) {
          throw new Error('인물 검색 결과를 불러오지 못했습니다.');
        }
        const data = (await res.json()) as PersonSearchResponse;
        if (!isMounted) return;
        setResult(data);
      } catch (e) {
        if (!isMounted) return;
        const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
        setError(message);
        setResult(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPeople();

    return () => {
      isMounted = false;
    };
  }, [query, page]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    router.push(`/people?q=${encodeURIComponent(trimmed)}&page=1`);
  }

  function movePage(nextPage: number) {
    const safePage = Math.max(1, nextPage);
    router.push(`/people?q=${encodeURIComponent(query)}&page=${safePage}`);
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-amber-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: BG }}>
      <header
        className="sticky top-0 z-40 border-b"
        style={{ borderColor: 'rgba(245,158,11,0.16)', background: 'rgba(7,9,18,0.88)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <Link href="/home" className="flex items-center gap-3">
            <span className="text-xl">🎬</span>
            <h1 className="text-xl font-black tracking-tight" style={{ color: AMBER }}>SceneHive</h1>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="font-medium"
              style={{ borderColor: 'rgba(245,158,11,0.35)', color: 'rgba(245,158,11,0.95)', background: 'rgba(245,158,11,0.08)' }}>
              <Link href="/search" className="inline-flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">통합 검색</span>
              </Link>
            </Button>
            {user ? (
              <>
                <Button asChild className="hidden sm:inline-flex text-white font-medium"
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
                  className="hidden sm:inline-flex font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}>
                  회원가입
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <section className="rounded-2xl border p-6 md:p-8" style={{ borderColor: 'rgba(245,158,11,0.22)', background: PANEL }}>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(245,158,11,0.9)' }}>
            People Search
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
            배우/스태프 검색
          </h2>
          <p className="text-sm mt-3" style={{ color: 'rgba(255,255,255,0.72)' }}>
            이름으로 배우, 감독, 스태프를 찾고 대표 작품을 확인하세요.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.45)' }} />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="예: Christopher Nolan, Leonardo DiCaprio"
                className="w-full h-11 rounded-lg border pl-9 pr-3 bg-transparent text-sm text-white outline-none"
                style={{ borderColor: 'rgba(245,158,11,0.28)' }}
              />
            </div>
            <Button type="submit" className="text-white font-semibold"
              style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}>
              검색
            </Button>
          </form>
        </section>

        {isLoading ? (
          <div className="mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            인물 정보를 불러오는 중입니다...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="mt-6 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(248,113,113,0.45)', background: 'rgba(127,29,29,0.22)', color: '#FCA5A5' }}>
            {error}
          </div>
        ) : null}

        {!isLoading && !error && query && result && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                &quot;{query}&quot; 검색 결과 {result.total_results.toLocaleString()}명
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.52)' }}>
                페이지 {result.page} / {Math.max(result.total_pages, 1)}
              </p>
            </div>

            {result.results.length === 0 ? (
              <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(245,158,11,0.22)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.72)' }}>
                검색 결과가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {result.results.map((person) => (
                  <Link
                    key={person.id}
                    href={`/people/${person.id}`}
                    className="group rounded-lg border p-2 block"
                    style={{ borderColor: 'rgba(245,158,11,0.12)', background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="w-full aspect-[2/3] rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {person.profile_path ? (
                        <img src={imageUrl(person.profile_path, 'w500')} alt={person.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          NO IMAGE
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white mt-2 line-clamp-1">{person.name}</p>
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: 'rgba(255,255,255,0.58)' }}>
                      {person.known_for_department || '부서 정보 없음'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(245,158,11,0.9)' }}>
                      Popularity {person.popularity.toFixed(1)}
                    </p>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'rgba(255,255,255,0.58)' }}>
                      대표작: {(person.known_for ?? []).map((item) => item.title || item.name).filter(Boolean).slice(0, 2).join(', ') || '정보 없음'}
                    </p>
                  </Link>
                ))}
              </div>
            )}

            {result.total_pages > 1 ? (
              <div className="mt-5 flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => movePage(page - 1)}
                  style={{ borderColor: 'rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.82)', background: 'rgba(255,255,255,0.05)' }}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= result.total_pages}
                  onClick={() => movePage(page + 1)}
                  style={{ borderColor: 'rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.82)', background: 'rgba(255,255,255,0.05)' }}
                >
                  다음
                </Button>
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}

export default function PeopleSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
          <div className="text-amber-400 text-xl">Loading...</div>
        </div>
      }
    >
      <PeopleSearchContent />
    </Suspense>
  );
}
