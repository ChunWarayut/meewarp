const ADMIN_SEGMENTS = new Set(['admin']);
const PUBLIC_PATHS = new Set(['tv', 'self-warp', 'warp']);

const fallbackSlug = import.meta.env.VITE_STORE_SLUG ?? 'default';

const getStoreSlugFromSearch = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const byStore = params.get('store') || params.get('storeSlug') || params.get('slug');
  if (byStore && byStore.trim()) {
    return byStore.trim();
  }
  return null;
};

export const getStoreSlugFromLocation = (): string => {
  if (typeof window === 'undefined') {
    return fallbackSlug;
  }

  const fromSearch = getStoreSlugFromSearch();
  if (fromSearch) {
    return fromSearch;
  }

  const segments = window.location.pathname.split('/').filter(Boolean);
  const first = segments[0];

  if (!first || ADMIN_SEGMENTS.has(first) || PUBLIC_PATHS.has(first)) {
    return fallbackSlug;
  }

  return first;
};

export const resolveStoreSlug = (preferred?: string | null | undefined): string => {
  if (preferred && preferred.trim()) {
    return preferred.trim();
  }

  const searchSlug = getStoreSlugFromSearch();
  if (searchSlug) {
    return searchSlug;
  }

  return getStoreSlugFromLocation();
};
