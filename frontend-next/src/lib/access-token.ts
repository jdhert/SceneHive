let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null): void => {
  accessToken = token || null;
  listeners.forEach((listener) => listener(accessToken));
};

export const clearAccessToken = (): void => {
  accessToken = null;
  listeners.forEach((listener) => listener(accessToken));
};

export const subscribeAccessToken = (listener: (token: string | null) => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
