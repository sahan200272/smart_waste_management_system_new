/**
 * @fileoverview Field Operations Main App Component
 * React Router setup and app shell for field operations module
 */

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Lazy-loaded pages for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const StartRoute = React.lazy(() => import('./pages/StartRoute'));
const ScanBin = React.lazy(() => import('./pages/ScanBin'));
const CollectionForm = React.lazy(() => import('./pages/CollectionForm'));
const IssueReport = React.lazy(() => import('./pages/IssueReport'));
const SyncCenter = React.lazy(() => import('./pages/SyncCenter'));
const History = React.lazy(() => import('./pages/History'));
const Login = React.lazy(() => import('./pages/Login'));

// Components
import LoadingSpinner from './components/LoadingSpinner';
import OfflineBadge from './components/OfflineBadge';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always'
    },
    mutations: {
      retry: 1
    }
  }
});

/**
 * Main Field Operations App Component
 * Provides routing, state management, and app-wide features
 * 
 * Features:
 * - React Router for navigation
 * - React Query for server state management
 * - Error boundaries for graceful error handling
 * - Offline support indicators
 * - Code splitting with lazy loading
 * - Development tools in dev mode
 */
const FieldOpsApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 relative">
        {/* Offline indicator */}
        <OfflineBadge />
        
        {/* Main app content */}
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Login page - public route */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* Collection workflow */}
              <Route path="/start-route" element={
                <ProtectedRoute>
                  <StartRoute />
                </ProtectedRoute>
              } />
              <Route path="/scan/:taskId?" element={
                <ProtectedRoute>
                  <ScanBin />
                </ProtectedRoute>
              } />
              <Route path="/collect/:eventId" element={
                <ProtectedRoute>
                  <CollectionForm />
                </ProtectedRoute>
              } />
              
              {/* Maintenance workflow */}
              <Route path="/report-issue/:binId?" element={
                <ProtectedRoute>
                  <IssueReport />
                </ProtectedRoute>
              } />
              
              {/* Data management */}
              <Route path="/sync" element={
                <ProtectedRoute>
                  <SyncCenter />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/fieldops/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        
        {/* Development tools */}
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </div>
    </QueryClientProvider>
  );
};

export default FieldOpsApp;