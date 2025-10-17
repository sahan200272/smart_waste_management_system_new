/**
 * @fileoverview Basic Location Permission Component
 */

import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const LocationPermission = ({ onGranted }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <MapPinIcon className="h-6 w-6 text-blue-600" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Location Access Required
        </h3>
        
        <p className="text-sm text-gray-600 mb-6">
          We need access to your location to find nearby bins.
        </p>
        
        <button
          onClick={onGranted}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Enable Location Access
        </button>
      </div>
    </div>
  );
};

export default LocationPermission;