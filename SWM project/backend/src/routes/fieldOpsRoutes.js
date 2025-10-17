/**
 * @fileoverview Field Operations Routes
 * Express routes for field operations API endpoints
 */

import express from 'express';
import fieldOpsController from '../controllers/fieldOpsController.js';

const router = express.Router();

// ==================== MIDDLEWARE ====================

/**
 * Mock authentication middleware
 * In production, replace with actual auth middleware
 */
const mockAuth = (req, res, next) => {
  // Mock user for development
  req.user = {
    id: req.headers['x-user-id'] || 'user-123',
    role: req.headers['x-user-role'] || 'collector',
    isAdmin: req.headers['x-user-role'] === 'admin'
  };
  next();
};

/**
 * Request validation middleware
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
};

// Apply auth middleware to all routes
router.use(mockAuth);

// ==================== TASK ROUTES ====================

/**
 * @swagger
 * /api/fieldops/tasks:
 *   get:
 *     summary: Get tasks for collector
 *     tags: [Field Operations - Tasks]
 *     parameters:
 *       - in: query
 *         name: collectorId
 *         schema:
 *           type: string
 *         description: Collector user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (comma-separated)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.get('/tasks', fieldOpsController.getTasks);

/**
 * @swagger
 * /api/fieldops/tasks/{id}:
 *   get:
 *     summary: Get single task details
 *     tags: [Field Operations - Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *       404:
 *         description: Task not found
 *       403:
 *         description: Access denied
 */
router.get('/tasks/:id', fieldOpsController.getTask);

// ==================== SCANNING ROUTES ====================

/**
 * @swagger
 * /api/fieldops/scan/validate:
 *   post:
 *     summary: Validate QR code scan
 *     tags: [Field Operations - Scanning]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrTag:
 *                 type: string
 *                 description: QR code data
 *               binId:
 *                 type: string
 *                 description: Alternative bin ID for manual entry
 *               gps:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *               taskId:
 *                 type: string
 *                 description: Associated task ID
 *             required:
 *               - gps
 *     responses:
 *       200:
 *         description: Scan validated successfully
 *       400:
 *         description: Invalid scan data or location mismatch
 *       404:
 *         description: QR code not recognized
 */
router.post('/scan/validate', fieldOpsController.validateScan);

// ==================== COLLECTION ROUTES ====================

/**
 * @swagger
 * /api/fieldops/collections/start:
 *   post:
 *     summary: Start collection process
 *     tags: [Field Operations - Collections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskId:
 *                 type: string
 *               binId:
 *                 type: string
 *               collectorId:
 *                 type: string
 *               gpsData:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *             required:
 *               - taskId
 *               - binId
 *               - gpsData
 *     responses:
 *       200:
 *         description: Collection started successfully
 *       400:
 *         description: Invalid request or task already started
 *       403:
 *         description: Task not assigned to collector
 *       404:
 *         description: Task not found
 */
router.post('/collections/start', fieldOpsController.startCollection);

/**
 * @swagger
 * /api/fieldops/collections/measure:
 *   post:
 *     summary: Record waste measurements
 *     tags: [Field Operations - Collections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *               weightKg:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1000
 *               fillPct:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               wasteType:
 *                 type: string
 *                 enum: [General, Recyclable, Organic, Hazardous, Mixed]
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *             required:
 *               - eventId
 *     responses:
 *       200:
 *         description: Measurement recorded successfully
 *       400:
 *         description: Invalid measurement data
 *       404:
 *         description: Collection event not found
 */
router.post('/collections/measure', fieldOpsController.recordMeasurement);

/**
 * @swagger
 * /api/fieldops/collections/complete:
 *   post:
 *     summary: Complete collection process
 *     tags: [Field Operations - Collections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *               notes:
 *                 type: string
 *               irregularity:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [SegregationIssue, ContainerDamage, OverflowSpillage, ContaminatedWaste, Other]
 *                   description:
 *                     type: string
 *                   severity:
 *                     type: string
 *                     enum: [Minor, Moderate, Severe]
 *                   photos:
 *                     type: array
 *                     items:
 *                       type: string
 *                   notes:
 *                     type: string
 *               gpsData:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *             required:
 *               - eventId
 *     responses:
 *       200:
 *         description: Collection completed successfully
 *       400:
 *         description: Collection not in progress
 *       404:
 *         description: Collection event not found
 */
router.post('/collections/complete', fieldOpsController.completeCollection);

// ==================== ERROR HANDLING ====================

/**
 * Global error handler for field operations routes
 */
router.use((error, req, res, next) => {
  console.error('FieldOps Route Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: Object.values(error.errors).map(e => e.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ==================== ISSUE REPORTING ====================

/**
 * @swagger
 * /api/fieldops/report-issue:
 *   post:
 *     summary: Report maintenance issue
 *     tags: [Field Operations - Issues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - priority
 *               - description
 *               - location
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [Damage, Overflow, Missing Bin, Blocked Access, Safety Hazard, Vandalism, Other]
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Critical]
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               binId:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Issue reported successfully
 *       400:
 *         description: Invalid request data
 */
router.post('/report-issue', fieldOpsController.reportIssue.bind(fieldOpsController));

/**
 * @swagger
 * /api/fieldops/tickets:
 *   get:
 *     summary: Get maintenance tickets
 *     tags: [Field Operations - Issues]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, scheduled, done]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of maintenance tickets
 */
router.get('/tickets', fieldOpsController.getTickets.bind(fieldOpsController));

// ==================== HEALTH CHECK ====================

/**
 * @swagger
 * /api/fieldops/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Field Operations - System]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Field Operations service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;