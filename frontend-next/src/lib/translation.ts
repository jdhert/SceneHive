import 'server-only';

type TranslationProvider = 'azure';

type TranslationEntry = {
  key: string;
  text: string;
};

type CachedTranslation = {
  value: string;
  expiresAt: number;
};

type AzureTranslationResponse = {
  translations?: {
    text?: string;
    to?: string;
  }[];
}[];

const TRANSLATION_ENABLED = process.env.TRANSLATION_ENABLED === 'true';
const TRANSLATION_PROVIDER = (process.env.TRANSLATION_PROVIDER || 'azure') as TranslationProvider;
const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION;
const AZURE_TRANSLATOR_ENDPOINT =
  process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
const TRANSLATION_CACHE_TTL_SECONDS = Number(
  process.env.TRANSLATION_CACHE_TTL_SECONDS ?? 604800
);
const AZURE_TRANSLATION_BATCH_SIZE = 25;

const translationCache = new Map<string, CachedTranslation>();

function hasText(text: string | null | undefined): text is string {
  return Boolean(text?.trim());
}

function isTranslationConfigured() {
  return (
    TRANSLATION_ENABLED &&
    TRANSLATION_PROVIDER === 'azure' &&
    hasText(AZURE_TRANSLATOR_KEY) &&
    hasText(AZURE_TRANSLATOR_REGION) &&
    hasText(AZURE_TRANSLATOR_ENDPOINT)
  );
}

function textHash(text: string) {
  let hash = 5381;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function makeTranslationCacheKey(
  mediaType: 'movie' | 'tv' | 'search',
  id: number,
  field: 'overview' | 'tagline',
  sourceText: string
) {
  return `tmdb:${mediaType}:${id}:${field}:en-ko:${textHash(sourceText)}`;
}

async function translateWithAzure(texts: string[]) {
  const url = new URL('/translate', AZURE_TRANSLATOR_ENDPOINT);
  url.searchParams.set('api-version', '3.0');
  url.searchParams.set('from', 'en');
  url.searchParams.set('to', 'ko');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY ?? '',
      'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_REGION ?? '',
    },
    body: JSON.stringify(texts.map((text) => ({ text }))),
    next: { revalidate: false },
  });

  if (!response.ok) {
    throw new Error(`Azure Translator request failed: ${response.status}`);
  }

  return response.json() as Promise<AzureTranslationResponse>;
}

export async function translateTextsToKorean(entries: TranslationEntry[]) {
  const now = Date.now();
  const ttlMs = Number.isFinite(TRANSLATION_CACHE_TTL_SECONDS)
    ? TRANSLATION_CACHE_TTL_SECONDS * 1000
    : 604800000;
  const result = new Map<string, string>();
  const pending = new Map<string, TranslationEntry>();

  for (const entry of entries) {
    if (!hasText(entry.text)) {
      continue;
    }

    const cached = translationCache.get(entry.key);
    if (cached && cached.expiresAt > now) {
      result.set(entry.key, cached.value);
      continue;
    }

    if (!pending.has(entry.key)) {
      pending.set(entry.key, entry);
    }
  }

  if (!pending.size || !isTranslationConfigured()) {
    for (const entry of Array.from(pending.values())) {
      result.set(entry.key, entry.text);
    }

    return result;
  }

  for (const batch of chunk(Array.from(pending.values()), AZURE_TRANSLATION_BATCH_SIZE)) {
    try {
      const translated = await translateWithAzure(batch.map((entry) => entry.text));

      batch.forEach((entry, index) => {
        const translatedText = translated[index]?.translations?.[0]?.text?.trim();
        const value = translatedText || entry.text;

        translationCache.set(entry.key, {
          value,
          expiresAt: Date.now() + ttlMs,
        });
        result.set(entry.key, value);
      });
    } catch {
      batch.forEach((entry) => {
        result.set(entry.key, entry.text);
      });
    }
  }

  return result;
}

export async function translateTextToKorean(text: string, key: string) {
  const translated = await translateTextsToKorean([{ key, text }]);
  return translated.get(key) ?? text;
}
