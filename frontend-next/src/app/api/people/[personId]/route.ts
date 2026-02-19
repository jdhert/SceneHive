import { NextResponse } from 'next/server';
import { fetchPersonDetails } from '@/lib/tmdb';

type RouteContext = {
  params: {
    personId: string;
  };
};

export async function GET(_: Request, { params }: RouteContext) {
  const personId = Number(params.personId);
  if (Number.isNaN(personId) || personId <= 0) {
    return NextResponse.json({ message: 'Invalid person id' }, { status: 400 });
  }

  try {
    const person = await fetchPersonDetails(personId);
    return NextResponse.json(person);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected TMDB error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
