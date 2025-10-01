// ============================================
// FILE: frontend/src/hooks/useAuth.jsx - FIXED WITH DEBUG LOGGING
// ============================================
import { useState, useEffect, createContext, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 AuthProvider: Initializing...');
    const token = localStorage.getItem('token');
    console.log('🔍 AuthProvider: Token found?', !!token);
    
    if (token) {
      console.log('🔍 AuthProvider: Token exists, fetching profile...');
      fetchUserProfile();
    } else {
      console.log('🔍 AuthProvider: No token, skipping profile fetch');
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    console.log('🔍 fetchUserProfile: Starting...');
    try {
      console.log('🔍 fetchUserProfile: Calling API...');
      const response = await api.auth.getProfile();
      console.log('✅ fetchUserProfile: Success', response);
      setUser(response.data.user);
    } catch (error) {
      console.error('❌ fetchUserProfile: Error', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('🔐 LOGIN FUNCTION CALLED');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password?.length);
    
    try {
      console.log('🔄 Calling api.auth.login...');
      
      // Direct fetch call for debugging
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok?:', response.ok);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      console.log('✅ Login successful, storing token...');
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    console.log('📝 REGISTER FUNCTION CALLED');
    console.log('📦 User data:', userData);
    
    try {
      console.log('🔄 Calling api.auth.register...');
      
      // Direct fetch call for debugging
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      console.log('✅ Registration successful, storing token...');
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      console.error('❌ REGISTER ERROR:', error);
      
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    console.log('🚪 LOGOUT FUNCTION CALLED');
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  console.log('🔍 AuthProvider render - Current user:', user);
  console.log('🔍 AuthProvider render - Loading:', loading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};