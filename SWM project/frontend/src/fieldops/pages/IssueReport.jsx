/**
 * @fileoverview IssueReport Page Component
 * Form for reporting maintenance issues and problems
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ExclamationTriangleIcon,
  CameraIcon,
  MapPinIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { fieldOpsApi } from '../api/fieldOpsApi';

const IssueReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bin } = location.state || {};

  const [report, setReport] = useState({
    type: 'Damage',
    priority: 'Medium',
    description: '',
    location: bin?.location?.name || ''
  });

  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueTypes = [
    'Damage',
    'Overflow',
    'Missing Bin',
    'Blocked Access',
    'Safety Hazard',
    'Vandalism',
    'Other'
  ];

  const priorityLevels = [
    { value: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const handleInputChange = (field, value) => {
    setReport(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit issue report to backend
      const issueData = {
        type: report.type,
        priority: report.priority,
        description: report.description,
        location: report.location,
        binId: bin?.id || null,
        photos: photos.map(photo => photo.url) // In real app, upload photos first
      };

      console.log('Submitting issue data:', issueData);
      console.log('API URL being called:', 'http://localhost:5000/api/fieldops/report-issue');

      const response = await fieldOpsApi.reportIssue(issueData);
      
      console.log('API Response:', response);
      
      if (response.success) {
        // Navigate back to dashboard with success message
        navigate('/fieldops', { 
          state: { 
            message: `Issue reported successfully! Ticket ${response.data.ticketId} created.`,
            type: 'success'
          }
        });
      } else {
        throw new Error(response.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Failed to submit issue report:', error);
      console.error('Error details:', error.message);
      alert('Failed to submit issue report. Please try again.');
      setIsSubmitting(false);
    }
  };

  const addPhoto = () => {
    // Simulate adding a photo
    const newPhoto = {
      id: Date.now(),
      url: `https://via.placeholder.com/150?text=Issue${photos.length + 1}`,
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
          <h1 className="text-2xl font-bold text-gray-900">Report Issue</h1>
          <p className="text-gray-600">Report maintenance issues or problems</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Type */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Issue Type</span>
            </label>
            <select
              value={report.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              {issueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Priority Level */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {priorityLevels.map(priority => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => handleInputChange('priority', priority.value)}
                  className={`p-2 rounded-md text-sm font-medium transition-all ${
                    report.priority === priority.value
                      ? `${priority.color} ring-2 ring-offset-1`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {priority.value}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <MapPinIcon className="h-4 w-4" />
              <span>Location</span>
            </label>
            <input
              type="text"
              value={report.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter location or address"
              required
            />
          </div>

          {/* Description */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={report.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Describe the issue in detail..."
              required
            />
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
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
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
                      alt="Issue photo"
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

          {/* Timestamp Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span>Reported at: {new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
              isSubmitting
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span>Submit Issue Report</span>
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

export default IssueReport;