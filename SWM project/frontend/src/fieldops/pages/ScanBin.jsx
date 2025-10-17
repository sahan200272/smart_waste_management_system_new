/**
 * @fileoverview Bin Scanning Page
 * QR code scanning and manual bin selection interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  QrCodeIcon, 
  CameraIcon, 
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

// Custom hooks
import { useScan } from '../hooks/useScan';
import { useNearbyBins } from '../hooks/useBins';
import { useGeolocation } from '../hooks/useGeolocation';

// Components
import ScanResult from '../components/ScanResult';
import BinSelector from '../components/BinSelector';
import LocationPermission from '../components/LocationPermission';
import CameraPermission from '../components/CameraPermission';

/**
 * Scan Bin Page Component
 * Handles QR code scanning and manual bin selection
 * 
 * Features:
 * - QR code camera scanning
 * - Manual bin ID entry
 * - Nearby bins discovery
 * - Location validation
 * - Scan result feedback
 * - Offline scan queuing
 */
const ScanBin = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [scanMode, setScanMode] = useState('camera'); // 'camera', 'manual', 'nearby'
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scannerRef = useRef(null);
  
  // Custom hooks
  const { mutate: validateScan, isLoading: scanLoading } = useScan();
  const { position, error: locationError, getCurrentPosition } = useGeolocation();
  const { 
    nearbyBins = [], 
    loading: binsLoading 
  } = useNearbyBins(position);

  // Get context from route state
  const routeContext = location.state?.context || 'general';
  const previousRoute = location.state?.from || '/';

  // Camera scanning setup
  useEffect(() => {
    if (scanMode === 'camera' && isScanning) {
      initializeCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [scanMode, isScanning]);

  /**
   * Initialize camera for QR scanning
   */
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        startQRDetection();
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setScanResult({
        success: false,
        error: 'Camera access denied. Please enable camera permissions.',
        retryable: true
      });
    }
  };

  /**
   * Stop camera stream
   */
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  /**
   * Start QR code detection from video stream
   */
  const startQRDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    const detectQR = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = detectQRCode(imageData); // Implement QR detection

        if (qrCode) {
          handleScan(qrCode);
          return;
        }
      }

      if (isScanning) {
        requestAnimationFrame(detectQR);
      }
    };

    detectQR();
  };

  /**
   * Handle scan result from any source
   */
  const handleScan = (qrData) => {
    if (!position?.coords) {
      setScanResult({
        success: false,
        error: 'Location permission required for validation',
        retryable: true
      });
      return;
    }

    const scanData = {
      qrTag: qrData,
      gps: {
        latitude: position?.lat || 0,
        longitude: position?.lng || 0
      },
      taskId,
      context: routeContext
    };

    validateScan(scanData, {
      onSuccess: (result) => {
        setScanResult(result);
        setIsScanning(false);
        
        if (result.success) {
          // Auto-navigate to collection form after successful scan
          setTimeout(() => {
            if (routeContext === 'collection' && result.event) {
              navigate(`/collect/${result.event._id}`);
            } else {
              navigate('/report-issue', { 
                state: { binId: result.bin._id, bin: result.bin } 
              });
            }
          }, 2000);
        }
      },
      onError: (error) => {
        setScanResult({
          success: false,
          error: error.message || 'Scan validation failed',
          retryable: true
        });
        setIsScanning(false);
      }
    });
  };

  /**
   * Handle manual bin ID entry
   */
  const handleManualEntry = () => {
    if (!manualInput.trim()) return;

    const scanData = {
      binId: manualInput.trim(),
      gps: position ? {
        latitude: position.lat || 0,
        longitude: position.lng || 0
      } : null,
      taskId,
      context: routeContext
    };

    validateScan(scanData, {
      onSuccess: handleScan,
      onError: (error) => {
        setScanResult({
          success: false,
          error: error.message || 'Bin ID validation failed',
          retryable: true
        });
      }
    });
  };

  /**
   * Handle nearby bin selection
   */
  const handleBinSelect = (bin) => {
    handleScan(bin.qrTag || bin._id);
  };

  /**
   * Reset scan state for retry
   */
  const resetScan = () => {
    setScanResult(null);
    setManualInput('');
    if (scanMode === 'camera') {
      setIsScanning(true);
    }
  };

  // Location permission check
  if (!position && !locationError) {
    return <LocationPermission onGranted={getCurrentPosition} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(previousRoute)}
              className="p-2 hover:bg-gray-100 rounded-lg mr-3"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Scan Bin</h1>
              <p className="text-sm text-gray-500">
                {routeContext === 'collection' ? 'Scan bin for collection' : 'Scan bin to report issue'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Scan result display */}
        {scanResult && (
          <div className="mb-6">
            <ScanResult
              result={scanResult}
              onRetry={resetScan}
              onContinue={() => {
                if (scanResult.success && scanResult.bin) {
                  navigate('/collect', { 
                    state: { bin: scanResult.bin, task: taskId } 
                  });
                }
              }}
            />
          </div>
        )}

        {/* Scan mode selector */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setScanMode('camera')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'camera'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CameraIcon className="h-4 w-4 inline mr-2" />
              Camera Scan
            </button>
            <button
              onClick={() => setScanMode('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'manual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <QrCodeIcon className="h-4 w-4 inline mr-2" />
              Manual Entry
            </button>
            <button
              onClick={() => setScanMode('nearby')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'nearby'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPinIcon className="h-4 w-4 inline mr-2" />
              Nearby Bins
            </button>
          </div>
        </div>

        {/* Scan interface */}
        <div className="bg-white rounded-lg shadow-sm">
          {scanMode === 'camera' && (
            <div className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Point camera at QR code
                </h3>
                <p className="text-sm text-gray-500">
                  Position the QR code within the frame to scan
                </p>
              </div>

              {/* Camera view */}
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50"></div>
                </div>
              </div>

              {/* Camera controls */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setIsScanning(!isScanning)}
                  disabled={scanLoading}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isScanning
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {scanLoading ? 'Validating...' : isScanning ? 'Stop Scanning' : 'Start Scanning'}
                </button>
              </div>
            </div>
          )}

          {scanMode === 'manual' && (
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Enter Bin ID
                </h3>
                <p className="text-sm text-gray-500">
                  Type the bin identifier manually
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                    placeholder="Enter bin ID (e.g., BIN001)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
                  />
                  <button
                    onClick={handleManualEntry}
                    disabled={!manualInput.trim() || scanLoading}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {scanLoading ? 'Validating...' : 'Validate'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {scanMode === 'nearby' && (
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nearby Bins
                </h3>
                <p className="text-sm text-gray-500">
                  Select a bin from your current location
                </p>
              </div>

              <BinSelector
                bins={nearbyBins}
                loading={binsLoading}
                onSelect={handleBinSelect}
                userLocation={position?.coords}
              />
            </div>
          )}
        </div>

        {/* Location info */}
        {position && (
          <div className="mt-4 text-center text-xs text-gray-500">
            Location: {(position.lat || 0).toFixed(6)}, {(position.lng || 0).toFixed(6)}
            {position.accuracy && ` (±${Math.round(position.accuracy)}m)`}
          </div>
        )}
      </div>
    </div>
  );
};

// Placeholder QR detection function
const detectQRCode = (imageData) => {
  // In a real implementation, use a library like jsQR
  // For now, return null to indicate no QR code detected
  return null;
};

export default ScanBin;