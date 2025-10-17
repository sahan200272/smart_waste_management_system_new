import PaymentService from '../services/PaymentService.js';

/**
 * Payment Controller - Handles HTTP requests for payment operations
 * Follows Single Responsibility Principle (SRP)
 */
class PaymentController {
  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Get outstanding bills for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getOutstandingBills(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const serviceResult = await this.paymentService.getOutstandingBills(userId);
      const bills = Array.isArray(serviceResult)
        ? serviceResult
        : (serviceResult && serviceResult.bills) || [];

      res.status(200).json({
        success: true,
        data: bills
      });
    } catch (error) {
      console.error('Error fetching outstanding bills:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Process payment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processPayment(req, res) {
    try {
      if (typeof req.body !== 'object' || req.body === null) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data'
        });
      }

      const { userId, amount, paymentMethod, cardDetails } = req.body;
      
      // Validate required fields
      if (!userId || !amount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, amount, paymentMethod'
        });
      }

      const paymentData = {
        userId,
        amount: parseFloat(amount),
        paymentMethod,
        cardDetails
      };

      const result = await this.paymentService.processPayment(paymentData);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.payment,
          message: result.message
        });
      } else {
        const isDeclined = result.error && String(result.error).toLowerCase().includes('declined');
        const isInvalidAmount = result.error && String(result.error).toLowerCase().includes('invalid amount');
        const statusCode = isDeclined ? 402 : 400;
        const responseBody = { success: false, error: result.error };
        res.status(isInvalidAmount ? 400 : statusCode).json(responseBody);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Get payment history for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPaymentHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10, skip = 0 } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const parsedLimit = Number.isFinite(parseInt(limit)) ? parseInt(limit) : 10;
      const parsedSkip = Number.isFinite(parseInt(skip)) ? parseInt(skip) : 0;

      const serviceResult = await this.paymentService.getPaymentHistory(
        userId,
        { limit: parsedLimit, skip: parsedSkip }
      );

      // Support either array or structured result
      const payments = Array.isArray(serviceResult)
        ? serviceResult
        : serviceResult.payments || [];
      const pagination = serviceResult.pagination || {
        limit: parsedLimit,
        skip: parsedSkip,
        total: payments.length
      };
      
      res.status(200).json({
        success: true,
        data: payments,
        pagination
      });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Get payment receipt
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPaymentReceipt(req, res) {
    try {
      const { transactionId } = req.params;
      
      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: 'Transaction ID is required'
        });
      }

      const serviceResult = await this.paymentService.getPaymentReceipt(transactionId);

      // Support both direct receipt object and structured service response
      if (serviceResult && serviceResult.success === false) {
        const statusCode = serviceResult.error === 'Transaction not found' ? 404 : 500;
        return res.status(statusCode).json({ success: false, error: serviceResult.error });
      }

      const receipt = serviceResult && serviceResult.receipt ? serviceResult.receipt : serviceResult;
      res.status(200).json({
        success: true,
        data: receipt
      });
    } catch (error) {
      console.error('Error fetching receipt:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Get payment statistics for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPaymentStats(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // This would typically involve more complex aggregation
      // For now, return basic stats
      const outstandingBills = await this.paymentService.getOutstandingBills(userId);
      const paymentHistory = await this.paymentService.getPaymentHistory(userId, 100, 0);
      
      const stats = {
        totalOutstanding: outstandingBills.reduce((sum, bill) => sum + bill.amount, 0),
        totalPaid: paymentHistory
          .filter(p => p.status === 'SUCCESS')
          .reduce((sum, payment) => sum + payment.amount, 0),
        totalTransactions: paymentHistory.length,
        successfulTransactions: paymentHistory.filter(p => p.status === 'SUCCESS').length,
        failedTransactions: paymentHistory.filter(p => p.status === 'FAILED').length
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment statistics'
      });
    }
  }
}

export default PaymentController;
