/**
 * @fileoverview Basic Bin Selector Component
 */

import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const BinSelector = ({ bins = [], onSelect, selectedBin }) => {
  if (!bins.length) {
    return (
      <div className="text-center py-8">
        <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No bins found in your area</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Select a Bin</h3>
      
      {bins.map((bin) => (
        <div
          key={bin.id}
          onClick={() => onSelect && onSelect(bin)}
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            selectedBin?.id === bin.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{bin.id}</h4>
              <p className="text-sm text-gray-600">{bin.address}</p>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                {bin.level}% Full
              </span>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {bin.distance}m
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BinSelector;