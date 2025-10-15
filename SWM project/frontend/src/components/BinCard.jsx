import { useNavigate } from 'react-router-dom';

const BinCard = ({ bin }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'segregation_required':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'maintenance_needed':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getLevelColor = (level) => {
    if (level >= 85) return 'bg-red-500';
    if (level >= 70) return 'bg-yellow-500';
    if (level >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'biodegradable':
        return '🍃';
      case 'recyclable':
        return '♻️';
      case 'non_biodegradable':
        return '🗑️';
      default:
        return '📦';
    }
  };

  const formatLastSeen = (lastSeenAt) => {
    const now = new Date();
    const lastSeen = new Date(lastSeenAt);
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleClick = () => {
    navigate(`/bin/${bin.binId}`);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg text-gray-800">{bin.binId}</h3>
        <span className="text-2xl">{getCategoryIcon(bin.category)}</span>
      </div>

      <div className="space-y-2">
        {/* Status Badge */}
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bin.status)}`}>
          {bin.status.replace('_', ' ').toUpperCase()}
        </div>

        {/* Fill Level */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Fill Level</span>
            <span className="font-medium">{bin.level}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getLevelColor(bin.level)}`}
              style={{ width: `${bin.level}%` }}
            />
          </div>
        </div>

        {/* Category */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">Category:</span> {bin.category}
        </div>

        {/* Mixed Waste Indicator */}
        {bin.mixed && (
          <div className="flex items-center text-sm text-red-600">
            <span className="mr-1">⚠️</span>
            Mixed waste detected
          </div>
        )}

        {/* Last Seen */}
        <div className="text-sm text-gray-500">
          Last seen: {formatLastSeen(bin.lastSeenAt)}
        </div>

        {/* Location */}
        <div className="text-sm text-gray-500">
          📍 {bin.location?.address || 'Location not set'}
        </div>
      </div>
    </div>
  );
};

export default BinCard;
