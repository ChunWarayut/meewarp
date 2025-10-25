import { resolveStoreSlug } from './utils/storeSlug';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const withStoreQuery = (path: string, storeSlug?: string | null) => {
  const slug = resolveStoreSlug(storeSlug);
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}store=${encodeURIComponent(slug)}`;
};

export const API_ENDPOINTS = {
  createWarpProfile: `${API_BASE_URL}/v1/admin/warp`,
  adminLogin: `${API_BASE_URL}/v1/admin/login`,
  warpProfile: (code: string, storeSlug?: string | null) =>
    withStoreQuery(`${API_BASE_URL}/v1/warp/${encodeURIComponent(code)}`, storeSlug),
  topSupporters: (storeSlug?: string | null) =>
    withStoreQuery(`${API_BASE_URL}/v1/leaderboard/top-supporters`, storeSlug),
  leaderboardStream: (storeSlug?: string | null) =>
    withStoreQuery(`${API_BASE_URL}/v1/leaderboard/stream`, storeSlug),
  displayStream: (storeSlug?: string | null) =>
    withStoreQuery(`${API_BASE_URL}/v1/display/stream`, storeSlug),
  displayNext: (storeSlug?: string | null) =>
    withStoreQuery(`${API_BASE_URL}/v1/public/display/next`, storeSlug),
  displayComplete: (id: string, storeSlug?: string | null) =>
    withStoreQuery(`${API_BASE_URL}/v1/public/display/${encodeURIComponent(id)}/complete`, storeSlug),
  publicPackages: (storeSlug?: string | null) =>
    withStoreQuery(`${API_BASE_URL}/v1/public/packages`, storeSlug),
  publicSettings: (storeSlug?: string | null) =>
    withStoreQuery(`${API_BASE_URL}/v1/public/settings`, storeSlug),
  publicTransactions: (storeSlug?: string | null) =>
    withStoreQuery(`${API_BASE_URL}/v1/public/transactions`, storeSlug),
  publicTransactionStatus: (storeSlug?: string | null) =>
    withStoreQuery(`${API_BASE_URL}/v1/public/transactions/check-status`, storeSlug),
  publicPaymentStatusCheck: (storeSlug?: string | null) =>
    withStoreQuery(`${API_BASE_URL}/v1/public/check-payment-status`, storeSlug),
  adminDashboard: `${API_BASE_URL}/v1/admin/dashboard/overview`,
  adminStatistics: `${API_BASE_URL}/v1/admin/statistics`,
  adminCustomers: `${API_BASE_URL}/v1/admin/customers`,
  adminSongRequests: (storeId?: string | null) => 
    storeId ? `${API_BASE_URL}/v1/admin/song-requests?store=${encodeURIComponent(storeId)}` : `${API_BASE_URL}/v1/admin/song-requests`,
  adminOrders: `${API_BASE_URL}/v1/admin/orders`,
  adminSettings: `${API_BASE_URL}/v1/admin/settings`,
  adminPackages: `${API_BASE_URL}/v1/admin/packages`,
  adminUsers: `${API_BASE_URL}/v1/admin/users`,
  adminActivity: `${API_BASE_URL}/v1/transactions/activity-log`,
  adminStores: `${API_BASE_URL}/v1/admin/stores`,
  adminSuperReport: `${API_BASE_URL}/v1/admin/super/reports/overview`,
  adminStoreAccounting: `${API_BASE_URL}/v1/admin/store-accounting`,
  adminStoreAccountingSummary: `${API_BASE_URL}/v1/admin/store-accounting/summary`,
  adminStoreAccountingSettlement: (storeId: string, period?: string) =>
    `${API_BASE_URL}/v1/admin/store-accounting/${storeId}/settlement${period ? `?period=${period}` : ''}`,
  adminStoreAccountingWeeklySettlement: (week?: number, year?: number) =>
    `${API_BASE_URL}/v1/admin/store-accounting/weekly-settlement${week || year ? `?${week ? `week=${week}` : ''}${week && year ? '&' : ''}${year ? `year=${year}` : ''}` : ''}`,
  adminStoreAccountingWeeklySettlementByStore: (storeId: string, week?: number, year?: number) =>
    `${API_BASE_URL}/v1/admin/store-accounting/weekly-settlement/store/${storeId}${week || year ? `?${week ? `week=${week}` : ''}${week && year ? '&' : ''}${year ? `year=${year}` : ''}` : ''}`,
  adminOrdersExport: (format: 'csv' | 'pdf', params: string) =>
    `${API_BASE_URL}/v1/admin/orders?format=${format}${params ? `&${params}` : ''}`,
  authVerify: `${API_BASE_URL}/v1/auth/verify`,
  authLogout: `${API_BASE_URL}/v1/auth/logout`,
};
