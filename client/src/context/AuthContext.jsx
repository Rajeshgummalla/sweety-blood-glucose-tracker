import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('sweety_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sweety_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await authApi.getProfile();
        setUser(data.user);
        localStorage.setItem('sweety_user', JSON.stringify(data.user));
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('sweety_token', data.token);
    localStorage.setItem('sweety_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('sweety_token', data.token);
    localStorage.setItem('sweety_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sweety_token');
    localStorage.removeItem('sweety_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
