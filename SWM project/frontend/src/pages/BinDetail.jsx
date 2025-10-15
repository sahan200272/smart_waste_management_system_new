import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useBinsStore from '../store/useBinsStore';
import { binApi, maintenanceApi } from '../api/http';

const BinDetail = () => {
  const { binId } = useParams();
  const navigate = useNavigate();
  const { bins, updateBin } = useBinsStore();
  const [bin, setBin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBin();
  }, [binId]);

  const loadBin = async () => {
    try {
      setLoading(true);
      const binData = await binApi.getById(binId);
      setBin(binData);
    } catch (error) {
      console.error('Error loading bin:', error);
      setError('Failed to load bin details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSegregationDone = async () => {
    try {
      setActionLoading(true);
      const updatedBin = await binApi.markSegregationDone(binId);
      setBin(updatedBin);
      updateBin(updatedBin);
    } catch (error) {
      console.error('Error marking segregation done:', error);
      setError('Failed to mark segregation as done');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    try {
      setActionLoading(true);
      const ticket = await maintenanceApi.create({
        binId: bin.binId,
        reason: 'manual_report',
        priority: bin.level >= 85 ? 'high' : 'medium',
        notes: `Manual ticket created for bin ${bin.binId}`
      });
      console.log('Ticket created:', ticket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('Failed to create maintenance ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok':
        return 'text-green-600 bg-green-100';
      case 'segregation_required':
        return 'text-red-600 bg-red-100';
      case 'maintenance_needed':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelColor = (level) => {
    if (level >= 85) return 'text-red-600';
    if (level >= 70) return 'text-yellow-600';
    if (level >= 50) return 'text-blue-600';
    return 'text-green-600';
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
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bin details...</p>
        </div>
      </div>
    );
  }

  if (error || !bin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Bin not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{bin.binId}</h1>
                <p className="text-gray-600 mt-1">Bin Details</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleCreateTicket}
                disabled={actionLoading}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Creating...' : 'Create Ticket'}
              </button>
              {bin.status === 'segregation_required' && (
                <button
                  onClick={handleMarkSegregationDone}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Mark Segregation Done'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bin Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Bin Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bin.status)}`}>
                  {bin.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Category:</span>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getCategoryIcon(bin.category)}</span>
                  <span className="font-medium">{bin.category}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Mixed Waste:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  bin.mixed ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
                }`}>
                  {bin.mixed ? 'YES' : 'NO'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Seen:</span>
                <span className="font-medium">{formatLastSeen(bin.lastSeenAt)}</span>
              </div>

              {bin.faultCode && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Fault Code:</span>
                  <span className="font-medium text-red-600">{bin.faultCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fill Level */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Fill Level</h2>
            
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - bin.level / 100)}`}
                    className={getLevelColor(bin.level)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${getLevelColor(bin.level)}`}>
                    {bin.level}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fill Level</span>
                  <span className="font-medium">{bin.level}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      bin.level >= 85 ? 'bg-red-500' :
                      bin.level >= 70 ? 'bg-yellow-500' :
                      bin.level >= 50 ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${bin.level}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium">{bin.location?.address || 'Not set'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Latitude:</span>
                <span className="font-medium">{bin.location?.lat?.toFixed(6) || 'N/A'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Longitude:</span>
                <span className="font-medium">{bin.location?.lng?.toFixed(6) || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Actions</h2>
            
            <div className="space-y-4">
              <button
                onClick={handleCreateTicket}
                disabled={actionLoading}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Creating...' : 'Create Maintenance Ticket'}
              </button>
              
              {bin.status === 'segregation_required' && (
                <button
                  onClick={handleMarkSegregationDone}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Mark Segregation Done'}
                </button>
              )}
              
              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinDetail;
