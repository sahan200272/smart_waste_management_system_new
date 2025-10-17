/**
 * @fileoverview History Page Component
 * Page for viewing collection history and completed tasks
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const History = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  // Mock history data
  const historyItems = [
    {
      id: 1,
      type: 'Collection',
      taskNumber: 'CT-2023-123456',
      location: 'Downtown Park - Bin A1',
      status: 'Completed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      weight: 25.5,
      fillPercentage: 85,
      duration: 8 // minutes
    },
    {
      id: 2,
      type: 'Collection',
      taskNumber: 'CT-2023-123457',
      location: 'Main Street - Bin B2',
      status: 'Completed',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      weight: 18.2,
      fillPercentage: 70,
      duration: 6
    },
    {
      id: 3,
      type: 'Issue Report',
      ticketNumber: 'MT-2023-789012',
      location: 'Shopping Center - Bin C3',
      status: 'Reported',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      priority: 'High',
      issueType: 'Damage'
    },
    {
      id: 4,
      type: 'Collection',
      taskNumber: 'CT-2023-123458',
      location: 'Residential Area - Bin D4',
      status: 'Skipped',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      skipReason: 'Blocked Access'
    },
    {
      id: 5,
      type: 'Collection',
      taskNumber: 'CT-2023-123459',
      location: 'Office Complex - Bin E5',
      status: 'Completed',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      weight: 32.1,
      fillPercentage: 95,
      duration: 12
    }
  ];

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / 1000 / 60 / 60);
    if (hours < 1) return 'Less than 1 hour ago';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Skipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'Reported':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'Skipped':
        return <XCircleIcon className="h-4 w-4 text-yellow-600" />;
      case 'Reported':
        return <ClockIcon className="h-4 w-4 text-blue-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredItems = historyItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'collections') return item.type === 'Collection';
    if (filter === 'issues') return item.type === 'Issue Report';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
          <p className="text-gray-600">View your completed tasks and activities</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <FunnelIcon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          
          {/* Type Filter */}
          <div className="flex space-x-2 mb-4">
            {[
              { key: 'all', label: 'All' },
              { key: 'collections', label: 'Collections' },
              { key: 'issues', label: 'Issues' }
            ].map(option => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === option.key
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="h-4 w-4 text-gray-600" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredItems.filter(item => item.status === 'Completed').length}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredItems.filter(item => item.status === 'Skipped').length}
            </div>
            <div className="text-xs text-gray-600">Skipped</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredItems.filter(item => item.type === 'Issue Report').length}
            </div>
            <div className="text-xs text-gray-600">Issues</div>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(item.status)}
                  <span className="font-medium text-gray-900">
                    {item.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>

              <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                <MapPinIcon className="h-4 w-4" />
                <span>{item.location}</span>
              </div>

              <div className="text-xs text-gray-500 mb-3">
                {item.taskNumber || item.ticketNumber} • {formatDateTime(item.timestamp)}
              </div>

              {/* Collection Details */}
              {item.type === 'Collection' && item.status === 'Completed' && (
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Weight:</span>
                    <div className="font-medium">{item.weight} kg</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Fill:</span>
                    <div className="font-medium">{item.fillPercentage}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <div className="font-medium">{item.duration} min</div>
                  </div>
                </div>
              )}

              {/* Skip Reason */}
              {item.skipReason && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Reason:</span> {item.skipReason}
                </div>
              )}

              {/* Issue Details */}
              {item.type === 'Issue Report' && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Type:</span> {item.issueType} • 
                  <span className="font-medium"> Priority:</span> {item.priority}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No history items found</p>
            <p className="text-sm text-gray-400">Complete some tasks to see them here</p>
          </div>
        )}

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

export default History;