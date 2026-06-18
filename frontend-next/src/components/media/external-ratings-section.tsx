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
    logoBackground?: string;
  };
  scoreTone?: {
    accent: string;
    border: string;
    background: string;
    shadow: string;
  };
};

const RATING_TONES = {
  rottenTomatoes: {
    accent: '#FA320A',
    border: 'rgba(250,50,10,0.42)',
    background:
      'linear-gradient(145deg, rgba(250,50,10,0.12) 0%, rgba(17,18,28,0.78) 46%, rgba(8,11,18,0.94) 100%)',
    shadow: 'rgba(250,50,10,0.10)',
  },
  metacritic: {
    accent: '#F7D13B',
    border: 'rgba(247,209,59,0.34)',
    background:
      'linear-gradient(145deg, rgba(247,209,59,0.10) 0%, rgba(17,18,28,0.78) 46%, rgba(8,11,18,0.94) 100%)',
    shadow: 'rgba(247,209,59,0.08)',
  },
  imdb: {
    accent: '#F5C518',
    border: 'rgba(245,197,24,0.36)',
    background:
      'linear-gradient(145deg, rgba(245,197,24,0.11) 0%, rgba(17,18,28,0.78) 46%, rgba(8,11,18,0.94) 100%)',
    shadow: 'rgba(245,197,24,0.08)',
    logoBackground: '#F5C518',
  },
} satisfies Record<string, RatingCardProps['tone']>;

function scoreToneFromAccent(accent: string): NonNullable<RatingCardProps['scoreTone']> {
  return {
    accent,
    border: `${accent}5C`,
    background: `linear-gradient(135deg, ${accent}22 0%, rgba(255,255,255,0.055) 100%)`,
    shadow: `${accent}18`,
  };
}

function metascoreTone(score: number): NonNullable<RatingCardProps['scoreTone']> {
  if (score >= 61) {
    return scoreToneFromAccent('#66CC33');
  }

  if (score >= 40) {
    return scoreToneFromAccent('#F7D13B');
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
            className="flex h-14 w-48 max-w-full items-center justify-center overflow-hidden rounded-lg border"
            style={{
              borderColor: tone.logoBackground ? `${tone.accent}44` : 'transparent',
              background: tone.logoBackground ?? 'transparent',
              backgroundImage: `url("${logo.src}")`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              boxShadow: tone.logoBackground ? `0 10px 26px ${tone.shadow}` : 'none',
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
        className="mt-6 rounded-2xl border px-4 py-4"
        style={{
          borderColor: activeScoreTone.border,
          background: activeScoreTone.background,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 14px 34px ${activeScoreTone.shadow}`,
        }}
      >
        <p className="flex items-baseline gap-2">
          <span
            className="text-5xl font-black leading-none sm:text-6xl"
            style={{ color: activeScoreTone.accent, textShadow: `0 0 22px ${activeScoreTone.shadow}` }}
          >
            {score}
          </span>
          {scale ? (
            <span className="text-xl font-black" style={{ color: 'rgba(255,255,255,0.82)' }}>
              / {scale}
            </span>
          ) : null}
        </p>
        {detail ? (
          <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.54)' }}>
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
          />
        ) : null}
      </div>
    </section>
  );
}
