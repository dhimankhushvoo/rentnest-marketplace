/**
 * Dynamic Backend & Image URL Helper
 * Uses environment variable in production (e.g. Vercel -> Render)
 * Falls back to http://localhost:5000 in local development
 */
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
};
