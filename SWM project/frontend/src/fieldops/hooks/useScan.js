/**
 * @fileoverview Basic Scan Hook
 * Simple QR code scanning functionality
 */

import { useState, useCallback } from 'react';

/**
 * Basic scan hook for QR code functionality
 */
export const useScan = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const startScan = useCallback(() => {
    setIsScanning(true);
    setError(null);
  }, []);

  const stopScan = useCallback(() => {
    setIsScanning(false);
  }, []);

  const processScan = useCallback((data) => {
    setScanResult({ success: true, data });
    setIsScanning(false);
  }, []);

  const resetScan = useCallback(() => {
    setIsScanning(false);
    setScanResult(null);
    setError(null);
  }, []);

  // Mock mutation function for compatibility
  const mutate = useCallback((data, callbacks) => {
    setTimeout(() => {
      const result = {
        success: true,
        bin: { id: data, address: 'Mock Location' }
      };
      if (callbacks.onSuccess) callbacks.onSuccess(result);
    }, 1000);
  }, []);

  return {
    isScanning,
    scanResult,
    error,
    startScan,
    stopScan,
    processScan,
    resetScan,
    mutate,
    isLoading: isScanning
  };
};