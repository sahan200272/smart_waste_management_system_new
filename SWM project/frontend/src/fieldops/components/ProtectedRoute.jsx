/**
 * @fileoverview Protected Route Component
 * Route protection for authenticated field operations
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthCheck } from '../hooks/useAuth.jsx';
import LoadingSpinner from './LoadingSpinner';

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthCheck();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return path
    return (
      <Navigate 
        to="/fieldops/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  return children;
};

export default ProtectedRoute;