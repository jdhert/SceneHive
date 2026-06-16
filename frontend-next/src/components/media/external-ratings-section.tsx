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
    score?: string;
  };
};

function RatingCard({ label, value, description, detail, href, logo, tone }: RatingCardProps) {
  const [score, scale] = value.includes(' / ') ? value.split(' / ') : [value, null];

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span
            className="flex h-12 w-44 max-w-full items-center justify-center overflow-hidden rounded-lg border"
            style={{
              borderColor: `${tone.accent}44`,
              background: tone.logoBackground ?? 'rgba(255,255,255,0.94)',
              backgroundImage: `url("${logo.src}")`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              boxShadow: `0 10px 26px ${tone.shadow}`,
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
      <div className="mt-8">
        <p className="flex items-baseline gap-2">
          <span className="text-5xl font-black leading-none sm:text-6xl" style={{ color: tone.score ?? tone.accent }}>
            {score}
          </span>
          {scale ? (
            <span className="text-xl font-black" style={{ color: 'rgba(255,255,255,0.76)' }}>
              / {scale}
            </span>
          ) : null}
        </p>
        {detail ? (
          <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.42)' }}>
            {detail}
          </p>
        ) : null}
      </div>
    </>
  );

  const className =
    'group block min-h-[242px] rounded-xl border p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60';
  const style = {
    borderColor: tone.border,
    background: tone.background,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 48px ${tone.shadow}`,
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

function metascoreTone(score: number) {
  if (score >= 61) {
    return {
      accent: '#66CC33',
      border: 'rgba(102,204,51,0.34)',
      background:
        'linear-gradient(135deg, rgba(102,204,51,0.16) 0%, rgba(15,23,18,0.74) 42%, rgba(255,255,255,0.035) 100%)',
      shadow: 'rgba(102,204,51,0.08)',
    };
  }

  if (score >= 40) {
    return {
      accent: '#FFCC33',
      border: 'rgba(255,204,51,0.34)',
      background:
        'linear-gradient(135deg, rgba(255,204,51,0.16) 0%, rgba(28,24,12,0.74) 42%, rgba(255,255,255,0.035) 100%)',
      shadow: 'rgba(255,204,51,0.08)',
    };
  }

  return {
    accent: '#FF4A4A',
    border: 'rgba(255,74,74,0.34)',
    background:
      'linear-gradient(135deg, rgba(255,74,74,0.17) 0%, rgba(30,14,18,0.74) 42%, rgba(255,255,255,0.035) 100%)',
    shadow: 'rgba(255,74,74,0.10)',
  };
}

export function ExternalRatingsSection({
  ratings,
}: {
  ratings?: ExternalRatingsPayload | null;
}) {
  if (!ratings?.rotten_tomatoes && !ratings?.imdb && !ratings?.metascore) {
    return null;
  }

  const metacriticTone = ratings.metascore ? metascoreTone(ratings.metascore.value) : null;
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
            tone={{
              accent: '#FA320A',
              border: 'rgba(250,50,10,0.42)',
              background:
                'linear-gradient(145deg, rgba(250,50,10,0.22) 0%, rgba(49,12,13,0.84) 42%, rgba(12,14,22,0.98) 100%)',
              shadow: 'rgba(250,50,10,0.12)',
              score: '#FF4B2F',
            }}
          />
        ) : null}
        {ratings.metascore && metacriticTone ? (
          <RatingCard
            label="Metascore"
            value={`${Math.round(ratings.metascore.value)} / ${ratings.metascore.scale}`}
            description="평론가 평균 점수"
            href={ratings.metascore.url}
            logo={{
              src: '/ratings/metacritic.svg',
              alt: 'Metacritic',
            }}
            tone={metacriticTone}
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
            tone={{
              accent: '#F5C518',
              border: 'rgba(245,197,24,0.36)',
              background:
                'linear-gradient(135deg, rgba(245,197,24,0.18) 0%, rgba(24,22,12,0.74) 42%, rgba(255,255,255,0.035) 100%)',
              shadow: 'rgba(245,197,24,0.08)',
            }}
          />
        ) : null}
      </div>
    </section>
  );
}
