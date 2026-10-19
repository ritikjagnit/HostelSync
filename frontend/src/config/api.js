/**
 * API Configuration for HostelSync
 * Handles environment-based API base URLs for local dev and cloud deployment (Render, Railway, etc.).
 * Set VITE_API_BASE_URL in Cloudflare Pages (e.g. https://hostelsync-backend.onrender.com)
 * or leave blank for relative local development proxying.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const getApiUrl = (endpoint) => {
  if (!endpoint) return API_BASE_URL;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export default {
  API_BASE_URL,
  getApiUrl
};
