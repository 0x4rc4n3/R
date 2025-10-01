// ============================================
// FILE: frontend/src/hooks/useAuth.jsx - MINIFIED/SIMPLIFIED
// ============================================
import { useState as uS, useEffect as uE, createContext as cC, useContext as uC } from 'react';
import api from '../utils/api'; // Assuming api is the minified/optimized version

const AC = cC(); // AuthContext

const L = (m, ...a) => console.log(`🔍 ${m}:`, ...a);
const E = (m, ...a) => console.error(`❌ ${m}:`, ...a);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = uS(null);
  const [loading, setLoading] = uS(true);

  const fetchProfile = async () => {
    L('fetchProfile: Starting');
    try {
      const r = await api.auth.getProfile();
      L('fetchProfile: Success');
      setUser(r.data.user);
    } catch (e) {
      E('fetchProfile: Error', e);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  uE(() => {
    L('Provider: Initializing...');
    const t = localStorage.getItem('token');
    L('Provider: Token found?', !!t);
    
    if (t) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    L('LOGIN CALLED', { email, 'passLen': password?.length });
    try {
      // Using the minified API wrapper for cleaner logic
      const data = await api.auth.login(email, password);
      
      L('Login success, storing token');
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (e) {
      E('LOGIN ERROR', e.message);
      return { success: false, error: e.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    L('REGISTER CALLED', userData.email);
    try {
      // Using the minified API wrapper
      const data = await api.auth.register(userData);

      L('Register success, storing token');
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (e) {
      E('REGISTER ERROR', e.message);
      return { success: false, error: e.message || 'Registration failed' };
    }
  };

  const logout = () => {
    L('LOGOUT CALLED');
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = { user, login, register, logout, loading };

  L('Provider render - User/Loading:', !!user, loading);

  return (
    <AC.Provider value={value}>
      {children}
    </AC.Provider>
  );
};

export const useAuth = () => {
  const c = uC(AC);
  if (!c) throw new Error('useAuth must be used within an AuthProvider');
  return c;
};