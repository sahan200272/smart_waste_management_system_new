const NotificationCard = ({ notification, onMarkAsRead }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'level':
        return '📊';
      case 'segregation':
        return '⚠️';
      case 'maintenance':
        return '🔧';
      default:
        return '📢';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'level':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'segregation':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead && !notification.read) {
      onMarkAsRead(notification._id);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-all ${
        notification.read ? 'opacity-60' : 'border-l-4 border-l-blue-500'
      }`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-2xl">{getTypeIcon(notification.type)}</span>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(notification.type)}`}>
                {notification.type.toUpperCase()}
              </span>
              {!notification.read && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </div>
            
            <p className="text-gray-800 font-medium mb-1">{notification.message}</p>
            
            <div className="text-sm text-gray-500 space-y-1">
              <div>Bin: {notification.binId}</div>
              <div>User: {notification.userId}</div>
              <div>{formatDate(notification.createdAt)}</div>
            </div>
          </div>
        </div>

        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMarkAsRead();
            }}
            className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            Mark Read
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
