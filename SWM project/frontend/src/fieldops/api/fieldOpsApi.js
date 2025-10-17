/**
 * @fileoverview Field Operations API Client
 * HTTP client for backend communication with error handling and offline support
 */

// In Vite, environment variables are accessed via import.meta.env
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const FIELDOPS_BASE = `${API_BASE}/api/fieldops`;

/**
 * HTTP client with error handling and authentication
 */
class FieldOpsApiClient {
  constructor() {
    this.authToken = null;
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Set authentication token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Make HTTP request with error handling
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${FIELDOPS_BASE}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      // Network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('NetworkError: Please check your internet connection');
      }
      
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url);
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

// Create singleton instance
const apiClient = new FieldOpsApiClient();

/**
 * Field Operations API methods
 */
export const fieldOpsApi = {
  // Tasks
  getTasks: (filters = {}) => apiClient.get('/tasks', filters),
  getTask: (taskId) => apiClient.get(`/tasks/${taskId}`),
  
  // Scanning
  validateScan: (scanData) => apiClient.post('/scan/validate', scanData),
  
  // Collections
  startCollection: (collectionData) => apiClient.post('/collections/start', collectionData),
  recordMeasurement: (measurementData) => apiClient.post('/collections/measure', measurementData),
  completeCollection: (completionData) => apiClient.post('/collections/complete', completionData),
  skipCollection: (skipData) => apiClient.post('/collections/skip', skipData),
  
  // Events
  getEvents: (filters = {}) => apiClient.get('/events', filters),
  getEvent: (eventId) => apiClient.get(`/events/${eventId}`),
  
  // Maintenance tickets
  createTicket: (ticketData) => apiClient.post('/tickets', ticketData),
  getTickets: (filters = {}) => apiClient.get('/tickets', filters),
  getTicket: (ticketId) => apiClient.get(`/tickets/${ticketId}`),
  updateTicketStatus: (updateData) => apiClient.put(`/tickets/${updateData.ticketId}/status`, updateData),
  
  // Issue reporting
  reportIssue: (issueData) => apiClient.post('/report-issue', issueData),
  getTicket: (ticketId) => apiClient.get(`/tickets/${ticketId}`),
  updateTicketStatus: (updateData) => apiClient.put(`/tickets/${updateData.ticketId}/status`, updateData),
  
  // Bins
  getBin: (binId) => apiClient.get(`/bins/${binId}`),
  getNearbyBins: (latitude, longitude, radius = 0.5) => 
    apiClient.get('/bins/nearby', { latitude, longitude, radius }),
  
  // Statistics
  getCollectorStats: (collectorId) => apiClient.get(`/stats/collector/${collectorId}`),
  getDashboardStats: () => apiClient.get('/stats/dashboard'),
  
  // Sync
  bulkSync: (operations) => apiClient.post('/sync/bulk', { operations }),
  getSyncStatus: () => apiClient.get('/sync/status'),
  
  // Utility methods
  uploadPhoto: async (file, context = {}) => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('context', JSON.stringify(context));
    
    return apiClient.request('/upload/photo', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  },
  
  // Health check
  ping: () => apiClient.get('/health')
};

/**
 * Error types for better error handling
 */
export const ApiErrorTypes = {
  NETWORK_ERROR: 'NetworkError',
  VALIDATION_ERROR: 'ValidationError',
  AUTHENTICATION_ERROR: 'AuthenticationError',
  AUTHORIZATION_ERROR: 'AuthorizationError',
  NOT_FOUND_ERROR: 'NotFoundError',
  SERVER_ERROR: 'ServerError'
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error) => {
  return (
    error.message.includes('NetworkError') ||
    error.message.includes('500') ||
    error.message.includes('502') ||
    error.message.includes('503') ||
    error.message.includes('504')
  );
};

/**
 * Extract error type from error message
 */
export const getErrorType = (error) => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network')) return ApiErrorTypes.NETWORK_ERROR;
  if (message.includes('validation')) return ApiErrorTypes.VALIDATION_ERROR;
  if (message.includes('401')) return ApiErrorTypes.AUTHENTICATION_ERROR;
  if (message.includes('403')) return ApiErrorTypes.AUTHORIZATION_ERROR;
  if (message.includes('404')) return ApiErrorTypes.NOT_FOUND_ERROR;
  if (message.includes('500') || message.includes('50')) return ApiErrorTypes.SERVER_ERROR;
  
  return 'UnknownError';
};

export default apiClient;