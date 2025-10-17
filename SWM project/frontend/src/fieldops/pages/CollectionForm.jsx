/**
 * @fileoverview CollectionForm Page Component
 * Form for recording collection measurements and completing tasks
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ScaleIcon, 
  ChartBarIcon, 
  CameraIcon, 
  CheckCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const CollectionForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bin, task } = location.state || {};

  const [measurements, setMeasurements] = useState({
    weight: '',
    fillPercentage: '',
    condition: 'Good',
    notes: ''
  });

  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call to record collection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate back to dashboard with success message
      navigate('/fieldops', { 
        state: { 
          message: 'Collection recorded successfully!',
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Failed to record collection:', error);
      setIsSubmitting(false);
    }
  };

  const addPhoto = () => {
    // Simulate adding a photo
    const newPhoto = {
      id: Date.now(),
      url: `https://via.placeholder.com/150?text=Photo${photos.length + 1}`,
      timestamp: new Date()
    };
    setPhotos(prev => [...prev, newPhoto]);
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Record Collection</h1>
          {bin && (
            <p className="text-gray-600">
              Bin: {bin.qrTag || 'Unknown'} • Location: {bin.location?.name || 'Unknown'}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Weight Measurement */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <ScaleIcon className="h-4 w-4" />
              <span>Weight (kg)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1000"
              value={measurements.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter weight in kg"
              required
            />
          </div>

          {/* Fill Percentage */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <ChartBarIcon className="h-4 w-4" />
              <span>Fill Percentage (%)</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={measurements.fillPercentage}
              onChange={(e) => handleInputChange('fillPercentage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter fill percentage"
              required
            />
          </div>

          {/* Bin Condition */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bin Condition
            </label>
            <select
              value={measurements.condition}
              onChange={(e) => handleInputChange('condition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>

          {/* Photos Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <CameraIcon className="h-4 w-4" />
                <span>Photos ({photos.length})</span>
              </label>
              <button
                type="button"
                onClick={addPhoto}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Add Photo
              </button>
            </div>
            
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img 
                      src={photo.url} 
                      alt="Collection photo"
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={measurements.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes about the collection..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
              isSubmitting
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Recording...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                <span>Complete Collection</span>
              </>
            )}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollectionForm;