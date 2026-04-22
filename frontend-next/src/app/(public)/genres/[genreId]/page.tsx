'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Search, Star } from 'lucide-react';
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

type GenreMoviesPayload = {
  genre_id: number;
  genre_name: string | null;
  selected_genre_ids?: number[];
  selected_genres?: Genre[];
  page: number;
  total_pages: number;
  total_results: number;
  results: Movie[];
};

type Genre = {
  id: number;
  name: string;
};

type GenresPayload = {
  genres: Genre[];
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

function toExcerpt(text: string, max = 96) {
  if (!text) return '줄거리 정보가 없습니다.';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

export default function GenreMoviesPage() {
  const router = useRouter();
  const params = useParams<{ genreId: string }>();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading } = useUser();

  const genreId = Number(params.genreId);
  const initialName = searchParams.get('name') ?? '장르';
  const selectedFromQuery = searchParams.get('selected');

  const [genreName, setGenreName] = useState(initialName);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([genreId]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidGenreId = useMemo(() => !Number.isNaN(genreId) && genreId > 0, [genreId]);

  const loadByGenre = useCallback(async (page: number, append: boolean) => {
    if (!isValidGenreId) return;

    try {
      setIsLoading(true);
      setError(null);

      const selectedParam = selectedGenreIds.join(',');
      const response = await fetch(`/api/movies/genre/${genreId}?page=${page}&selected=${encodeURIComponent(selectedParam)}`);
      if (!response.ok) {
        throw new Error('장르 영화 데이터를 불러오지 못했습니다.');
      }

      const data = (await response.json()) as GenreMoviesPayload;
      if ((data.selected_genres ?? []).length > 0) {
        setGenreName((data.selected_genres ?? []).map((genre) => genre.name).join(', '));
      } else if (data.genre_name) {
        setGenreName(data.genre_name);
      }
      setMovies((prev) => {
        if (!append) return data.results ?? [];
        const existing = new Set(prev.map((item) => item.id));
        const merged = [...prev];
        for (const item of data.results ?? []) {
          if (existing.has(item.id)) continue;
          existing.add(item.id);
          merged.push(item);
        }
        return merged;
      });
      setCurrentPage(data.page ?? page);
      setTotalPages(data.total_pages ?? 1);
      setTotalCount(data.total_results ?? 0);
    } catch (e) {
      const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [genreId, isValidGenreId, selectedGenreIds]);

  const loadGenres = useCallback(async () => {
    try {
      const response = await fetch('/api/movies/genres');
      if (!response.ok) return;
      const data = (await response.json()) as GenresPayload;
      setGenres(data.genres ?? []);
    } catch {
      // ignore genre list error
    }
  }, []);

  useEffect(() => {
    if (!isValidGenreId) {
      setError('잘못된 장르 ID입니다.');
      return;
    }
    const parsedSelected = selectedFromQuery
      ? Array.from(
          new Set(
            selectedFromQuery
              .split(',')
              .map((item) => Number(item.trim()))
              .filter((item) => !Number.isNaN(item) && item > 0)
          )
        )
      : [genreId];
    setSelectedGenreIds(parsedSelected);
    loadGenres();
  }, [genreId, isValidGenreId, loadGenres, selectedFromQuery]);

  useEffect(() => {
    if (!isValidGenreId || !selectedGenreIds.length) return;
    loadByGenre(1, false);
  }, [isValidGenreId, loadByGenre, selectedGenreIds]);

  const onLoadMore = async () => {
    if (isLoading || currentPage >= totalPages) return;
    await loadByGenre(currentPage + 1, true);
  };

  const toggleGenre = (targetId: number) => {
    setSelectedGenreIds((prev) => {
      const next = prev.includes(targetId)
        ? prev.filter((item) => item !== targetId)
        : [...prev, targetId];
      if (!next.length) {
        return prev;
      }
      const normalized = Array.from(new Set(next));
      const selectedParam = normalized.join(',');
      router.replace(`/genres/${genreId}?selected=${encodeURIComponent(selectedParam)}`, { scroll: false });
      return normalized;
    });
    setMovies([]);
    setCurrentPage(1);
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
              장르별 영화
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline"
              className="font-medium"
              style={{ borderColor: 'rgba(245,158,11,0.28)', background: 'rgba(245,158,11,0.08)', color: 'rgba(245,158,11,0.95)' }}>
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
        <section
          className="rounded-2xl border p-5 md:p-6"
          style={{ borderColor: 'rgba(245,158,11,0.18)', background: PANEL }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(245,158,11,0.8)' }}>
                Genre Movies
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-white">{genreName}</h2>
              <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.62)' }}>
                선택 장르 {selectedGenreIds.length}개 · 총 {totalCount.toLocaleString()}건
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
        </section>

        <section className="mt-5 rounded-2xl border p-4" style={{ borderColor: 'rgba(245,158,11,0.16)', background: 'rgba(13,16,32,0.68)' }}>
          <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: 'rgba(245,158,11,0.82)' }}>
            Multi Genre Filter
          </p>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              const isActive = selectedGenreIds.includes(genre.id);
              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => toggleGenre(genre.id)}
                  className="px-3 py-1.5 rounded-full text-xs border"
                  style={{
                    borderColor: isActive ? 'rgba(245,158,11,0.48)' : 'rgba(255,255,255,0.2)',
                    background: isActive ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.04)',
                    color: isActive ? 'rgba(245,158,11,0.95)' : 'rgba(255,255,255,0.78)',
                  }}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7">
          {isLoading && movies.length === 0 ? (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>불러오는 중입니다...</p>
          ) : null}

          {error ? (
            <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(248,113,113,0.45)', background: 'rgba(127,29,29,0.22)', color: '#FCA5A5' }}>
              {error}
            </div>
          ) : null}

          {!isLoading && !error && movies.length === 0 ? (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>
              해당 장르의 영화가 없습니다.
            </p>
          ) : null}

          {movies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {movies.map((movie) => (
                <Link key={movie.id} href={`/movies/${movie.id}`} className="group block">
                  <div
                    className="rounded-xl overflow-hidden border"
                    style={{ borderColor: 'rgba(245,158,11,0.18)', background: 'rgba(255,255,255,0.03)' }}
                  >
                    {movie.poster_path ? (
                      <img
                        src={imageUrl(movie.poster_path)}
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
          ) : null}

          {movies.length > 0 && currentPage < totalPages ? (
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={onLoadMore}
                style={{ borderColor: 'rgba(245,158,11,0.35)', color: 'rgba(245,158,11,0.95)', background: 'rgba(245,158,11,0.08)' }}
              >
                {isLoading ? '불러오는 중...' : '더보기'}
              </Button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
