import { NextResponse } from 'next/server';
import { fetchSearchPeople } from '@/lib/tmdb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() ?? '';
  const page = Number(searchParams.get('page') ?? '1');

  if (!query) {
    return NextResponse.json({ message: 'query is required' }, { status: 400 });
  }

  try {
    const result = await fetchSearchPeople(query, Number.isNaN(page) || page < 1 ? 1 : page);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
