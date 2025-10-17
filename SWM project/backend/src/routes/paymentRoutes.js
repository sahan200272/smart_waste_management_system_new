import express from 'express';
import PaymentController from '../controllers/paymentController.js';

const router = express.Router();
let paymentController;

/**
 * Set payment controller instance
 * @param {PaymentController} controller - Payment controller instance
 */
export const setPaymentController = (controller) => {
  paymentController = controller;
};

/**
 * GET /api/payments/outstanding/:userId
 * Get outstanding bills for a user
 */
router.get('/outstanding/:userId', async (req, res) => {
  if (!paymentController) {
    return res.status(500).json({
      success: false,
      error: 'Payment controller not initialized'
    });
  }
  await paymentController.getOutstandingBills(req, res);
});

/**
 * POST /api/payments/process
 * Process a payment
 */
router.post('/process', async (req, res) => {
  if (!paymentController) {
    return res.status(500).json({
      success: false,
      error: 'Payment controller not initialized'
    });
  }
  await paymentController.processPayment(req, res);
});

/**
 * GET /api/payments/history/:userId
 * Get payment history for a user
 */
router.get('/history/:userId', async (req, res) => {
  if (!paymentController) {
    return res.status(500).json({
      success: false,
      error: 'Payment controller not initialized'
    });
  }
  await paymentController.getPaymentHistory(req, res);
});

/**
 * GET /api/payments/receipt/:transactionId
 * Get payment receipt for a transaction
 */
router.get('/receipt/:transactionId', async (req, res) => {
  if (!paymentController) {
    return res.status(500).json({
      success: false,
      error: 'Payment controller not initialized'
    });
  }
  await paymentController.getPaymentReceipt(req, res);
});

/**
 * GET /api/payments/stats/:userId
 * Get payment statistics for a user
 */
router.get('/stats/:userId', async (req, res) => {
  if (!paymentController) {
    return res.status(500).json({
      success: false,
      error: 'Payment controller not initialized'
    });
  }
  await paymentController.getPaymentStats(req, res);
});

export default router;
