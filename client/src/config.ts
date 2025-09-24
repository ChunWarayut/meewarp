export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const API_ENDPOINTS = {
  createWarpProfile: `${API_BASE_URL}/v1/admin/warp`,
  adminLogin: `${API_BASE_URL}/v1/admin/login`,
  warpProfile: (code: string) => `${API_BASE_URL}/v1/warp/${encodeURIComponent(code)}`,
  topSupporters: `${API_BASE_URL}/v1/leaderboard/top-supporters`,
  leaderboardStream: `${API_BASE_URL}/v1/leaderboard/stream`,
  displayStream: `${API_BASE_URL}/v1/display/stream`,
  displayNext: `${API_BASE_URL}/v1/public/display/next`,
  displayComplete: (id: string) => `${API_BASE_URL}/v1/public/display/${encodeURIComponent(id)}/complete`,
};
