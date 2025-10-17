import express from 'express';
import SpecialCollectionController from '../controllers/specialCollectionController.js';

const router = express.Router();

// Export the router with controller dependency injection
export default function(io, notificationService) {
  const specialCollectionController = new SpecialCollectionController(io, notificationService);
  
  // Create special collection request
  router.post('/', (req, res) => specialCollectionController.createSpecialCollection(req, res));
  
  // Get all special collections with filtering
  router.get('/', (req, res) => specialCollectionController.getSpecialCollections(req, res));
  
  // Approve and schedule collection
  router.patch('/:collectionId/schedule', (req, res) => 
    specialCollectionController.approveAndScheduleCollection(req, res)
  );
  
  // Bulk route optimization
  router.post('/optimize-routes', (req, res) => 
    specialCollectionController.optimizeCollectionRoutes(req, res)
  );
  
  // Update collection status
  router.patch('/:collectionId/status', (req, res) => 
    specialCollectionController.updateCollectionStatus(req, res)
  );
  
  // Get collection statistics
  router.get('/statistics', (req, res) => 
    specialCollectionController.getCollectionStatistics(req, res)
  );
  
  return router;
}