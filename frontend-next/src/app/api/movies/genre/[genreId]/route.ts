import { NextRequest, NextResponse } from 'next/server';
import { fetchGenres, fetchMoviesByGenres } from '@/lib/tmdb';

const APP_PAGE_SIZE = 24;
const TMDB_PAGE_SIZE = 20;

function parseSelectedGenreIds(value: string | null) {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((item) => !Number.isNaN(item) && item > 0)
    )
  );
}

async function fetchGenrePage(genreIds: number[], appPage: number) {
  const offset = (appPage - 1) * APP_PAGE_SIZE;
  const tmdbStartPage = Math.floor(offset / TMDB_PAGE_SIZE) + 1;
  const indexInStartPage = offset % TMDB_PAGE_SIZE;

  const first = await fetchMoviesByGenres(genreIds, tmdbStartPage);
  const needItems = indexInStartPage + APP_PAGE_SIZE;
  const morePages: number[] = [];

  if (needItems > TMDB_PAGE_SIZE && tmdbStartPage + 1 <= first.total_pages) {
    morePages.push(tmdbStartPage + 1);
  }
  if (needItems > TMDB_PAGE_SIZE * 2 && tmdbStartPage + 2 <= first.total_pages) {
    morePages.push(tmdbStartPage + 2);
  }

  const extras = morePages.length
    ? await Promise.all(morePages.map((page) => fetchMoviesByGenres(genreIds, page)))
    : [];

  const merged = [
    ...(first.results ?? []),
    ...extras.flatMap((item) => item.results ?? []),
  ];
  const results = merged.slice(indexInStartPage, indexInStartPage + APP_PAGE_SIZE);

  return {
    page: appPage,
    total_results: first.total_results,
    total_pages: Math.ceil(first.total_results / APP_PAGE_SIZE),
    results,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { genreId: string } }
) {
  const genreId = Number(params.genreId);
  const pageParam = Number(request.nextUrl.searchParams.get('page') ?? '1');
  const selectedParam = request.nextUrl.searchParams.get('selected');
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  if (Number.isNaN(genreId) || genreId <= 0) {
    return NextResponse.json({ message: 'Invalid genreId' }, { status: 400 });
  }

  try {
    const parsedSelected = parseSelectedGenreIds(selectedParam);
    const selectedGenreIds = parsedSelected.length
      ? parsedSelected
      : [genreId];
    const genres = await fetchGenres();
    const movies = await fetchGenrePage(selectedGenreIds, page);
    const selectedGenres = genres.genres.filter((genre) => selectedGenreIds.includes(genre.id));
    const genreName = selectedGenres.find((genre) => genre.id === genreId)?.name ?? null;

    return NextResponse.json({
      genre_id: genreId,
      genre_name: genreName,
      selected_genre_ids: selectedGenreIds,
      selected_genres: selectedGenres,
      page: movies.page,
      total_pages: movies.total_pages,
      total_results: movies.total_results,
      results: movies.results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
