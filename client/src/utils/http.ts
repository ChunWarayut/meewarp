export const buildAuthHeaders = (
  token: string | null,
  storeId?: string | null,
  extra: HeadersInit = {}
): HeadersInit => {
  const headers: Record<string, string> = {
    ...Object.entries(extra).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value != null) {
        acc[key] = String(value);
      }
      return acc;
    }, {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (storeId) {
    headers['X-Store-Id'] = storeId;
  }

  return headers;
};
