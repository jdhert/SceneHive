'use client';

import Image from 'next/image';
import { ExternalLink, MonitorPlay, Ticket } from 'lucide-react';

const TMDB_IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
};

export type WatchProviderRegion = {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  ads?: WatchProvider[];
  free?: WatchProvider[];
};

export type WatchProvidersPayload = {
  id: number;
  results: Record<string, WatchProviderRegion>;
};

export type TheatricalStatus = {
  region: string;
  is_now_playing: boolean;
  source: 'tmdb_now_playing';
  checked_pages: number;
  total_pages: number;
};

type ProviderGroupKey = 'flatrate' | 'rent' | 'buy' | 'free' | 'ads';

const PROVIDER_GROUPS: { key: ProviderGroupKey; label: string }[] = [
  { key: 'flatrate', label: '스트리밍' },
  { key: 'rent', label: '대여' },
  { key: 'buy', label: '구매' },
  { key: 'free', label: '무료' },
  { key: 'ads', label: '광고 포함' },
];

const THEATER_BOOKING_LINKS = [
  {
    name: 'CGV',
    href: 'https://cgv.co.kr/cnm/movieBook/movie',
    logoUrl: 'https://img.newsroom.cj.net/wp-content/uploads/2022/07/CI_logo_press_20220328_cgv_W.jpg',
    logoSize: '148px auto',
  },
  {
    name: '롯데시네마',
    href: 'https://www.lottecinema.co.kr/NLCMW/Ticketing?filter=movie',
    logoUrl: 'https://www.lottecinema.co.kr/NLCHS/Content/images/common/logo.png',
    logoSize: '112px auto',
  },
  {
    name: '메가박스',
    href: 'https://www.megabox.co.kr/booking',
    logoUrl: 'https://img.megabox.co.kr/static/pc/images/intro/logo-mega-purple.png',
    logoSize: '104px auto',
  },
];

function providerLogoUrl(path: string | null) {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/w92${path}`;
}

function sortProviders(providers: WatchProvider[] | undefined) {
  return [...(providers ?? [])].sort((a, b) => a.display_priority - b.display_priority);
}

function ProviderCard({ provider, link }: { provider: WatchProvider; link?: string }) {
  const content = (
    <>
      <span
        className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.08)' }}
      >
        {provider.logo_path ? (
          <Image
            src={providerLogoUrl(provider.logo_path)}
            alt=""
            fill
            unoptimized
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <MonitorPlay className="h-4 w-4" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{provider.provider_name}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: 'rgba(191,224,255,0.70)' }}>
          제공처에서 확인
          <ExternalLink className="h-3 w-3" />
        </span>
      </span>
    </>
  );

  const className =
    'flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60';
  const style = {
    borderColor: 'rgba(85,168,255,0.18)',
    background: 'rgba(255,255,255,0.045)',
    color: 'rgba(255,255,255,0.78)',
  };

  if (!link) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }

  return (
    <a href={link} target="_blank" rel="noreferrer" className={className} style={style}>
      {content}
    </a>
  );
}

export function WatchProviderSection({
  providers,
  theatricalStatus,
  theatricalMovieTitle,
  region = 'KR',
}: {
  providers?: WatchProvidersPayload | null;
  theatricalStatus?: TheatricalStatus | null;
  theatricalMovieTitle?: string;
  region?: string;
}) {
  if (!providers && !theatricalStatus?.is_now_playing) return null;

  const regionProviders = providers?.results?.[region];
  const providerGroups = PROVIDER_GROUPS.map((group) => ({
    ...group,
    items: sortProviders(regionProviders?.[group.key]),
  })).filter((group) => group.items.length > 0);
  const isNowPlaying = theatricalStatus?.is_now_playing === true;

  return (
    <section
      className="mt-6 rounded-2xl border p-5"
      style={{ borderColor: 'rgba(85,168,255,0.18)', background: 'rgba(9,13,24,0.58)' }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(85,168,255,0.82)' }}>
            Watch Providers
          </p>
          <h3 className="mt-1 text-lg font-bold text-white">어디서 볼 수 있나요?</h3>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.58)' }}>
            {isNowPlaying ? '한국 기준 극장 상영 및 OTT 제공처 정보입니다.' : '한국 기준 OTT 제공처 정보입니다.'}
          </p>
        </div>
        {regionProviders?.link ? (
          <a
            href={regionProviders.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
            style={{
              borderColor: 'rgba(85,168,255,0.28)',
              background: 'rgba(85,168,255,0.12)',
              color: 'rgba(191,224,255,0.96)',
            }}
          >
            제공처 전체 보기
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>

      {isNowPlaying ? (
        <div
          className="mt-5 rounded-2xl border p-4"
          style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.035)' }}
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
              style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.055)', color: '#BFE0FF' }}
            >
              <Ticket className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-white">한국 극장 상영중</h4>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: 'rgba(85,168,255,0.12)', color: 'rgba(191,224,255,0.86)' }}
                >
                  Now Playing
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
                TMDB 한국 Now Playing 기준입니다. 예매 가능 극장과 시간표는 각 예매처에서 확인해주세요.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {THEATER_BOOKING_LINKS.map((theater) => (
              <a
                key={theater.name}
                href={theater.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${theatricalMovieTitle ?? '이 영화'} ${theater.name} 예매처에서 확인`}
                className="group flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors duration-200 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
                style={{
                  borderColor: 'rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.045)',
                  color: 'rgba(255,255,255,0.90)',
                }}
              >
                <span
                  aria-hidden="true"
                  className="h-10 w-32 shrink-0 overflow-hidden rounded-md border bg-white"
                  style={{
                    borderColor: 'rgba(255,255,255,0.14)',
                    backgroundImage: `url("${theater.logoUrl}")`,
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: theater.logoSize,
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{theater.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.56)' }}>
                    예매처 이동
                  </span>
                </span>
                <ExternalLink
                  className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: 'rgba(255,255,255,0.48)' }}
                />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {providerGroups.length > 0 ? (
        <div className="mt-5 space-y-5">
          {providerGroups.map((group) => (
            <div key={group.key}>
              <h4 className="text-sm font-semibold text-white">{group.label}</h4>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((provider) => (
                  <ProviderCard
                    key={`${group.key}-${provider.provider_id}`}
                    provider={provider}
                    link={regionProviders?.link}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="mt-5 rounded-xl border px-4 py-5 text-sm"
          style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.035)', color: 'rgba(255,255,255,0.62)' }}
        >
          현재 한국 기준 OTT 제공처 정보가 없습니다.
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.46)' }}>
        제공 여부는 지역, 요금제, 시점에 따라 달라질 수 있습니다. 최종 시청 가능 여부는 제공처에서 확인해주세요.
      </p>
    </section>
  );
}
