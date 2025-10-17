/**
 * @fileoverview Basic Scan Result Component
 */

import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ScanResult = ({ result, onRetry, onContinue }) => {
  if (!result) return null;

  const { success, error } = result;

  return (
    <div className={`p-4 rounded-lg border ${success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {success ? (
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          ) : (
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          )}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${success ? 'text-green-800' : 'text-red-800'}`}>
            {success ? 'Scan Successful' : 'Scan Failed'}
          </h3>
          
          {!success && error && (
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          )}
          
          <div className="mt-4 flex space-x-3">
            {success && onContinue && (
              <button
                onClick={onContinue}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
              >
                Continue
              </button>
            )}
            
            {!success && onRetry && (
              <button
                onClick={onRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Retry Scan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResult;