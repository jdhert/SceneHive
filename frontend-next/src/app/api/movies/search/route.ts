import { NextRequest, NextResponse } from 'next/server';
import { fetchSearchMovies } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const pageParam = request.nextUrl.searchParams.get('page');
  const page = pageParam ? Number(pageParam) : 1;

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
    const data = await fetchSearchMovies(query, Number.isNaN(page) ? 1 : page);

    return NextResponse.json({
      query,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: data.results.slice(0, 24),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
