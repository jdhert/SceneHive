import { redirect } from 'next/navigation';

type GenreRedirectPageProps = {
  params: {
    genreId: string;
  };
  searchParams?: {
    selected?: string | string[];
  };
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeGenreIds(value: string | undefined, fallbackGenreId: string) {
  const source = value?.trim() ? value : fallbackGenreId;
  const genreIds = Array.from(
    new Set(
      source
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  );

  return genreIds.join(',');
}

export default function GenreRedirectPage({ params, searchParams }: GenreRedirectPageProps) {
  const genres = normalizeGenreIds(firstValue(searchParams?.selected), params.genreId);
  const query = new URLSearchParams({ type: 'movie' });

  if (genres) {
    query.set('genres', genres);
  }

  redirect(`/discover?${query.toString()}`);
}
