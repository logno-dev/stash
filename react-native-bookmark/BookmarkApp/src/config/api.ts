// API Configuration
export const API_BASE_URL = 'https://stash.bunch.codes';

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  VERIFY: '/api/auth/verify',
  BOOKMARKS: '/api/bookmarks',
  BOOKMARK_BY_ID: (id: string) => `/api/bookmarks/${id}`,
};