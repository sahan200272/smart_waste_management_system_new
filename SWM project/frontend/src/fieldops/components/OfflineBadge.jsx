/**
 * @fileoverview OfflineBadge Component
 * Shows online/offline status with sync queue information
 */

import React, { useState, useEffect } from 'react';
import { 
  WifiIcon, 
  ExclamationCircleIcon, 
  ArrowPathIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const OfflineBadge = ({ onSyncRequest }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Load offline queue count from localStorage
    const loadPendingCount = () => {
      try {
        const offlineQueue = JSON.parse(localStorage.getItem('fieldops_offline_queue') || '[]');
        setPendingCount(offlineQueue.length);
      } catch (error) {
        console.error('Error loading offline queue:', error);
        setPendingCount(0);
      }
    };

    // Load last sync time
    const loadLastSync = () => {
      const lastSyncTime = localStorage.getItem('fieldops_last_sync');
      if (lastSyncTime) {
        setLastSync(new Date(lastSyncTime));
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Load initial data
    loadPendingCount();
    loadLastSync();

    // Check periodically for queue updates
    const interval = setInterval(() => {
      loadPendingCount();
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const handleSyncClick = () => {
    if (onSyncRequest && isOnline) {
      onSyncRequest();
      setLastSync(new Date());
      localStorage.setItem('fieldops_last_sync', new Date().toISOString());
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSync) / 1000 / 60);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
        isOnline 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        {/* Status Icon */}
        {isOnline ? (
          <WifiIcon className="h-4 w-4 text-green-600" />
        ) : (
          <ExclamationCircleIcon className="h-4 w-4 text-red-600" />
        )}

        {/* Status Text */}
        <span className={`text-sm font-medium ${
          isOnline ? 'text-green-800' : 'text-red-800'
        }`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>

        {/* Pending Count Badge */}
        {pendingCount > 0 && (
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-3 w-3 text-yellow-600" />
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              {pendingCount} pending
            </span>
          </div>
        )}

        {/* Sync Button */}
        {isOnline && pendingCount > 0 && (
          <button
            onClick={handleSyncClick}
            className="ml-2 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
            title="Sync now"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Last Sync Info */}
      {lastSync && (
        <div className="mt-1 text-right">
          <span className="text-xs text-gray-500">
            Last sync: {formatLastSync()}
          </span>
        </div>
      )}
    </div>
  );
};

export default OfflineBadge;