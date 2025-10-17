/**
 * Resident API
 * Handles API calls for resident operations
 * Uses existing http configuration
 */

import { request } from './http.js';

export const residentApi = {
  /**
   * Get demo resident details with outstanding bills
   */
  getDemoResident: async () => {
    try {
      const response = await request('/api/residents/details');
      return response;
    } catch (error) {
      console.error('Error fetching demo resident:', error);
      throw error;
    }
  },

  /**
   * Get payment history for resident
   */
  getPaymentHistory: async (userId, page = 1, limit = 10) => {
    try {
      const response = await request(`/api/residents/payments/${userId}?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  /**
   * Get detailed bill information
   */
  getBillDetails: async (userId) => {
    try {
      const response = await request(`/api/residents/bill/${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetching bill details:', error);
      throw error;
    }
  }
};