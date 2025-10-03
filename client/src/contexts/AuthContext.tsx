import { createContext, type ReactNode, useContext, useMemo, useState, useEffect, useCallback } from 'react';

const TOKEN_STORAGE_KEY = 'warpAdminToken';

type AdminInfo = {
  email?: string;
  role?: string;
  displayName?: string;
  storeId?: string | null;
  storeName?: string | null;
  storeSlug?: string | null;
};

export type AuthContextValue = {
  token: string | null;
  admin: AdminInfo | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
  isTokenValid: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper function to check if token is expired
type TokenPayload = {
  exp: number;
  email?: string;
  role?: string;
  displayName?: string;
  storeId?: string | null;
  storeName?: string | null;
  storeSlug?: string | null;
};

const decodeToken = (token: string): TokenPayload | null => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload) return true;
  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    // Check if stored token is expired
    if (storedToken && isTokenExpired(storedToken)) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    
    return storedToken;
  });
  const [admin, setAdmin] = useState<AdminInfo | null>(() => {
    if (!token) return null;
    const payload = decodeToken(token);
    if (!payload) return null;
    const { email, role, displayName, storeId, storeName, storeSlug } = payload;
    return { email, role, displayName, storeId, storeName, storeSlug };
  });

  const setToken = useCallback((value: string | null) => {
    setTokenState(value);

    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem(TOKEN_STORAGE_KEY, value);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }

    if (!value) {
      setAdmin(null);
      return;
    }

    const payload = decodeToken(value);
    if (!payload) {
      setAdmin(null);
      return;
    }

    const { email, role, displayName, storeId, storeName, storeSlug } = payload;
    setAdmin({ email, role, displayName, storeId, storeName, storeSlug });
  }, []);

  const clearToken = useCallback(() => {
    setToken(null);
  }, [setToken]);

  const isTokenValid = useMemo(() => {
    if (!token) return false;
    return !isTokenExpired(token);
  }, [token]);

  // Check token validity periodically
  useEffect(() => {
    if (!token) return;

    const checkToken = () => {
      if (isTokenExpired(token)) {
        clearToken();
      }
    };

    // Check every minute
    const interval = setInterval(checkToken, 60000);
    return () => clearInterval(interval);
  }, [token, clearToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      admin,
      setToken,
      clearToken,
      isTokenValid,
    }),
    [token, admin, setToken, clearToken, isTokenValid]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
