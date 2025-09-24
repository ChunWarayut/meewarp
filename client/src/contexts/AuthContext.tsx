import { createContext, ReactNode, useContext, useMemo, useState, useEffect } from 'react';

const TOKEN_STORAGE_KEY = 'warpAdminToken';

export type AuthContextValue = {
  token: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
  isTokenValid: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true; // If we can't parse it, consider it expired
  }
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

  const setToken = (value: string | null) => {
    setTokenState(value);
    if (typeof window === 'undefined') {
      return;
    }

    if (value) {
      localStorage.setItem(TOKEN_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

  const clearToken = () => {
    setToken(null);
  };

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
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({ 
    token, 
    setToken, 
    clearToken, 
    isTokenValid 
  }), [token, isTokenValid]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
