import 'server-only';

type CacheEntry = {
  expiresAt: number;
  lastAccessedAt: number;
  value: unknown;
};

type CacheOptions = {
  allowStaleOnError?: boolean;
  timeoutMs?: number;
};

type ServerMemoryCacheOptions = {
  maxEntries?: number;
};

export function readPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs?: number) {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Server memory cache loader timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

export function createServerMemoryCache(
  namespace: string,
  options: ServerMemoryCacheOptions = {}
) {
  const entries = new Map<string, CacheEntry>();
  const pending = new Map<string, Promise<unknown>>();
  const maxEntries = Math.max(1, Math.floor(options.maxEntries ?? 300));

  function namespacedKey(key: string) {
    return `${namespace}:${key}`;
  }

  function pruneExpired(now = Date.now()) {
    for (const [key, entry] of Array.from(entries.entries())) {
      if (entry.expiresAt <= now) {
        entries.delete(key);
      }
    }
  }

  function enforceMaxEntries() {
    if (entries.size <= maxEntries) {
      return;
    }

    const removable = Array.from(entries.entries()).sort(
      ([, a], [, b]) => a.lastAccessedAt - b.lastAccessedAt
    );

    while (entries.size > maxEntries && removable.length) {
      const [key] = removable.shift()!;
      entries.delete(key);
    }
  }

  async function getOrLoad<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
    cacheOptions: CacheOptions = {}
  ): Promise<T> {
    if (ttlSeconds <= 0) {
      return loader();
    }

    const cacheKey = namespacedKey(key);
    const now = Date.now();
    const cached = entries.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      cached.lastAccessedAt = now;
      return cached.value as T;
    }

    const alreadyPending = pending.get(cacheKey);
    if (alreadyPending) {
      return alreadyPending as Promise<T>;
    }

    pruneExpired(now);

    const request = withTimeout(loader(), cacheOptions.timeoutMs)
      .then((value) => {
        entries.set(cacheKey, {
          value,
          expiresAt: Date.now() + ttlSeconds * 1000,
          lastAccessedAt: Date.now(),
        });
        enforceMaxEntries();
        return value;
      })
      .catch((error) => {
        if (cacheOptions.allowStaleOnError && cached) {
          cached.lastAccessedAt = Date.now();
          return cached.value as T;
        }

        throw error;
      })
      .finally(() => {
        pending.delete(cacheKey);
      });

    pending.set(cacheKey, request);
    return request;
  }

  function warm<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
    cacheOptions: CacheOptions = {}
  ) {
    const cacheKey = namespacedKey(key);
    const cached = entries.get(cacheKey);

    if ((cached && cached.expiresAt > Date.now()) || pending.has(cacheKey)) {
      return;
    }

    void getOrLoad(key, ttlSeconds, loader, cacheOptions).catch(() => {
      // Background warm-up must never affect the foreground request path.
    });
  }

  return {
    getOrLoad,
    warm,
  };
}

export async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
) {
  const limit = Math.max(1, Math.floor(concurrency));
  let cursor = 0;

  async function runNext() {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await worker(item);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext));
}
