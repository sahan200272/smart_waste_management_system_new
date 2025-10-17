/**
 * @fileoverview Basic Bins Hook
 * Simple bin management functionality
 */

import { useState, useCallback } from 'react';

/**
 * Basic hook for nearby bins functionality
 */
export const useNearbyBins = (location) => {
  const [nearbyBins, setNearbyBins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNearbyBins = useCallback(async () => {
    if (!location) return;
    
    setLoading(true);
    try {
      // Mock data
      const mockBins = [
        {
          id: 'BIN001',
          address: 'Main Street',
          level: 75,
          distance: 150
        }
      ];
      setNearbyBins(mockBins);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location]);

  return {
    nearbyBins,
    loading,
    error,
    fetchNearbyBins
  };
};