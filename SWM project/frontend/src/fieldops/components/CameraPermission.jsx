/**
 * @fileoverview Basic Camera Permission Component
 */

import React from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';

const CameraPermission = ({ onGranted, onDenied }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
        <CameraIcon className="h-6 w-6 text-green-600" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Camera Access Required
      </h3>
      
      <p className="text-sm text-gray-600 mb-6">
        We need access to your camera to scan QR codes on bins.
      </p>
      
      <div className="flex space-x-3">
        <button
          onClick={onGranted}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
        >
          Enable Camera
        </button>
        
        {onDenied && (
          <button
            onClick={onDenied}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
          >
            Manual Entry
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraPermission;