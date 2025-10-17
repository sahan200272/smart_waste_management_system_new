import Payment from '../model/Payment.js';
import Resident from '../model/Resident.js';
import { v4 as uuidv4 } from 'uuid';
import MockPaymentGateway from './MockPaymentGateway.js';

/**
 * Payment Service - Handles payment processing logic
 * Follows Single Responsibility Principle (SRP)
 */
class PaymentService {
  constructor() {
    this.paymentGateway = new MockPaymentGateway();
  }

  /**
   * Get outstanding bills for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Outstanding bills
   */
  async getOutstandingBills(userId) {
    try {
      const outstandingBills = await Payment.getOutstandingBills(userId);
      
      // If no outstanding bills, create a mock bill for demonstration
      if (outstandingBills.length === 0) {
        const mockBill = await this.createMockBill(userId);
        return [mockBill];
      }
      
      return outstandingBills;
    } catch (error) {
      console.error('Error fetching outstanding bills:', error);
      throw new Error('Failed to fetch outstanding bills');
    }
  }

  /**
   * Create a mock bill for demonstration purposes
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Mock bill
   */
  async createMockBill(userId) {
    const mockBill = new Payment({
      userId,
      amount: 120.00,
      paymentMethod: 'CREDIT_CARD',
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'PENDING',
      billId: `BILL_${Date.now()}`,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    return await mockBill.save();
  }

  /**
   * Process payment through mock gateway
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(paymentData) {
    const { userId, amount, paymentMethod, cardDetails } = paymentData;
    
    try {
      // Validate payment data
      this.validatePaymentData(paymentData);
      
      // Create payment record
      const payment = new Payment({
        userId,
        amount,
        paymentMethod,
        transactionId: this.generateTransactionId(),
        billId: `BILL_${Date.now()}`,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      await payment.save();

      // Process through mock gateway
      const gatewayResponse = await this.paymentGateway.processPayment({
        transactionId: payment.transactionId,
        amount,
        paymentMethod,
        cardDetails
      });

      // Update payment based on gateway response
      if (gatewayResponse.success) {
        await payment.markAsSuccessful(gatewayResponse);
        
        // Update resident's outstanding amount after successful payment
        try {
          const resident = await Resident.findByUserId(userId);
          if (resident) {
            await resident.updateOutstandingAmount(amount);
            console.log(`Updated resident ${userId} outstanding amount after payment of ${amount}`);
          }
        } catch (residentError) {
          console.error('Error updating resident after payment:', residentError);
          // Don't fail the payment if resident update fails
        }
        
        return {
          success: true,
          payment,
          receiptUrl: payment.receiptUrl,
          message: 'Payment processed successfully'
        };
      } else {
        await payment.markAsFailed(gatewayResponse.reason, gatewayResponse);
        return {
          success: false,
          payment,
          error: gatewayResponse.reason
        };
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Get payment history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   * @param {number} skip - Number of records to skip
   * @returns {Promise<Array>} Payment history
   */
  async getPaymentHistory(userId, limit = 10, skip = 0) {
    try {
      // Support new controller signature where pagination comes as object
      if (typeof limit === 'object' && limit !== null) {
        const { limit: l = 10, skip: s = 0 } = limit;
        const payments = await Payment.getUserPayments(userId, l, s);
        return { success: true, payments, pagination: { limit: l, skip: s, total: payments.length } };
      }
      const payments = await Payment.getUserPayments(userId, limit, skip);
      return payments;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  /**
   * Get payment receipt
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Receipt data
   */
  async getPaymentReceipt(transactionId) {
    try {
      const payment = await Payment.findOne({ transactionId });
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'SUCCESS') {
        throw new Error('Payment not successful');
      }

      return {
        transactionId: payment.transactionId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt,
        receiptUrl: payment.receiptUrl,
        billId: payment.billId
      };
    } catch (error) {
      console.error('Error fetching receipt:', error);
      throw new Error('Failed to fetch receipt');
    }
  }

  /**
   * Validate payment data
   * @param {Object} paymentData - Payment data to validate
   * @throws {Error} If validation fails
   */
  validatePaymentData(paymentData) {
    const { userId, amount, paymentMethod, cardDetails } = paymentData;

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }

    if (!paymentMethod || !['CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING'].includes(paymentMethod)) {
      throw new Error('Valid payment method is required');
    }

    if (paymentMethod !== 'NET_BANKING' && (!cardDetails || !cardDetails.cardNumber)) {
      throw new Error('Card details are required for card payments');
    }
  }

  /**
   * Generate unique transaction ID
   * @returns {string} Transaction ID
   */
  generateTransactionId() {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate credit card number using Luhn algorithm
   * @param {string} cardNumber - Card number to validate
   * @returns {boolean} True if valid
   */
  validateCardNumber(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') return false;
    
    // Remove spaces and non-digits
    const cleaned = cardNumber.replace(/\D/g, '');
    
    // Check length (13-19 digits for most cards)
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Validate expiry date format
   * @param {string} expiryDate - Expiry date in MM/YY format
   * @returns {boolean} True if valid
   */
  validateExpiryDate(expiryDate) {
    if (!expiryDate || typeof expiryDate !== 'string') return false;
    
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(expiryDate)) return false;
    
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const cardYear = parseInt(year);
    const cardMonth = parseInt(month);
    
    if (cardYear < currentYear) return false;
    if (cardYear === currentYear && cardMonth < currentMonth) return false;
    
    return true;
  }

  /**
   * Validate CVV format
   * @param {string} cvv - CVV to validate
   * @returns {boolean} True if valid
   */
  validateCVV(cvv) {
    if (!cvv || typeof cvv !== 'string') return false;
    return /^\d{3,4}$/.test(cvv);
  }

  /**
   * Mask sensitive card number
   * @param {string} cardNumber - Card number to mask
   * @returns {string} Masked card number
   */
  maskCardNumber(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') return '';
    
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 4) return '*'.repeat(cleaned.length);
    
    const lastFour = cleaned.slice(-4);
    const masked = '*'.repeat(cleaned.length - 4);
    return masked + lastFour;
  }

  /**
   * Mask sensitive CVV
   * @param {string} cvv - CVV to mask
   * @returns {string} Masked CVV
   */
  maskCvv(cvv) {
    if (!cvv) return '';
    return '***';
  }

  /**
   * Mask CVV
   * @param {string} cvv - CVV to mask
   * @returns {string} Masked CVV
   */
  maskCVV(cvv) {
    if (!cvv || typeof cvv !== 'string') return '';
    return '*'.repeat(cvv.length);
  }

  /**
   * Format amount to 2 decimal places
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount
   */
  formatAmount(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0.00';
    return amount.toFixed(2);
  }

}

export default PaymentService;
