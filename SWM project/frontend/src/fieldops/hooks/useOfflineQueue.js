/**
 * @fileoverview Offline Queue React Hook
 * React hook for accessing offline queue functionality
 */

import { useState, useEffect, useCallback } from 'react';
import offlineQueueManager from '../utils/offlineQueue';

/**
 * Custom hook for offline queue management
 * Provides queue status, operations, and sync functionality
 */
export const useOfflineQueue = () => {
  const [queueStatus, setQueueStatus] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    lastSync: null
  });
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update queue status
  const updateQueueStatus = useCallback(async () => {
    try {
      const status = await offlineQueueManager.getQueueStatus();
      setQueueStatus(status);
    } catch (error) {
      console.error('Failed to get queue status:', error);
    }
  }, []);

  // Queue an operation
  const queueOperation = useCallback(async (operation) => {
    try {
      const id = await offlineQueueManager.queueOperation(operation);
      await updateQueueStatus(); // Refresh status
      return id;
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  }, [updateQueueStatus]);

  // Manually trigger sync
  const syncNow = useCallback(async () => {
    if (isSyncing || !isOnline) return;
    
    setIsSyncing(true);
    try {
      await offlineQueueManager.processPendingOperations();
      await updateQueueStatus();
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, updateQueueStatus]);

  // Clear queue
  const clearQueue = useCallback(async (statusFilter = 'completed') => {
    try {
      const cleared = await offlineQueueManager.clearQueue(statusFilter);
      await updateQueueStatus();
      return cleared;
    } catch (error) {
      console.error('Failed to clear queue:', error);
      throw error;
    }
  }, [updateQueueStatus]);

  // Cache data
  const cacheData = useCallback(async (key, data, category, ttl) => {
    try {
      await offlineQueueManager.cacheData(key, data, category, ttl);
    } catch (error) {
      console.error('Failed to cache data:', error);
      throw error;
    }
  }, []);

  // Get cached data
  const getCachedData = useCallback(async (key) => {
    try {
      return await offlineQueueManager.getCachedData(key);
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }, []);

  // Setup event listeners and periodic updates
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming online
      setTimeout(() => {
        offlineQueueManager.processPendingOperations();
        updateQueueStatus();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status update
    updateQueueStatus();

    // Periodic status updates (every 30 seconds)
    const statusInterval = setInterval(updateQueueStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statusInterval);
    };
  }, [updateQueueStatus]);

  return {
    queueStatus,
    isOnline,
    isSyncing,
    queueOperation,
    syncNow,
    clearQueue,
    cacheData,
    getCachedData
  };
};