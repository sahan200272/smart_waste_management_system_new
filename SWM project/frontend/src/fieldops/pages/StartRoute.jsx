/**
 * @fileoverview StartRoute Page Component
 * Page for starting a collection route
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayIcon, MapIcon, ClockIcon } from '@heroicons/react/24/outline';

const StartRoute = () => {
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Mock route data - in real app, this would come from an API
  const availableRoutes = [
    {
      id: 'route-1',
      name: 'Downtown Route A',
      binCount: 12,
      estimatedDuration: 45,
      priority: 'High'
    },
    {
      id: 'route-2', 
      name: 'Residential Route B',
      binCount: 8,
      estimatedDuration: 30,
      priority: 'Medium'
    }
  ];

  const handleStartRoute = () => {
    if (selectedRoute) {
      // Navigate to scanning page with route info
      navigate('/fieldops/scan', { state: { route: selectedRoute } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Start Route</h1>
          <p className="text-gray-600">Select a route to begin collection</p>
        </div>

        {/* Route Selection */}
        <div className="space-y-4 mb-6">
          {availableRoutes.map((route) => (
            <div
              key={route.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedRoute?.id === route.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedRoute(route)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{route.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  route.priority === 'High' 
                    ? 'bg-red-100 text-red-800'
                    : route.priority === 'Medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {route.priority}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <MapIcon className="h-4 w-4 mr-1" />
                    {route.binCount} bins
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    ~{route.estimatedDuration} min
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartRoute}
          disabled={!selectedRoute}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
            selectedRoute
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <PlayIcon className="h-5 w-5" />
          <span>Start Collection Route</span>
        </button>

        {/* Back to Dashboard */}
        <button
          onClick={() => navigate('/fieldops')}
          className="w-full mt-4 py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default StartRoute;