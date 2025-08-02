import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Set axios auth header:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      console.log('Cleared axios auth header');
    }
  }, [token]);

  // Verify token on app start only
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/verify');
          if (response.data.authenticated) {
            setUser(response.data.user);
          } else {
            // Clear invalid token
            setToken(null);
            setUser(null);
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Clear invalid token
          setToken(null);
          setUser(null);
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []); // Only run on mount

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      const { token: newToken, user: userData } = response.data;
      
      console.log('Login successful, setting token and user:', { newToken, userData });
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('authToken', newToken);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};