import { ExternalLink } from 'lucide-react';

export type ExternalRatingsPayload = {
  imdb_id: string;
  source: 'omdb';
  cached_at: string;
  rotten_tomatoes?: {
    value: number;
    scale: 100;
    url: string;
  } | null;
  imdb?: {
    value: number;
    scale: 10;
    votes: string | null;
    url: string;
  } | null;
  metascore?: {
    value: number;
    scale: 100;
    url: string;
  } | null;
};

type RatingCardProps = {
  label: string;
  value: string;
  description: string;
  detail?: string;
  href?: string;
  logo: {
    src: string;
    alt: string;
  };
  tone: {
    accent: string;
    border: string;
    background: string;
    shadow: string;
    logoSurface: {
      background: string;
      border: string;
      shadow: string;
      backgroundSize?: string;
    };
  };
  scoreTone?: {
    accent: string;
    border: string;
    background: string;
    shadow: string;
    foreground: string;
    mutedForeground: string;
    divider: string;
  };
};

const RATING_TONES = {
  rottenTomatoes: {
    accent: '#FA320A',
    border: 'rgba(250,50,10,0.42)',
    background:
      'linear-gradient(145deg, rgba(250,50,10,0.12) 0%, rgba(17,18,28,0.78) 46%, rgba(8,11,18,0.94) 100%)',
    shadow: 'rgba(250,50,10,0.10)',
    logoSurface: {
      background:
        'linear-gradient(135deg, rgba(255,245,241,0.98) 0%, rgba(255,218,208,0.94) 100%)',
      border: 'rgba(250,50,10,0.34)',
      shadow: 'rgba(250,50,10,0.22)',
      backgroundSize: '82% auto',
    },
  },
  metacritic: {
    accent: '#F7D13B',
    border: 'rgba(247,209,59,0.34)',
    background:
      'linear-gradient(145deg, rgba(247,209,59,0.10) 0%, rgba(17,18,28,0.78) 46%, rgba(8,11,18,0.94) 100%)',
    shadow: 'rgba(247,209,59,0.08)',
    logoSurface: {
      background:
        'linear-gradient(135deg, rgba(7,8,12,0.98) 0%, rgba(27,29,36,0.96) 100%)',
      border: 'rgba(247,209,59,0.34)',
      shadow: 'rgba(247,209,59,0.18)',
      backgroundSize: '82% auto',
    },
  },
  imdb: {
    accent: '#F5C518',
    border: 'rgba(245,197,24,0.36)',
    background:
      'linear-gradient(145deg, rgba(245,197,24,0.11) 0%, rgba(17,18,28,0.78) 46%, rgba(8,11,18,0.94) 100%)',
    shadow: 'rgba(245,197,24,0.08)',
    logoSurface: {
      background: 'linear-gradient(135deg, #F5C518 0%, #FFD84A 100%)',
      border: 'rgba(245,197,24,0.42)',
      shadow: 'rgba(245,197,24,0.22)',
      backgroundSize: '72% auto',
    },
  },
} satisfies Record<string, RatingCardProps['tone']>;

function scoreToneFromAccent(
  accent: string,
  foreground = '#FFFFFF'
): NonNullable<RatingCardProps['scoreTone']> {
  const usesDarkText = foreground !== '#FFFFFF';

  return {
    accent,
    border: `${accent}A8`,
    background: `linear-gradient(135deg, ${accent} 0%, ${accent}E6 54%, ${accent}CC 100%)`,
    shadow: `${accent}32`,
    foreground,
    mutedForeground: usesDarkText ? 'rgba(8,11,18,0.68)' : 'rgba(255,255,255,0.78)',
    divider: usesDarkText ? 'rgba(8,11,18,0.34)' : 'rgba(255,255,255,0.34)',
  };
}

function metascoreTone(score: number): NonNullable<RatingCardProps['scoreTone']> {
  if (score >= 61) {
    return scoreToneFromAccent('#66CC33', '#071007');
  }

  if (score >= 40) {
    return scoreToneFromAccent('#F7D13B', '#101006');
  }

  return scoreToneFromAccent('#FF4A4A');
}

function RatingCard({ label, value, description, detail, href, logo, tone, scoreTone }: RatingCardProps) {
  const [score, scale] = value.includes(' / ') ? value.split(' / ') : [value, null];
  const activeScoreTone = scoreTone ?? scoreToneFromAccent(tone.accent);

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span
            className="flex h-16 w-56 max-w-full items-center justify-center overflow-hidden rounded-xl border"
            style={{
              borderColor: tone.logoSurface.border,
              background: tone.logoSurface.background,
              backgroundImage: `url("${logo.src}")`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: tone.logoSurface.backgroundSize ?? 'contain',
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.24), 0 12px 26px ${tone.logoSurface.shadow}`,
            }}
            role="img"
            aria-label={logo.alt}
          />
          <span className="mt-5 block min-w-0">
            <span className="block truncate text-sm font-bold uppercase tracking-[0.08em] text-white">{label}</span>
            <span className="mt-1 block truncate text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>
              {description}
            </span>
          </span>
        </div>
        {href ? (
          <span
            className="rounded-full border p-2 transition-colors"
            style={{ borderColor: `${tone.accent}42`, background: `${tone.accent}15`, color: tone.accent }}
          >
            <ExternalLink className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div
        className="relative mt-6 overflow-hidden rounded-2xl border px-5 py-4"
        style={{
          borderColor: activeScoreTone.border,
          background: activeScoreTone.background,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.24), 0 16px 38px ${activeScoreTone.shadow}`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-45"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 68%)',
          }}
        />
        <p className="relative flex items-baseline gap-2">
          <span
            className="text-5xl font-black leading-none sm:text-6xl"
            style={{
              color: activeScoreTone.foreground,
              textShadow:
                activeScoreTone.foreground === '#FFFFFF'
                  ? '0 2px 14px rgba(0,0,0,0.24)'
                  : 'none',
            }}
          >
            {score}
          </span>
          {scale ? (
            <span className="text-xl font-black" style={{ color: activeScoreTone.mutedForeground }}>
              / {scale}
            </span>
          ) : null}
        </p>
        {detail ? (
          <p className="relative mt-3 border-t pt-3 text-xs" style={{ borderColor: activeScoreTone.divider, color: activeScoreTone.mutedForeground }}>
            {detail}
          </p>
        ) : null}
      </div>
    </>
  );

  const className =
    'group block min-h-[242px] rounded-xl border p-5 text-left backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60';
  const style = {
    borderColor: tone.border,
    background: tone.background,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 48px ${tone.shadow}`,
  };

  if (!href) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={className} style={style}>
      {content}
    </a>
  );
}

export function ExternalRatingsSection({
  ratings,
}: {
  ratings?: ExternalRatingsPayload | null;
}) {
  if (!ratings?.rotten_tomatoes && !ratings?.imdb && !ratings?.metascore) {
    return null;
  }

  const ratingCardCount = [
    ratings.rotten_tomatoes,
    ratings.metascore,
    ratings.imdb,
  ].filter(Boolean).length;
  const gridClassName = ratingCardCount === 3
      ? 'mt-5 grid grid-cols-1 gap-3 md:grid-cols-3'
      : ratingCardCount === 2
        ? 'mt-5 grid grid-cols-1 gap-3 md:grid-cols-2'
        : 'mt-5 grid grid-cols-1 gap-3 md:grid-cols-1';

  return (
    <section
      className="mt-6 rounded-2xl border p-5"
      style={{ borderColor: 'rgba(85,168,255,0.14)', background: 'rgba(9,13,24,0.58)' }}
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(85,168,255,0.82)' }}>
          Ratings
        </p>
        <h3 className="text-lg font-bold text-white">평점 지표</h3>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.58)' }}>
          평론가 반응과 사용자 평점을 나눠서 확인할 수 있습니다.
        </p>
      </div>

      <div className={gridClassName}>
        {ratings.rotten_tomatoes ? (
          <RatingCard
            label="Rotten Tomatoes"
            value={`${Math.round(ratings.rotten_tomatoes.value)}%`}
            description="Tomatometer %"
            href={ratings.rotten_tomatoes.url}
            logo={{
              src: '/ratings/rottentomatoes.svg',
              alt: 'Rotten Tomatoes',
            }}
            tone={RATING_TONES.rottenTomatoes}
          />
        ) : null}
        {ratings.metascore ? (
          <RatingCard
            label="Metascore"
            value={`${Math.round(ratings.metascore.value)} / ${ratings.metascore.scale}`}
            description="평론가 평균 점수"
            href={ratings.metascore.url}
            logo={{
              src: '/ratings/metacritic.svg',
              alt: 'Metacritic',
            }}
            tone={RATING_TONES.metacritic}
            scoreTone={metascoreTone(ratings.metascore.value)}
          />
        ) : null}
        {ratings.imdb ? (
          <RatingCard
            label="IMDb"
            value={`${ratings.imdb.value.toFixed(1)} / ${ratings.imdb.scale}`}
            description="사용자 평점"
            detail={ratings.imdb.votes ? `${ratings.imdb.votes} votes` : undefined}
            href={ratings.imdb.url}
            logo={{
              src: '/ratings/imdb.svg',
              alt: 'IMDb',
            }}
            tone={RATING_TONES.imdb}
            scoreTone={scoreToneFromAccent(RATING_TONES.imdb.accent, '#0A0B10')}
          />
        ) : null}
      </div>
    </section>
  );
}
