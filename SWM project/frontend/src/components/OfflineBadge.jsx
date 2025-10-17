/**
 * @fileoverview Offline Badge Component
 * Shows online/offline status with sync queue information
 */

import React from 'react';
import { 
  WifiIcon, 
  SignalSlashIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

const OfflineBadge = ({ 
  isOnline = navigator.onLine, 
  queueStatus = { pending: 0, processing: 0, failed: 0 },
  onSync,
  className = "" 
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Show badge when offline or when there are pending operations
    setIsVisible(!isOnline || queueStatus.pending > 0 || queueStatus.failed > 0);
  }, [isOnline, queueStatus]);

  if (!isVisible) return null;

  const getBadgeColor = () => {
    if (!isOnline) return 'bg-red-500 text-white';
    if (queueStatus.failed > 0) return 'bg-orange-500 text-white';
    if (queueStatus.pending > 0) return 'bg-yellow-500 text-black';
    return 'bg-green-500 text-white';
  };

  const getBadgeText = () => {
    if (!isOnline) return 'Offline';
    if (queueStatus.processing > 0) return 'Syncing...';
    if (queueStatus.failed > 0) return `${queueStatus.failed} Failed`;
    if (queueStatus.pending > 0) return `${queueStatus.pending} Pending`;
    return 'Online';
  };

  const getBadgeIcon = () => {
    if (!isOnline) return <SignalSlashIcon className="h-4 w-4" />;
    if (queueStatus.processing > 0) return <ArrowPathIcon className="h-4 w-4 animate-spin" />;
    if (queueStatus.failed > 0) return <ExclamationTriangleIcon className="h-4 w-4" />;
    if (queueStatus.pending > 0) return <ArrowPathIcon className="h-4 w-4" />;
    return <WifiIcon className="h-4 w-4" />;
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div 
        className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium shadow-lg ${getBadgeColor()}`}
      >
        {getBadgeIcon()}
        <span className="ml-2">{getBadgeText()}</span>
        
        {/* Sync button for pending operations */}
        {isOnline && queueStatus.pending > 0 && onSync && (
          <button
            onClick={onSync}
            className="ml-2 p-1 rounded-full hover:bg-black hover:bg-opacity-20 transition-colors"
            title="Sync now"
          >
            <ArrowPathIcon className="h-3 w-3" />
          </button>
        )}
      </div>
      
      {/* Detailed status tooltip */}
      {(queueStatus.pending > 0 || queueStatus.failed > 0) && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
          <div className="font-medium text-gray-900 mb-2">Sync Status</div>
          
          {queueStatus.pending > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Pending:</span>
              <span className="font-medium">{queueStatus.pending}</span>
            </div>
          )}
          
          {queueStatus.processing > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Processing:</span>
              <span className="font-medium">{queueStatus.processing}</span>
            </div>
          )}
          
          {queueStatus.completed > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Completed:</span>
              <span className="font-medium">{queueStatus.completed}</span>
            </div>
          )}
          
          {queueStatus.failed > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Failed:</span>
              <span className="font-medium">{queueStatus.failed}</span>
            </div>
          )}
          
          {!isOnline && (
            <div className="mt-2 text-orange-600 text-xs">
              Operations will sync when connection is restored
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineBadge;