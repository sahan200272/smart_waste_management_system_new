import { request } from './http.js';

/**
 * Payment API Service
 * Handles all payment-related API calls
 */
class PaymentAPI {
  constructor() {
    this.baseUrl = '/api/payments';
  }

  /**
   * Get outstanding bills for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Outstanding bills
   */
  async getOutstandingBills(userId) {
    try {
      const response = await request(`${this.baseUrl}/outstanding/${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetching outstanding bills:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch outstanding bills');
    }
  }

  /**
   * Process payment
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(paymentData) {
    try {
      const response = await request(`${this.baseUrl}/process`, {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      return response;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error(error.response?.data?.error || 'Payment processing failed');
    }
  }

  /**
   * Get payment history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   * @param {number} skip - Number of records to skip
   * @returns {Promise<Object>} Payment history
   */
  async getPaymentHistory(userId, limit = 10, skip = 0) {
    try {
      const response = await request(`${this.baseUrl}/history/${userId}?limit=${limit}&skip=${skip}`);
      return response;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch payment history');
    }
  }

  /**
   * Get payment receipt
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Receipt data
   */
  async getPaymentReceipt(transactionId) {
    try {
      const response = await request(`${this.baseUrl}/receipt/${transactionId}`);
      return response;
    } catch (error) {
      console.error('Error fetching receipt:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch receipt');
    }
  }

  /**
   * Get payment statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Payment statistics
   */
  async getPaymentStats(userId) {
    try {
      const response = await request(`${this.baseUrl}/stats/${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch payment statistics');
    }
  }
}

export default new PaymentAPI();
