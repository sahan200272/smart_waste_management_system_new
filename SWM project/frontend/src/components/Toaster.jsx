import { useState, useEffect } from 'react';

const Toaster = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Listen for bin alerts from socket
    const handleBinAlert = (data) => {
      addToast({
        id: Date.now(),
        type: data.type || 'info',
        message: data.message,
        binId: data.binId,
        timestamp: data.timestamp || new Date()
      });
    };

    // Listen for maintenance updates
    const handleMaintenanceUpdate = (data) => {
      addToast({
        id: Date.now(),
        type: 'maintenance',
        message: `Maintenance ticket ${data.ticketId} updated`,
        binId: data.binId,
        timestamp: new Date()
      });
    };

    // Listen for resident notifications
    const handleNotificationResident = (data) => {
      addToast({
        id: Date.now(),
        type: 'notification',
        message: data.message,
        binId: data.binId,
        timestamp: data.createdAt || new Date()
      });
    };

    // Set up socket listeners
    const socket = window.socketService;
    if (socket) {
      socket.onBinAlert(handleBinAlert);
      socket.onMaintenanceUpdate(handleMaintenanceUpdate);
      socket.onNotificationResident(handleNotificationResident);

      return () => {
        socket.offBinAlert(handleBinAlert);
        socket.offMaintenanceUpdate(handleMaintenanceUpdate);
        socket.offNotificationResident(handleNotificationResident);
      };
    } else {
      console.warn('Socket service not available for toaster');
    }
  }, []);

  const addToast = (toast) => {
    setToasts(prev => [...prev, toast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(toast.id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastStyles = (type) => {
    const baseStyles = 'p-4 rounded-lg shadow-lg border-l-4 mb-2 max-w-sm';
    
    switch (type) {
      case 'segregation':
        return `${baseStyles} bg-red-50 border-red-500 text-red-800`;
      case 'segregation_resolved':
        return `${baseStyles} bg-green-50 border-green-500 text-green-800`;
      case 'maintenance':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'notification':
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
      case 'level':
        return `${baseStyles} bg-orange-50 border-orange-500 text-orange-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-500 text-gray-800`;
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'segregation':
        return '⚠️';
      case 'segregation_resolved':
        return '✅';
      case 'maintenance':
        return '🔧';
      case 'notification':
        return '📢';
      case 'level':
        return '📊';
      default:
        return 'ℹ️';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={getToastStyles(toast.type)}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex items-start">
            <span className="text-lg mr-2">{getToastIcon(toast.type)}</span>
            <div className="flex-1">
              <p className="font-medium text-sm">{toast.message}</p>
              {toast.binId && (
                <p className="text-xs opacity-75 mt-1">Bin: {toast.binId}</p>
              )}
              <p className="text-xs opacity-50 mt-1">
                {new Date(toast.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="ml-2 text-lg opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toaster;
