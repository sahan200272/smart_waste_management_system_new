import express from 'express';

const router = express.Router();

// This will be set by the server.js file
let binController = null;

export const setBinController = (controller) => {
  binController = controller;
};

// POST /api/bins/ingest - Ingest sensor data
router.post('/ingest', async (req, res) => {
  if (!binController) {
    return res.status(500).json({ error: 'Bin controller not initialized' });
  }
  return binController.ingestSensorData(req, res);
});

// GET /api/bins - List all bins
router.get('/', async (req, res) => {
  if (!binController) {
    return res.status(500).json({ error: 'Bin controller not initialized' });
  }
  return binController.listBins(req, res);
});

// GET /api/bins/:binId - Get specific bin
router.get('/:binId', async (req, res) => {
  if (!binController) {
    return res.status(500).json({ error: 'Bin controller not initialized' });
  }
  return binController.getBinById(req, res);
});

// PATCH /api/bins/:binId/segregation-done - Mark segregation as done
router.patch('/:binId/segregation-done', async (req, res) => {
  if (!binController) {
    return res.status(500).json({ error: 'Bin controller not initialized' });
  }
  return binController.markSegregationDone(req, res);
});

export default router;
