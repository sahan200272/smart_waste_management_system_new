const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      `Network error: ${error.message}`,
      0,
      error.message
    );
  }
}

// Bin API functions
export const binApi = {
  // Get all bins
  getAll: () => request('/api/bins'),
  
  // Get bin by ID
  getById: (binId) => request(`/api/bins/${binId}`),
  
  // Ingest sensor data
  ingestSensorData: (data) => request('/api/bins/ingest', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Mark segregation as done
  markSegregationDone: (binId) => request(`/api/bins/${binId}/segregation-done`, {
    method: 'PATCH',
  }),
};

// Maintenance API functions
export const maintenanceApi = {
  // Get all tickets
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    
    const queryString = params.toString();
    return request(`/api/maintenance${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get ticket by ID
  getById: (ticketId) => request(`/api/maintenance/${ticketId}`),
  
  // Create ticket
  create: (data) => request('/api/maintenance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Schedule ticket
  schedule: (ticketId, data) => request(`/api/maintenance/${ticketId}/schedule`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  // Close ticket
  close: (ticketId, data = {}) => request(`/api/maintenance/${ticketId}/close`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

// Reports API functions
export const reportsApi = {
  // Submit manual report
  submitManualReport: (data) => request('/api/reports/manual', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Bulk sync
  bulkSync: (data) => request('/api/reports/bulk-sync', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Get notifications
  getNotifications: (userId = 'residents', limit = 50) => 
    request(`/api/reports/notifications?userId=${userId}&limit=${limit}`),
  
  // Mark notification as read
  markAsRead: (notificationId) => request(`/api/reports/notifications/${notificationId}/read`, {
    method: 'PATCH',
  }),
};

// Health check
export const healthApi = {
  check: () => request('/api/health'),
};

export { ApiError };



// Special Collection API functions (using consistent fetch)
export const specialCollectionAPI = {
  // Create new special collection request
  createCollection: async (collectionData) => {
    return request('/api/special-collections', {
      method: 'POST',
      body: JSON.stringify(collectionData),
    });
  },

  // Get all collections with filters
  getCollections: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    
    return request(`/api/special-collections?${params}`);
  },

  // Schedule collection
  scheduleCollection: async (collectionId, truckId) => {
    return request(`/api/special-collections/${collectionId}/schedule`, {
      method: 'PATCH',
      body: JSON.stringify({ truckId }),
    });
  },

  // Optimize routes
  optimizeRoutes: async (date) => {
    return request('/api/special-collections/optimize-routes', {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  },


   // Update collection status
  updateCollectionStatus: async (collectionId, status, actualDuration) => {
    return request(`/api/special-collections/${collectionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actualDuration }),
    });
  },

  // Get statistics
  getStatistics: async (period = 'month') => {
    return request(`/api/special-collections/statistics?period=${period}`);
  }
};