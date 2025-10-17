/**
 * Resident Controller
 * Handles HTTP requests for resident operations
 * Integrates with existing PaymentService
 */

import Resident from '../model/Resident.js';
import PaymentService from '../services/PaymentService.js';

class ResidentController {
  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Get demo resident details with outstanding bill
   * GET /api/resident/details
   */
  async getDemoResidentDetails(req, res) {
    try {
      // Use the demo userId that works with your existing payment system
      const demoUserId = 'demo-resident-001';
      
      let resident = await Resident.findByUserId(demoUserId);
      
      // Create demo resident if doesn't exist
      if (!resident) {
        resident = await this.createDemoResident(demoUserId);
      }

      // Get outstanding bills using your existing PaymentService
      const outstandingBills = await this.paymentService.getOutstandingBills(demoUserId);
      
      res.status(200).json({
        success: true,
        message: 'Demo resident details retrieved successfully',
        data: {
          resident: {
            userId: resident.userId,
            name: resident.name,
            address: resident.address,
            email: resident.email,
            contact: resident.contact,
            outstandingAmount: resident.outstandingAmount,
            dueDate: resident.dueDate,
            isOverdue: resident.isOverdue
          },
          outstandingBills: outstandingBills || []
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error in getDemoResidentDetails:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve resident details',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get payment history for resident
   * GET /api/resident/payments/:userId
   */
  async getPaymentHistory(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
          message: 'Missing userId parameter',
          timestamp: new Date().toISOString()
        });
      }
      
      // Use your existing PaymentService method
      const paymentHistory = await this.paymentService.getPaymentHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.status(200).json({
        success: true,
        message: 'Payment history retrieved successfully',
        data: paymentHistory,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment history',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Create demo resident
   */
  async createDemoResident(userId) {
    try {
      const demoData = {
        userId: userId,
        name: 'John Doe',
        address: '123 Green Valley, Colombo 03, Sri Lanka',
        email: 'demo.resident@swms.com',
        contact: '0712345678',
        outstandingAmount: 2500.00,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const resident = new Resident(demoData);
      await resident.save();
      
      console.log('Demo resident created:', resident.userId);
      return resident;
    } catch (error) {
      console.error('Error creating demo resident:', error);
      throw error;
    }
  }

  /**
   * Update resident after successful payment (used internally by PaymentService)
   */
  async updateAfterPayment(userId, paidAmount) {
    try {
      const resident = await Resident.findByUserId(userId);
      
      if (resident) {
        await resident.updateOutstandingAmount(paidAmount);
        return {
          success: true,
          data: {
            userId: resident.userId,
            name: resident.name,
            outstandingAmount: resident.outstandingAmount,
            dueDate: resident.dueDate
          }
        };
      }
      
      return { success: false, message: 'Resident not found' };
    } catch (error) {
      console.error('Error updating resident after payment:', error);
      throw error;
    }
  }

  /**
   * Get resident bill details
   * GET /api/resident/bill/:userId
   */
  async getBillDetails(req, res) {
    try {
      const { userId } = req.params;
      
      const resident = await Resident.findByUserId(userId);
      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Resident not found'
        });
      }

      // Get outstanding bills using existing PaymentService
      const outstandingBills = await this.paymentService.getOutstandingBills(userId);
      
      res.status(200).json({
        success: true,
        message: 'Bill details retrieved successfully',
        data: {
          resident: {
            name: resident.name,
            userId: resident.userId
          },
          bills: outstandingBills,
          totalOutstanding: resident.outstandingAmount,
          dueDate: resident.dueDate,
          isOverdue: resident.isOverdue
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error in getBillDetails:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve bill details',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default ResidentController;