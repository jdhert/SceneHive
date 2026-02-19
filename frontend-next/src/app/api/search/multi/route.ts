import { NextRequest, NextResponse } from 'next/server';
import { fetchSearchMulti } from '@/lib/tmdb';

const CLIENT_PAGE_SIZE = 24;
const TMDB_PAGE_SIZE = 20;

function isSupportedMediaType(mediaType: string | undefined): mediaType is 'movie' | 'person' | 'tv' {
  return mediaType === 'movie' || mediaType === 'person' || mediaType === 'tv';
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const pageParam = request.nextUrl.searchParams.get('page');
  const requestedPage = pageParam ? Number(pageParam) : 1;
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

  if (query.length < 2) {
    return NextResponse.json({
      query,
      page: 1,
      total_pages: 0,
      total_results: 0,
      results: [],
    });
  }

  try {
    const startIndex = (page - 1) * CLIENT_PAGE_SIZE;
    const endIndexExclusive = startIndex + CLIENT_PAGE_SIZE;
    const startTmdbPage = Math.floor(startIndex / TMDB_PAGE_SIZE) + 1;
    const endTmdbPage = Math.floor((endIndexExclusive - 1) / TMDB_PAGE_SIZE) + 1;
    const tmdbPages = Array.from(
      { length: endTmdbPage - startTmdbPage + 1 },
      (_, index) => startTmdbPage + index
    );

    const responses = await Promise.all(tmdbPages.map((tmdbPage) => fetchSearchMulti(query, tmdbPage)));
    const firstResponse = responses[0];

    const combined = responses.flatMap((response) =>
      (response.results ?? []).filter((item) => isSupportedMediaType(item.media_type))
    );

    const localStart = startIndex - (startTmdbPage - 1) * TMDB_PAGE_SIZE;
    const results = combined.slice(localStart, localStart + CLIENT_PAGE_SIZE);
    const totalResults = firstResponse?.total_results ?? 0;
    const totalPages = Math.ceil(totalResults / CLIENT_PAGE_SIZE);

    return NextResponse.json({
      query,
      page,
      total_pages: totalPages,
      total_results: totalResults,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
