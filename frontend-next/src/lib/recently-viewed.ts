import type { FavoriteTargetType } from '@/types';

const STORAGE_KEY = 'scenehive.recentlyViewed.v1';
const MAX_RECENT_ITEMS = 18;

export type RecentlyViewedItem = {
  targetType: FavoriteTargetType;
  targetId: number;
  title: string;
  imagePath?: string | null;
  genreIds?: number[];
  subtitle?: string;
  href: string;
  viewedAt: string;
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isRecentItem(value: unknown): value is RecentlyViewedItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<RecentlyViewedItem>;
  const hasValidGenreIds =
    item.genreIds === undefined ||
    (Array.isArray(item.genreIds) && item.genreIds.every((genreId) => typeof genreId === 'number'));
  return (
    (item.targetType === 'MOVIE' || item.targetType === 'TV' || item.targetType === 'PERSON') &&
    typeof item.targetId === 'number' &&
    typeof item.title === 'string' &&
    typeof item.href === 'string' &&
    typeof item.viewedAt === 'string' &&
    hasValidGenreIds
  );
}

export function getRecentlyViewed(limit = 12): RecentlyViewedItem[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isRecentItem).slice(0, limit);
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>) {
  if (!canUseStorage()) return;

  const nextItem: RecentlyViewedItem = {
    ...item,
    viewedAt: new Date().toISOString(),
  };

  const current = getRecentlyViewed(MAX_RECENT_ITEMS);
  const deduped = current.filter(
    (stored) => stored.targetType !== nextItem.targetType || stored.targetId !== nextItem.targetId
  );

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([nextItem, ...deduped].slice(0, MAX_RECENT_ITEMS)));
  } catch {
    // Recent history is an enhancement only; storage failures should not break detail pages.
  }
}
