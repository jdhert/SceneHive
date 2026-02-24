'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/providers/user-provider';
import UserMenu from '@/components/layout/user-menu';
import FavoriteToggleButton from '@/components/favorite/favorite-toggle-button';

const BG = '#070912';
const PANEL = '#0d1020';
const AMBER = '#F59E0B';
const AMBER_DARK = '#B45309';
const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

type MovieCredit = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  popularity: number;
  character?: string;
  job?: string;
  department?: string;
};

type PersonDetail = {
  id: number;
  name: string;
  also_known_as: string[];
  biography: string;
  birthday: string | null;
  deathday: string | null;
  gender: number;
  homepage: string | null;
  imdb_id: string | null;
  known_for_department: string;
  place_of_birth: string | null;
  popularity: number;
  profile_path: string | null;
  external_ids?: {
    imdb_id?: string;
    instagram_id?: string;
    facebook_id?: string;
    twitter_id?: string;
    youtube_id?: string;
    wikidata_id?: string;
    tiktok_id?: string;
  };
  movie_credits?: {
    cast: MovieCredit[];
    crew: MovieCredit[];
  };
};

type PersonWork = {
  movie: MovieCredit;
  role: string;
  creditType: 'cast' | 'crew';
  categoryKey: WorkCategoryKey;
};

type WorkCategoryKey = 'acting' | 'directing' | 'writing' | 'production' | 'musicSound' | 'other';
type FeaturedWork = {
  movie: MovieCredit;
  role: string;
};

const WORK_CATEGORY_META: { key: WorkCategoryKey; label: string }[] = [
  { key: 'acting', label: '연기' },
  { key: 'directing', label: '연출' },
  { key: 'writing', label: '각본/스토리' },
  { key: 'production', label: '제작' },
  { key: 'musicSound', label: '음악/사운드' },
  { key: 'other', label: '기타 스태프' },
];

function getCrewCategory(movie: MovieCredit): WorkCategoryKey {
  const job = (movie.job || '').toLowerCase();
  const department = (movie.department || '').toLowerCase();

  if (department.includes('directing') || job.includes('director')) return 'directing';
  if (
    department.includes('writing') ||
    job.includes('writer') ||
    job.includes('screenplay') ||
    job.includes('story')
  ) {
    return 'writing';
  }
  if (
    department.includes('production') ||
    job.includes('producer')
  ) {
    return 'production';
  }
  if (
    department.includes('sound') ||
    department.includes('music') ||
    job.includes('composer') ||
    job.includes('sound') ||
    job.includes('music')
  ) {
    return 'musicSound';
  }
  return 'other';
}

function toTimestamp(date: string | null | undefined) {
  if (!date) return 0;
  const value = new Date(date).getTime();
  return Number.isNaN(value) ? 0 : value;
}

function imageUrl(path: string | null, size: 'w500' | 'w780' = 'w500') {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function toYear(date: string | null | undefined) {
  if (!date) return '미정';
  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? '미정' : String(year);
}

function toDate(date: string | null | undefined) {
  if (!date) return '정보 없음';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '정보 없음';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(value);
}

function genderText(gender: number) {
  if (gender === 1) return '여성';
  if (gender === 2) return '남성';
  if (gender === 3) return '논바이너리';
  return '정보 없음';
}

export default function PersonDetailPage() {
  const router = useRouter();
  const params = useParams<{ personId: string }>();
  const { user, isLoading: isUserLoading } = useUser();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<WorkCategoryKey, boolean>>({
    acting: false,
    directing: false,
    writing: false,
    production: false,
    musicSound: false,
    other: false,
  });

  const personId = useMemo(() => Number(params.personId), [params.personId]);
  const categorizedWorks = useMemo(() => {
    const cast = person?.movie_credits?.cast ?? [];
    const crew = person?.movie_credits?.crew ?? [];
    const buckets: Record<WorkCategoryKey, Map<number, PersonWork>> = {
      acting: new Map<number, PersonWork>(),
      directing: new Map<number, PersonWork>(),
      writing: new Map<number, PersonWork>(),
      production: new Map<number, PersonWork>(),
      musicSound: new Map<number, PersonWork>(),
      other: new Map<number, PersonWork>(),
    };

    for (const movie of cast) {
      const role = movie.character ? `배우 (${movie.character})` : '배우';
      const existing = buckets.acting.get(movie.id);
      if (existing) {
        if (!existing.role.includes(role)) {
          existing.role = `${existing.role} / ${role}`;
        }
        continue;
      }
      buckets.acting.set(movie.id, {
        movie,
        role,
        creditType: 'cast',
        categoryKey: 'acting',
      });
    }

    for (const movie of crew) {
      const category = getCrewCategory(movie);
      const role = movie.job || movie.department || '스태프';
      const existing = buckets[category].get(movie.id);
      if (existing) {
        if (!existing.role.includes(role)) {
          existing.role = `${existing.role} / ${role}`;
        }
        continue;
      }
      buckets[category].set(movie.id, {
        movie,
        role,
        creditType: 'crew',
        categoryKey: category,
      });
    }

    return WORK_CATEGORY_META.map((meta) => ({
      key: meta.key,
      label: meta.label,
      items: Array.from(buckets[meta.key].values()).sort(
        (a, b) => b.movie.popularity - a.movie.popularity
      ),
    })).filter((section) => section.items.length > 0);
  }, [person]);
  const featuredWorks = useMemo<FeaturedWork[]>(() => {
    const byMovie = new Map<number, { movie: MovieCredit; roles: Set<string> }>();

    for (const section of categorizedWorks) {
      for (const item of section.items) {
        const existing = byMovie.get(item.movie.id);
        if (!existing) {
          byMovie.set(item.movie.id, {
            movie: item.movie,
            roles: new Set([item.role]),
          });
          continue;
        }
        existing.roles.add(item.role);
      }
    }

    return Array.from(byMovie.values())
      .sort((a, b) => b.movie.popularity - a.movie.popularity)
      .slice(0, 4)
      .map((entry) => ({
        movie: entry.movie,
        role: Array.from(entry.roles).join(' / '),
      }));
  }, [categorizedWorks]);
  const featuredWorkIds = useMemo(
    () => new Set(featuredWorks.map((item) => item.movie.id)),
    [featuredWorks]
  );
  const careerSections = useMemo(
    () =>
      categorizedWorks
        .map((section) => ({
          ...section,
          items: section.items
            .filter((item) => !featuredWorkIds.has(item.movie.id))
            .sort((a, b) => {
              const dateDiff = toTimestamp(b.movie.release_date) - toTimestamp(a.movie.release_date);
              if (dateDiff !== 0) return dateDiff;
              return b.movie.popularity - a.movie.popularity;
            }),
        }))
        .filter((section) => section.items.length > 0),
    [categorizedWorks, featuredWorkIds]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPerson() {
      if (Number.isNaN(personId) || personId <= 0) {
        setError('잘못된 인물 ID입니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/people/${personId}`);
        if (!res.ok) {
          throw new Error('인물 상세 정보를 불러오지 못했습니다.');
        }
        const data = (await res.json()) as PersonDetail;
        if (!isMounted) return;
        setPerson(data);
      } catch (e) {
        if (!isMounted) return;
        const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
        setError(message);
        setPerson(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPerson();

    return () => {
      isMounted = false;
    };
  }, [personId]);

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
          <Link href="/home" className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <h1 className="text-xl font-black tracking-tight" style={{ color: AMBER }}>SceneHive</h1>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="font-medium"
              style={{ borderColor: 'rgba(245,158,11,0.35)', color: 'rgba(245,158,11,0.95)', background: 'rgba(245,158,11,0.08)' }}>
              <Link href="/search" className="inline-flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                통합 검색
              </Link>
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

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            인물 상세 정보를 불러오는 중입니다...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(248,113,113,0.45)', background: 'rgba(127,29,29,0.22)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        {!isLoading && !error && person && (
          <>
            <section className="rounded-2xl border p-6 md:p-8" style={{ borderColor: 'rgba(245,158,11,0.22)', background: PANEL }}>
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-48 h-[320px] shrink-0 rounded-xl overflow-hidden border hidden md:block"
                  style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                  {person.profile_path ? (
                    <img src={imageUrl(person.profile_path, 'w500')} alt={person.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-72 flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      NO IMAGE
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(245,158,11,0.9)' }}>
                    Person Detail
                  </p>
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                    {person.name}
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <Badge text={person.known_for_department || '분야 정보 없음'} />
                    <Badge text={`성별 ${genderText(person.gender)}`} />
                    <Badge text={`Popularity ${person.popularity.toFixed(1)}`} />
                  </div>

                  <p
                    className="mt-5 text-sm md:text-base leading-relaxed whitespace-pre-line max-h-[320px] overflow-y-auto pr-2"
                    style={{ color: 'rgba(255,255,255,0.74)' }}
                  >
                    {person.biography || '소개 정보가 없습니다.'}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <FavoriteToggleButton
                      targetType="PERSON"
                      targetId={person.id}
                      displayName={person.name}
                      imagePath={person.profile_path}
                    />
                    <Button asChild variant="outline"
                      style={{ borderColor: 'rgba(245,158,11,0.35)', color: 'rgba(245,158,11,0.95)', background: 'rgba(245,158,11,0.08)' }}>
                      <Link href="/people">인물 검색으로</Link>
                    </Button>
                    <Button asChild variant="outline"
                      style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}>
                      <Link href="/search">영화 검색</Link>
                    </Button>
                    {(person.imdb_id || person.external_ids?.imdb_id) ? (
                      <Button asChild variant="outline"
                        style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}>
                        <a href={`https://www.imdb.com/name/${person.imdb_id || person.external_ids?.imdb_id}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          IMDb
                        </a>
                      </Button>
                    ) : null}
                    {person.external_ids?.instagram_id ? (
                      <Button asChild variant="outline"
                        style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}>
                        <a href={`https://www.instagram.com/${person.external_ids.instagram_id}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Instagram
                        </a>
                      </Button>
                    ) : null}
                    {person.homepage ? (
                      <Button asChild variant="outline"
                        style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}>
                        <a href={person.homepage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          공식 페이지
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'rgba(245,158,11,0.18)', background: PANEL }}>
              <h3 className="text-lg font-bold text-white mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <InfoRow label="주요 분야" value={person.known_for_department || '정보 없음'} />
                <InfoRow label="생년월일" value={toDate(person.birthday)} />
                <InfoRow label="사망일" value={toDate(person.deathday)} />
                <InfoRow label="출생지" value={person.place_of_birth || '정보 없음'} />
                <InfoRow label="다른 이름" value={person.also_known_as?.slice(0, 3).join(', ') || '정보 없음'} />
              </div>
            </section>

            {featuredWorks.length > 0 ? (
              <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'rgba(245,158,11,0.18)', background: PANEL }}>
                <h3 className="text-lg font-bold text-white mb-2">대표작</h3>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.58)' }}>
                  인기 기준 상위 4개 작품
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {featuredWorks.map((work) => (
                    <Link
                      key={`featured-${work.movie.id}`}
                      href={`/movies/${work.movie.id}`}
                      className="group rounded-lg border p-2 block"
                      style={{ borderColor: 'rgba(245,158,11,0.12)', background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="w-full aspect-[2/3] rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {work.movie.poster_path ? (
                          <img src={imageUrl(work.movie.poster_path, 'w500')} alt={work.movie.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            NO POSTER
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-white mt-2 line-clamp-2">{work.movie.title}</p>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'rgba(255,255,255,0.58)' }}>
                        {work.role}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(245,158,11,0.9)' }}>
                        Popularity {work.movie.popularity.toFixed(1)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {careerSections.length > 0 ? (
              <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'rgba(245,158,11,0.18)', background: PANEL }}>
                <h3 className="text-lg font-bold text-white mb-2">Career</h3>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.58)' }}>
                  최근작 기준 정렬 · 역할별 분류
                </p>
                <div className="space-y-7">
                  {careerSections.map((section) => {
                    const isExpanded = expandedCategories[section.key];
                    const visibleItems = isExpanded ? section.items : section.items.slice(0, 12);
                    return (
                      <div key={section.key}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            {section.label} ({section.items.length})
                          </p>
                          {section.items.length > 12 ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setExpandedCategories((prev) => ({
                                  ...prev,
                                  [section.key]: !prev[section.key],
                                }))
                              }
                              style={{ borderColor: 'rgba(245,158,11,0.35)', color: 'rgba(245,158,11,0.95)', background: 'rgba(245,158,11,0.08)' }}
                            >
                              {isExpanded ? '접기' : `더보기 (${section.items.length - 12}개)`}
                            </Button>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                          {visibleItems.map((work) => (
                            <Link
                              key={`${section.key}-${work.movie.id}-${work.creditType}`}
                              href={`/movies/${work.movie.id}`}
                              className="group rounded-lg border p-2 block"
                              style={{ borderColor: 'rgba(245,158,11,0.12)', background: 'rgba(255,255,255,0.03)' }}
                            >
                              <div className="w-full aspect-[2/3] rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                {work.movie.poster_path ? (
                                  <img src={imageUrl(work.movie.poster_path, 'w500')} alt={work.movie.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    NO POSTER
                                  </div>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-white mt-2 line-clamp-2">{work.movie.title}</p>
                              <p className="text-xs mt-1 line-clamp-2" style={{ color: 'rgba(255,255,255,0.58)' }}>
                                {work.role}
                              </p>
                              <p className="text-xs mt-1" style={{ color: 'rgba(245,158,11,0.9)' }}>
                                {toYear(work.movie.release_date)} · {work.movie.vote_average.toFixed(1)}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  동일 작품이라도 담당 역할 카테고리가 다르면 각 카테고리에 함께 표시됩니다.
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', color: 'rgba(245,158,11,0.92)' }}>
      {text}
    </span>
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
