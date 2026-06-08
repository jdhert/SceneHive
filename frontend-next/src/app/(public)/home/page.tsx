import HomeClient from './home-client';
import { fetchHomePayload } from '@/lib/home-data';
import type { HomePayload } from '@/types/home';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let initialData: HomePayload | null = null;
  let initialError: string | null = null;

  try {
    initialData = await fetchHomePayload();
  } catch (error) {
    initialError = error instanceof Error ? error.message : '영화 데이터를 불러오지 못했습니다.';
  }

  return <HomeClient initialData={initialData} initialError={initialError} />;
}
