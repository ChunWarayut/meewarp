import { createContext, type ReactNode, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../config';
import { useAuth } from './AuthContext';

export type StoreSummary = {
  id: string;
  name: string;
  slug: string;
  timezone?: string;
  isActive?: boolean;
};

type RawStore = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  timezone?: string;
  isActive?: boolean;
};

export type StoreContextValue = {
  stores: StoreSummary[];
  selectedStoreId: string | null;
  selectedStore: StoreSummary | null;
  setSelectedStoreId: (storeId: string | null) => void;
  refreshStores: () => Promise<void>;
  locked: boolean;
  loadingStores: boolean;
};

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const STORE_SELECTION_KEY = 'warpAdminSelectedStoreId';

function normalizeStore(store: RawStore | null | undefined): StoreSummary | null {
  if (!store) return null;
  const id = store.id || store._id || null;
  if (!id) return null;
  return {
    id: String(id),
    name: store.name || 'Unnamed Store',
    slug: store.slug || '',
    timezone: store.timezone,
    isActive: typeof store.isActive === 'boolean' ? store.isActive : undefined,
  };
}

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { token, admin } = useAuth();
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [selectedStoreId, setSelectedStoreIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(STORE_SELECTION_KEY);
  });
  const [loadingStores, setLoadingStores] = useState(false);

  const locked = Boolean(admin?.role && admin.role !== 'superadmin');

  const syncSelectedStore = useCallback((value: string | null) => {
    setSelectedStoreIdState(value);
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem(STORE_SELECTION_KEY, value);
      } else {
        localStorage.removeItem(STORE_SELECTION_KEY);
      }
    }
  }, []);

  const refreshStores = useCallback(async () => {
    if (!token || admin?.role !== 'superadmin') {
      return;
    }

    setLoadingStores(true);
    try {
      const response = await fetch(API_ENDPOINTS.adminStores, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load stores');
      }

      const data = (await response.json()) as RawStore[];
      const mapped = data.map((store) => normalizeStore(store)).filter(Boolean) as StoreSummary[];
      setStores(mapped);

      if (mapped.length === 0) {
        syncSelectedStore(null);
        return;
      }

      if (!selectedStoreId || !mapped.some((store) => store.id === selectedStoreId)) {
        syncSelectedStore(mapped[0].id);
      }
    } catch (error) {
      console.error('Failed to load stores', error);
    } finally {
      setLoadingStores(false);
    }
  }, [token, admin?.role, selectedStoreId, syncSelectedStore]);

  // React to admin changes (login/logout)
  useEffect(() => {
    if (!admin) {
      setStores([]);
      syncSelectedStore(null);
      return;
    }

    if (admin.role && admin.role !== 'superadmin') {
      const storeSummary = normalizeStore({
        id: admin.storeId,
        name: admin.storeName,
        slug: admin.storeSlug,
      });
      if (storeSummary) {
        setStores([storeSummary]);
        syncSelectedStore(storeSummary.id);
      } else {
        setStores([]);
        syncSelectedStore(null);
      }
      return;
    }

    // Super admin: load stores list
    refreshStores();
  }, [admin, refreshStores, syncSelectedStore]);

  const setSelectedStoreId = useCallback(
    (value: string | null) => {
      if (locked) {
        return;
      }
      syncSelectedStore(value);
    },
    [locked, syncSelectedStore]
  );

  const selectedStore = useMemo(() => {
    if (!selectedStoreId) {
      return null;
    }
    return stores.find((store) => store.id === selectedStoreId) || null;
  }, [selectedStoreId, stores]);

  const value = useMemo<StoreContextValue>(
    () => ({
      stores,
      selectedStoreId,
      selectedStore,
      setSelectedStoreId,
      refreshStores,
      locked,
      loadingStores,
    }),
    [stores, selectedStoreId, selectedStore, setSelectedStoreId, refreshStores, locked, loadingStores]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used within StoreProvider');
  }
  return context;
};
