/**
 * @fileoverview SyncCenter Page Component
 * Page for managing offline sync and data synchronization
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowPathIcon,
  CloudIcon,
  WifiIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const SyncCenter = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(new Date(Date.now() - 30 * 60 * 1000)); // 30 minutes ago
  
  // Mock pending sync items
  const [pendingItems, setPendingItems] = useState([
    {
      id: 1,
      type: 'Collection',
      description: 'Bin QR_BIN123_LOC_PARK collection completed',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      status: 'pending'
    },
    {
      id: 2,
      type: 'Issue Report',
      description: 'Damage reported at Downtown Location',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      status: 'pending'
    },
    {
      id: 3,
      type: 'Task Update',
      description: 'Task CT-2023-123456 marked as completed',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'synced'
    }
  ]);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) return;

    setSyncStatus('syncing');
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark pending items as synced
      setPendingItems(prev => 
        prev.map(item => 
          item.status === 'pending' 
            ? { ...item, status: 'synced' }
            : item
        )
      );

      setLastSync(new Date());
      setSyncStatus('success');
      
      // Reset status after showing success
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const formatTimeAgo = (date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'synced':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const pendingCount = pendingItems.filter(item => item.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sync Center</h1>
          <p className="text-gray-600">Manage offline data synchronization</p>
        </div>

        {/* Connection Status */}
        <div className={`p-4 rounded-lg mb-6 ${
          isOnline ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <WifiIcon className="h-6 w-6 text-green-600" />
            ) : (
              <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
            )}
            <div>
              <p className={`font-medium ${isOnline ? 'text-green-900' : 'text-red-900'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
              <p className={`text-sm ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
                {isOnline 
                  ? 'Connected to server - data will sync automatically'
                  : 'No internet connection - data will be stored locally'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CloudIcon className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Sync Status</span>
            </div>
            <span className="text-sm text-gray-500">
              Last sync: {formatTimeAgo(lastSync)}
            </span>
          </div>

          {/* Pending Items Count */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending items</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                pendingCount > 0 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {pendingCount} pending
              </span>
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={!isOnline || syncStatus === 'syncing'}
            className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
              !isOnline || syncStatus === 'syncing'
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : syncStatus === 'success'
                ? 'bg-green-600 text-white'
                : syncStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {syncStatus === 'syncing' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Syncing...</span>
              </>
            ) : syncStatus === 'success' ? (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                <span>Sync Complete</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <ExclamationCircleIcon className="h-4 w-4" />
                <span>Sync Failed</span>
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4" />
                <span>Sync Now</span>
              </>
            )}
          </button>
        </div>

        {/* Pending Items List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Recent Activity</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {pendingItems.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {item.type}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : item.status === 'synced'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/fieldops')}
          className="w-full mt-6 py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SyncCenter;