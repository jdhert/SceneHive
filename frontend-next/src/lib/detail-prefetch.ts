'use client';

const prefetchedDetailApiPaths = new Set<string>();

function getDetailApiPath(href: string) {
  try {
    const url = new URL(href, window.location.origin);
    const match = url.pathname.match(/^\/(movies|tv)\/(\d+)$/);
    if (!match) {
      return null;
    }

    const [, type, id] = match;
    return type === 'movies' ? `/api/movies/${id}` : `/api/tv/${id}`;
  } catch {
    return null;
  }
}

export function prefetchMediaDetail(href: string | undefined | null) {
  if (typeof window === 'undefined' || !href) {
    return;
  }

  const apiPath = getDetailApiPath(href);
  if (!apiPath || prefetchedDetailApiPaths.has(apiPath)) {
    return;
  }

  prefetchedDetailApiPaths.add(apiPath);
  fetch(apiPath, {
    cache: 'force-cache',
  }).catch(() => {
    prefetchedDetailApiPaths.delete(apiPath);
  });
}
