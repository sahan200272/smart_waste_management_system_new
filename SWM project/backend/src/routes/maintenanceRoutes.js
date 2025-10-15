import express from 'express';

const router = express.Router();

// This will be set by the server.js file
let maintenanceController = null;

export const setMaintenanceController = (controller) => {
  maintenanceController = controller;
};

// POST /api/maintenance - Create maintenance ticket
router.post('/', async (req, res) => {
  if (!maintenanceController) {
    return res.status(500).json({ error: 'Maintenance controller not initialized' });
  }
  return maintenanceController.createTicket(req, res);
});

// GET /api/maintenance - Get all tickets (with optional filters)
router.get('/', async (req, res) => {
  if (!maintenanceController) {
    return res.status(500).json({ error: 'Maintenance controller not initialized' });
  }
  return maintenanceController.getTickets(req, res);
});

// GET /api/maintenance/:id - Get specific ticket
router.get('/:id', async (req, res) => {
  if (!maintenanceController) {
    return res.status(500).json({ error: 'Maintenance controller not initialized' });
  }
  return maintenanceController.getTicketById(req, res);
});

// PATCH /api/maintenance/:id/schedule - Schedule ticket
router.patch('/:id/schedule', async (req, res) => {
  if (!maintenanceController) {
    return res.status(500).json({ error: 'Maintenance controller not initialized' });
  }
  return maintenanceController.scheduleTicket(req, res);
});

// PATCH /api/maintenance/:id/close - Close ticket
router.patch('/:id/close', async (req, res) => {
  if (!maintenanceController) {
    return res.status(500).json({ error: 'Maintenance controller not initialized' });
  }
  return maintenanceController.closeTicket(req, res);
});

export default router;
