/**
 * @fileoverview Authentication Hook for Field Operations
 * Simple authentication state management
 */

import { useState, useEffect, createContext, useContext } from 'react';

// Create Auth Context
const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const stored = localStorage.getItem('fieldops_auth');
        if (stored) {
          const authData = JSON.parse(stored);
          // Check if login is still valid (24 hours)
          const loginTime = new Date(authData.loginTime);
          const now = new Date();
          const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
          
          if (hoursDiff < 24 || authData.rememberMe) {
            setUser({
              employeeId: authData.employeeId,
              loginTime: authData.loginTime
            });
          } else {
            localStorage.removeItem('fieldops_auth');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('fieldops_auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = (employeeId, rememberMe = false) => {
    const authData = {
      employeeId,
      loginTime: new Date().toISOString(),
      rememberMe
    };
    
    localStorage.setItem('fieldops_auth', JSON.stringify(authData));
    setUser({
      employeeId,
      loginTime: authData.loginTime
    });
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('fieldops_auth');
    setUser(null);
  };

  const value = {
    user,
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

/**
 * Authentication Hook
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Simple hook for checking authentication without context
 */
export const useAuthCheck = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const stored = localStorage.getItem('fieldops_auth');
        if (stored) {
          const authData = JSON.parse(stored);
          const loginTime = new Date(authData.loginTime);
          const now = new Date();
          const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
          
          setIsAuthenticated(hoursDiff < 24 || authData.rememberMe);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('fieldops_auth');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isAuthenticated, loading };
};