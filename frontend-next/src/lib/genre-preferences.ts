const STORAGE_KEY = 'scenehive.preferredGenres.v1';
export const PREFERRED_GENRE_LIMIT = 3;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeGenreIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value.filter((genreId): genreId is number => Number.isInteger(genreId) && genreId > 0)
    )
  ).slice(0, PREFERRED_GENRE_LIMIT);
}

export function getPreferredGenreIds(): number[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    return normalizeGenreIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function savePreferredGenreIds(genreIds: number[]) {
  if (!canUseStorage()) return;

  const normalized = normalizeGenreIds(genreIds);

  try {
    if (!normalized.length) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Genre preferences only personalize the home page; storage failures should not block browsing.
  }
}
