import React, { createContext, useState, useEffect } from 'react';
import { loginUser } from '../api/authApi';

export const ROLE_DASHBOARD = {
  patient: '/patient/dashboard',
  doctor:  '/doctor/dashboard',
  admin:   '/admin/dashboard',
};

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on first render.
  useEffect(() => {
    const token      = localStorage.getItem('medeire_token');
    const storedUser = localStorage.getItem('medeire_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('medeire_token');
        localStorage.removeItem('medeire_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await loginUser({ email, password });
    localStorage.setItem('medeire_token', data.token);
    localStorage.setItem('medeire_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // Used by the Google OAuth callback page to inject the token from the URL.
  const loginWithToken = (token, userData) => {
    localStorage.setItem('medeire_token', token);
    localStorage.setItem('medeire_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('medeire_token');
    localStorage.removeItem('medeire_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
