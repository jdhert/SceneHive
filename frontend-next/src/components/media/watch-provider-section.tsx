'use client';

import Image from 'next/image';
import { ExternalLink, MonitorPlay } from 'lucide-react';

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

type ProviderGroupKey = 'flatrate' | 'rent' | 'buy' | 'free' | 'ads';

const PROVIDER_GROUPS: { key: ProviderGroupKey; label: string }[] = [
  { key: 'flatrate', label: '스트리밍' },
  { key: 'rent', label: '대여' },
  { key: 'buy', label: '구매' },
  { key: 'free', label: '무료' },
  { key: 'ads', label: '광고 포함' },
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
  region = 'KR',
}: {
  providers?: WatchProvidersPayload | null;
  region?: string;
}) {
  if (!providers) return null;

  const regionProviders = providers.results?.[region];
  const providerGroups = PROVIDER_GROUPS.map((group) => ({
    ...group,
    items: sortProviders(regionProviders?.[group.key]),
  })).filter((group) => group.items.length > 0);

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
            한국 기준 OTT 제공처 정보입니다.
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
