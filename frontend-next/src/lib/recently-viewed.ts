import type { FavoriteTargetType, RecentlyViewedItemRequest, RecentlyViewedItemResponse } from '@/types';

const STORAGE_KEY = 'scenehive.recentlyViewed.v1';
export const MAX_RECENT_ITEMS = 18;

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

function itemKey(item: Pick<RecentlyViewedItem, 'targetType' | 'targetId'>) {
  return `${item.targetType}:${item.targetId}`;
}

function toTimestamp(viewedAt: string) {
  const timestamp = new Date(viewedAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function mergeRecentlyViewedItems(...groups: RecentlyViewedItem[][]): RecentlyViewedItem[] {
  const byKey = new Map<string, RecentlyViewedItem>();

  for (const item of groups.flat()) {
    if (!isRecentItem(item)) continue;
    const key = itemKey(item);
    const existing = byKey.get(key);
    if (!existing || toTimestamp(item.viewedAt) > toTimestamp(existing.viewedAt)) {
      byKey.set(key, item);
    }
  }

  return Array.from(byKey.values())
    .sort((a, b) => toTimestamp(b.viewedAt) - toTimestamp(a.viewedAt))
    .slice(0, MAX_RECENT_ITEMS);
}

export function getRecentlyViewed(limit = 12): RecentlyViewedItem[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return mergeRecentlyViewedItems(parsed.filter(isRecentItem)).slice(0, limit);
  } catch {
    return [];
  }
}

export function saveRecentlyViewed(items: RecentlyViewedItem[]) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeRecentlyViewedItems(items)));
  } catch {
    // Recent history is an enhancement only; storage failures should not break the app.
  }
}

export function recordRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>): RecentlyViewedItem | null {
  const nextItem: RecentlyViewedItem = {
    ...item,
    viewedAt: new Date().toISOString(),
  };

  if (canUseStorage()) {
    saveRecentlyViewed(mergeRecentlyViewedItems([nextItem], getRecentlyViewed(MAX_RECENT_ITEMS)));
  }

  return nextItem;
}

export function toRecentlyViewedRequest(item: RecentlyViewedItem): RecentlyViewedItemRequest {
  return {
    targetType: item.targetType,
    targetId: item.targetId,
    displayName: item.title,
    imagePath: item.imagePath ?? null,
    genreIds: item.genreIds ?? [],
    subtitle: item.subtitle ?? null,
    href: item.href,
    viewedAt: item.viewedAt,
  };
}

export function fromRecentlyViewedResponse(response: RecentlyViewedItemResponse): RecentlyViewedItem {
  return {
    targetType: response.targetType,
    targetId: response.targetId,
    title: response.displayName,
    imagePath: response.imagePath ?? null,
    genreIds: response.genreIds ?? [],
    subtitle: response.subtitle ?? undefined,
    href: response.href,
    viewedAt: response.viewedAt,
  };
}
