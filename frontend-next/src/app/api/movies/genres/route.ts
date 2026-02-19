import { NextResponse } from 'next/server';
import { fetchGenres } from '@/lib/tmdb';

export async function GET() {
  try {
    const data = await fetchGenres();
    return NextResponse.json({ genres: data.genres });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
