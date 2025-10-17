import fetch from 'node-fetch';

/**
 * Mock Payment Gateway Service
 * Simulates external payment gateway API calls
 * Follows Dependency Inversion Principle (DIP)
 */
class MockPaymentGateway {
  constructor() {
    this.baseUrl = process.env.PAYMENT_GATEWAY_URL || 'https://api.mock-payment-gateway.com';
    this.apiKey = process.env.PAYMENT_GATEWAY_API_KEY || 'mock-api-key-12345';
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Process payment through mock gateway
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Gateway response
   */
  async processPayment(paymentData) {
    try {
      const { transactionId, amount, paymentMethod, cardDetails } = paymentData;
      
      // Simulate network delay (1-3 seconds)
      const delay = Math.random() * 2000 + 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Simulate gateway processing
      const response = await this.callGatewayAPI({
        transactionId,
        amount,
        paymentMethod,
        cardDetails
      });

      return response;
    } catch (error) {
      console.error('Mock gateway error:', error);
      return {
        success: false,
        reason: 'Gateway communication failed',
        error: error.message
      };
    }
  }

  /**
   * Call mock gateway API
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} API response
   */
  async callGatewayAPI(data) {
    try {
      // Simulate API call with realistic response patterns
      const isSuccess = this.determineSuccessRate(data);
      
      if (isSuccess) {
        return {
          success: true,
          transactionId: data.transactionId,
          gatewayTransactionId: `GW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: data.amount,
          currency: 'USD',
          status: 'APPROVED',
          message: 'Payment processed successfully',
          timestamp: new Date().toISOString(),
          gateway: 'MockGateway'
        };
      } else {
        const failureReason = this.getRandomFailureReason();
        return {
          success: false,
          transactionId: data.transactionId,
          reason: failureReason,
          status: 'DECLINED',
          timestamp: new Date().toISOString(),
          gateway: 'MockGateway'
        };
      }
    } catch (error) {
      return {
        success: false,
        reason: 'Gateway timeout or communication error',
        error: error.message
      };
    }
  }

  /**
   * Determine success rate based on payment data
   * @param {Object} data - Payment data
   * @returns {boolean} Success probability
   */
  determineSuccessRate(data) {
    const { amount, paymentMethod, cardDetails } = data;
    
    // Base success rate
    let successRate = 0.8; // 80% base success rate
    
    // Adjust based on amount (higher amounts have lower success rate)
    if (amount > 500) {
      successRate -= 0.1;
    }
    if (amount > 1000) {
      successRate -= 0.1;
    }
    
    // Adjust based on payment method
    if (paymentMethod === 'NET_BANKING') {
      successRate += 0.1; // Net banking has higher success rate
    }
    
    // Adjust based on card details (if provided)
    if (cardDetails && cardDetails.cardNumber) {
      const lastDigit = parseInt(cardDetails.cardNumber.slice(-1));
      if (lastDigit === 0) {
        successRate -= 0.3; // Cards ending in 0 have higher failure rate
      }
    }
    
    return Math.random() < successRate;
  }

  /**
   * Get random failure reason
   * @returns {string} Failure reason
   */
  getRandomFailureReason() {
    const reasons = [
      'Insufficient funds',
      'Card declined by issuer',
      'Invalid card details',
      'Card expired',
      'Daily transaction limit exceeded',
      'Card blocked by issuer',
      'Invalid CVV',
      'Network timeout',
      'Gateway temporarily unavailable',
      'Fraud detection triggered'
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  /**
   * Validate payment data
   * @param {Object} data - Payment data
   * @returns {Object} Validation result
   */
  validatePaymentData(data) {
    const errors = [];
    
    if (!data.transactionId) {
      errors.push('Transaction ID is required');
    }
    
    if (!data.amount || data.amount <= 0) {
      errors.push('Valid amount is required');
    }
    
    if (!data.paymentMethod) {
      errors.push('Payment method is required');
    }
    
    if (data.paymentMethod !== 'NET_BANKING' && !data.cardDetails) {
      errors.push('Card details are required for card payments');
    }
    
    if (data.cardDetails) {
      if (!data.cardDetails.cardNumber || data.cardDetails.cardNumber.length < 13) {
        errors.push('Valid card number is required');
      }
      
      if (!data.cardDetails.expiryDate) {
        errors.push('Card expiry date is required');
      }
      
      if (!data.cardDetails.cvv || data.cardDetails.cvv.length < 3) {
        errors.push('Valid CVV is required');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get payment status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(transactionId) {
    try {
      // Simulate status check
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        transactionId,
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        transactionId,
        status: 'UNKNOWN',
        error: error.message
      };
    }
  }

  /**
   * Check if gateway connection is active
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connected !== false; // Default to true unless explicitly disconnected
  }

  /**
   * Disconnect from gateway
   */
  disconnect() {
    this.connected = false;
  }

  /**
   * Connect to gateway
   */
  connect() {
    this.connected = true;
  }
}

export default MockPaymentGateway;
