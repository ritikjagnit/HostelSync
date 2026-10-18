import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY_TOKEN = 'hostelsync_auth_token';
const STORAGE_KEY_USER = 'hostelsync_auth_user';

/**
 * Token Handling Strategy:
 * Uses in-memory state initialized from sessionStorage.
 * sessionStorage is strictly scoped to the active browser tab/session and is automatically
 * purged when the tab or browser is closed. This prevents long-lived token leakage on
 * shared institutional computers (e.g. polytechnic labs) while surviving page refreshes.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY_TOKEN));
  const [user, setUser] = useState(() => {
    const cachedUser = sessionStorage.getItem(STORAGE_KEY_USER);
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => Boolean(sessionStorage.getItem(STORAGE_KEY_TOKEN)));

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_USER);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;
    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Session expired');
      })
      .then((userData) => {
        if (isMounted) {
          setUser(userData);
          sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
        }
      })
      .catch(() => {
        if (isMounted) {
          logout();
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || (data.status === 401 ? 'Invalid email or password' : 'Authentication failed');
      throw new Error(errorMsg);
    }

    const authToken = data.token;
    const authUser = data.user;

    sessionStorage.setItem(STORAGE_KEY_TOKEN, authToken);
    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authUser));

    setToken(authToken);
    setUser(authUser);

    return authUser;
  };

  const authFetch = useCallback((url, options = {}) => {
    const headers = {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  }, [token]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    logout,
    authFetch
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

