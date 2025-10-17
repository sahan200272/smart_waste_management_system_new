/**
 * @fileoverview Task Card Component
 * Displays individual collection task information
 */

import React from 'react';
import { 
  ClockIcon, 
  MapPinIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon 
} from '@heroicons/react/24/outline';

const TaskCard = ({ task, onStart, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'InProgress': return 'text-blue-600 bg-blue-100';
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'Skipped': return 'text-orange-600 bg-orange-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircleIcon className="h-5 w-5" />;
      case 'InProgress': return <PlayIcon className="h-5 w-5" />;
      case 'Skipped': return <ExclamationTriangleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-sm font-medium text-gray-900">
              {task.taskNumber}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {getStatusIcon(task.status)}
              <span className="ml-1">{task.status}</span>
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span>{task.binId?.location?.address || 'Location not specified'}</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </div>
          <div className="text-xs text-gray-500">
            {formatTime(task.scheduledDate)}
          </div>
        </div>
      </div>

      {/* Bin Information */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Bin ID:</span>
          <span className="font-medium">{task.binId?._id || 'N/A'}</span>
        </div>
        
        {task.binId?.wasteType && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium">{task.binId.wasteType}</span>
          </div>
        )}
        
        {task.binId?.fillLevel !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Fill Level:</span>
            <span className="font-medium">{task.binId.fillLevel}%</span>
          </div>
        )}
      </div>

      {/* Route Information */}
      {task.route && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Route: {task.route.routeId}</span>
            <span>Stop #{task.route.sequence}</span>
            {task.route.estimatedDuration && (
              <span>~{task.route.estimatedDuration}min</span>
            )}
          </div>
        </div>
      )}

      {/* Progress Info */}
      {task.status === 'InProgress' && task.startTime && (
        <div className="mb-3 text-xs text-blue-600">
          Started at {formatTime(task.startTime)}
          {task.actualDuration && ` • ${task.actualDuration}min elapsed`}
        </div>
      )}

      {/* Skip/Cancellation Reasons */}
      {(task.status === 'Skipped' || task.status === 'Cancelled') && task.skipReasons?.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Reasons:</div>
          <div className="flex flex-wrap gap-1">
            {task.skipReasons.map((reason, index) => (
              <span 
                key={index}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {task.notes && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Notes:</div>
          <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded text-ellipsis overflow-hidden">
            {task.notes.length > 100 ? `${task.notes.substring(0, 100)}...` : task.notes}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <button
          onClick={() => onView?.(task)}
          className="text-sm text-gray-600 hover:text-gray-800 font-medium"
        >
          View Details
        </button>
        
        {task.status === 'Pending' && (
          <button
            onClick={() => onStart?.(task)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlayIcon className="h-4 w-4 mr-1" />
            Start
          </button>
        )}
        
        {task.status === 'InProgress' && (
          <button
            onClick={() => onView?.(task)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;