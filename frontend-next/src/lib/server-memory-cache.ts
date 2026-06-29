import 'server-only';

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

type CacheOptions = {
  allowStaleOnError?: boolean;
};

export function readPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createServerMemoryCache(namespace: string) {
  const entries = new Map<string, CacheEntry>();
  const pending = new Map<string, Promise<unknown>>();

  function namespacedKey(key: string) {
    return `${namespace}:${key}`;
  }

  function hasFresh(key: string) {
    const cached = entries.get(namespacedKey(key));
    return Boolean(cached && cached.expiresAt > Date.now());
  }

  async function getOrLoad<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cacheKey = namespacedKey(key);
    const now = Date.now();
    const cached = entries.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.value as T;
    }

    const alreadyPending = pending.get(cacheKey);
    if (alreadyPending) {
      return alreadyPending as Promise<T>;
    }

    const request = loader()
      .then((value) => {
        entries.set(cacheKey, {
          value,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
        return value;
      })
      .catch((error) => {
        if (options.allowStaleOnError && cached) {
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
    options: CacheOptions = {}
  ) {
    if (hasFresh(key) || pending.has(namespacedKey(key))) {
      return;
    }

    void getOrLoad(key, ttlSeconds, loader, options).catch(() => {
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
