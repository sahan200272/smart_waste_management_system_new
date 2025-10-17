/**
 * Resident Routes
 * Defines HTTP routes for resident operations
 * Uses existing payment system integration
 */

import express from 'express';

const router = express.Router();
let residentController;

/**
 * Set the resident controller instance
 * @param {ResidentController} controller - The resident controller instance
 */
export const setResidentController = (controller) => {
  residentController = controller;
};

/**
 * Route: GET /api/residents/details
 * Description: Get demo resident details with outstanding bills
 */
router.get('/details', (req, res) => {
  residentController.getDemoResidentDetails(req, res);
});

/**
 * Route: GET /api/residents/bill/:userId
 * Description: Get detailed bill information for a resident
 */
router.get('/bill/:userId', (req, res) => {
  residentController.getBillDetails(req, res);
});

/**
 * Route: GET /api/residents/payments/:userId
 * Description: Get payment history for a resident
 */
router.get('/payments/:userId', (req, res) => {
  residentController.getPaymentHistory(req, res);
});

export default router;