import express from 'express';

const router = express.Router();

// This will be set by the server.js file
let reportController = null;

export const setReportController = (controller) => {
  reportController = controller;
};

// POST /api/reports/manual - Manual segregation report
router.post('/manual', async (req, res) => {
  if (!reportController) {
    return res.status(500).json({ error: 'Report controller not initialized' });
  }
  return reportController.manualSegregationReport(req, res);
});

// POST /api/reports/bulk-sync - Bulk sync sensor data
router.post('/bulk-sync', async (req, res) => {
  if (!reportController) {
    return res.status(500).json({ error: 'Report controller not initialized' });
  }
  return reportController.bulkSync(req, res);
});

// GET /api/reports/notifications - Get notifications
router.get('/notifications', async (req, res) => {
  if (!reportController) {
    return res.status(500).json({ error: 'Report controller not initialized' });
  }
  return reportController.getNotifications(req, res);
});

// PATCH /api/reports/notifications/:id/read - Mark notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  if (!reportController) {
    return res.status(500).json({ error: 'Report controller not initialized' });
  }
  return reportController.markNotificationAsRead(req, res);
});

export default router;
