/**
 * API Configuration for HostelSync
 * Live cloud backend on Render: https://hostelsync-backend-o54z.onrender.com
 * Supports override via VITE_API_BASE_URL environment variable if needed.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://hostelsync-backend-o54z.onrender.com').replace(/\/+$/, '');

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
