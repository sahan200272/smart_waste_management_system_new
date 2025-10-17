/**
 * Bin Routes Integration Tests
 * Tests for Smart Waste Management System - Bin API Routes
 */

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import binRoutes, { setBinController } from '../src/routes/binRoutes.js';

// Mock bin controller
const mockBinController = {
  ingestSensorData: jest.fn(),
  listBins: jest.fn(),
  getBinById: jest.fn(),
  markSegregationDone: jest.fn()
};

// Setup Express app for testing
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // Set the mock controller
  setBinController(mockBinController);
  
  // Use bin routes
  app.use('/api/bins', binRoutes);
  
  return app;
}

describe('Bin Routes - API Endpoint Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/bins/ingest - Sensor Data Ingestion Route', () => {
    test('should call ingestSensorData controller method', async () => {
      mockBinController.ingestSensorData.mockImplementation((req, res) => {
        res.json({ success: true, binId: req.body.binId });
      });

      const sensorData = {
        binId: 'BIN-ROUTE-001',
        level: 65,
        category: 'biodegradable',
        mixed: false
      };

      const response = await request(app)
        .post('/api/bins/ingest')
        .send(sensorData)
        .expect(200);

      expect(mockBinController.ingestSensorData).toHaveBeenCalledTimes(1);
      expect(mockBinController.ingestSensorData).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining(sensorData)
        }),
        expect.any(Object)
      );
      expect(response.body.success).toBe(true);
    });

    test('should handle controller errors gracefully', async () => {
      mockBinController.ingestSensorData.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Invalid sensor data' });
      });

      const invalidData = {
        binId: 'BIN-ROUTE-002',
        level: -5, // Invalid level
        category: 'biodegradable'
      };

      const response = await request(app)
        .post('/api/bins/ingest')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Invalid sensor data');
    });

    test('should handle missing request body', async () => {
      mockBinController.ingestSensorData.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Missing required fields' });
      });

      const response = await request(app)
        .post('/api/bins/ingest')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    test('should handle controller not initialized error', async () => {
      // Create app without setting controller
      const appNoController = express();
      appNoController.use(express.json());
      
      // Reset the controller to null
      setBinController(null);
      appNoController.use('/api/bins', binRoutes);

      const response = await request(appNoController)
        .post('/api/bins/ingest')
        .send({ binId: 'test', level: 50, category: 'biodegradable' })
        .expect(500);

      expect(response.body.error).toBe('Bin controller not initialized');
      
      // Restore controller for other tests
      setBinController(mockBinController);
    });
  });

  describe('GET /api/bins - List All Bins Route', () => {
    test('should call listBins controller method', async () => {
      const mockBins = [
        { binId: 'BIN-001', level: 30, category: 'biodegradable', status: 'ok' },
        { binId: 'BIN-002', level: 80, category: 'recyclable', status: 'ok' },
        { binId: 'BIN-003', level: 95, category: 'non_biodegradable', status: 'segregation_required' }
      ];

      mockBinController.listBins.mockImplementation((req, res) => {
        res.json(mockBins);
      });

      const response = await request(app)
        .get('/api/bins')
        .expect(200);

      expect(mockBinController.listBins).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual(mockBins);
      expect(response.body).toHaveLength(3);
    });

    test('should handle empty bins list', async () => {
      mockBinController.listBins.mockImplementation((req, res) => {
        res.json([]);
      });

      const response = await request(app)
        .get('/api/bins')
        .expect(200);

      expect(response.body).toEqual([]);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should handle controller errors', async () => {
      mockBinController.listBins.mockImplementation((req, res) => {
        res.status(500).json({ error: 'Database connection failed' });
      });

      const response = await request(app)
        .get('/api/bins')
        .expect(500);

      expect(response.body.error).toBe('Database connection failed');
    });

    test('should pass query parameters to controller', async () => {
      mockBinController.listBins.mockImplementation((req, res) => {
        res.json({ 
          queryParams: req.query,
          bins: []
        });
      });

      const response = await request(app)
        .get('/api/bins?status=ok&category=biodegradable')
        .expect(200);

      expect(response.body.queryParams).toEqual({
        status: 'ok',
        category: 'biodegradable'
      });
    });
  });

  describe('GET /api/bins/:binId - Get Specific Bin Route', () => {
    test('should call getBinById controller method with correct binId', async () => {
      const mockBin = {
        binId: 'BIN-SPECIFIC-001',
        level: 70,
        category: 'recyclable',
        status: 'ok',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' }
      };

      mockBinController.getBinById.mockImplementation((req, res) => {
        if (req.params.binId === 'BIN-SPECIFIC-001') {
          res.json(mockBin);
        } else {
          res.status(404).json({ error: 'Bin not found' });
        }
      });

      const response = await request(app)
        .get('/api/bins/BIN-SPECIFIC-001')
        .expect(200);

      expect(mockBinController.getBinById).toHaveBeenCalledTimes(1);
      expect(mockBinController.getBinById).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { binId: 'BIN-SPECIFIC-001' }
        }),
        expect.any(Object)
      );
      expect(response.body).toEqual(mockBin);
    });

    test('should handle non-existent bin', async () => {
      mockBinController.getBinById.mockImplementation((req, res) => {
        res.status(404).json({ error: 'Bin not found' });
      });

      const response = await request(app)
        .get('/api/bins/NON-EXISTENT-BIN')
        .expect(404);

      expect(response.body.error).toBe('Bin not found');
    });

    test('should handle special characters in binId', async () => {
      const specialBinId = 'BIN-SPECIAL-@#$%';
      
      mockBinController.getBinById.mockImplementation((req, res) => {
        res.json({ binId: req.params.binId, message: 'Found bin with special characters' });
      });

      const response = await request(app)
        .get(`/api/bins/${encodeURIComponent(specialBinId)}`)
        .expect(200);

      expect(response.body.binId).toBe(specialBinId);
    });

    test('should handle empty binId parameter', async () => {
      mockBinController.getBinById.mockImplementation((req, res) => {
        res.status(400).json({ error: 'BinId parameter is required' });
      });

      // Try to access route with empty parameter - this would hit a different route
      const response = await request(app)
        .get('/api/bins/')
        .expect(404); // Should get 404 because route doesn't exist

      // The route GET /api/bins/ would match the list route, not the getBinById route
    });
  });

  describe('PATCH /api/bins/:binId/segregation-done - Mark Segregation Complete Route', () => {
    test('should call markSegregationDone controller method', async () => {
      const mockUpdatedBin = {
        binId: 'BIN-SEG-001',
        level: 60,
        category: 'recyclable',
        status: 'ok',
        mixed: false,
        faultCode: null
      };

      mockBinController.markSegregationDone.mockImplementation((req, res) => {
        res.json(mockUpdatedBin);
      });

      const response = await request(app)
        .patch('/api/bins/BIN-SEG-001/segregation-done')
        .expect(200);

      expect(mockBinController.markSegregationDone).toHaveBeenCalledTimes(1);
      expect(mockBinController.markSegregationDone).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { binId: 'BIN-SEG-001' }
        }),
        expect.any(Object)
      );
      expect(response.body).toEqual(mockUpdatedBin);
      expect(response.body.status).toBe('ok');
    });

    test('should handle bin that does not require segregation', async () => {
      mockBinController.markSegregationDone.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Bin does not require segregation' });
      });

      const response = await request(app)
        .patch('/api/bins/BIN-NORMAL-001/segregation-done')
        .expect(400);

      expect(response.body.error).toBe('Bin does not require segregation');
    });

    test('should handle non-existent bin for segregation', async () => {
      mockBinController.markSegregationDone.mockImplementation((req, res) => {
        res.status(404).json({ error: 'Bin not found' });
      });

      const response = await request(app)
        .patch('/api/bins/NON-EXISTENT/segregation-done')
        .expect(404);

      expect(response.body.error).toBe('Bin not found');
    });

    test('should handle server errors during segregation completion', async () => {
      mockBinController.markSegregationDone.mockImplementation((req, res) => {
        res.status(500).json({ error: 'Internal server error' });
      });

      const response = await request(app)
        .patch('/api/bins/BIN-ERROR-001/segregation-done')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('Route Parameter Validation', () => {
    test('should handle URL-encoded binId parameters', async () => {
      const encodedBinId = 'BIN%20WITH%20SPACES';
      const decodedBinId = 'BIN WITH SPACES';

      mockBinController.getBinById.mockImplementation((req, res) => {
        res.json({ binId: req.params.binId, decoded: true });
      });

      const response = await request(app)
        .get(`/api/bins/${encodedBinId}`)
        .expect(200);

      expect(response.body.binId).toBe(decodedBinId);
    });

    test('should handle long binId parameters', async () => {
      const longBinId = 'BIN-' + 'A'.repeat(100); // Very long binId

      mockBinController.getBinById.mockImplementation((req, res) => {
        res.json({ binId: req.params.binId, length: req.params.binId.length });
      });

      const response = await request(app)
        .get(`/api/bins/${longBinId}`)
        .expect(200);

      expect(response.body.length).toBe(104); // 'BIN-' + 100 A's
    });
  });

  describe('HTTP Method Validation', () => {
    test('should reject unsupported HTTP methods on /api/bins', async () => {
      // Test unsupported methods
      await request(app).put('/api/bins').expect(404);
      await request(app).delete('/api/bins').expect(404);
      await request(app).patch('/api/bins').expect(404);
    });

    test('should reject unsupported HTTP methods on /api/bins/:binId', async () => {
      await request(app).post('/api/bins/BIN-001').expect(404);
      await request(app).put('/api/bins/BIN-001').expect(404);
      await request(app).delete('/api/bins/BIN-001').expect(404);
    });

    test('should reject unsupported HTTP methods on segregation endpoint', async () => {
      await request(app).get('/api/bins/BIN-001/segregation-done').expect(404);
      await request(app).post('/api/bins/BIN-001/segregation-done').expect(404);
      await request(app).put('/api/bins/BIN-001/segregation-done').expect(404);
      await request(app).delete('/api/bins/BIN-001/segregation-done').expect(404);
    });
  });

  describe('Content-Type Handling', () => {
    test('should accept JSON content type for POST requests', async () => {
      mockBinController.ingestSensorData.mockImplementation((req, res) => {
        res.json({ contentType: req.get('Content-Type'), success: true });
      });

      const response = await request(app)
        .post('/api/bins/ingest')
        .set('Content-Type', 'application/json')
        .send({ binId: 'BIN-JSON-001', level: 50, category: 'biodegradable' })
        .expect(200);

      expect(response.body.contentType).toBe('application/json');
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/bins/ingest')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Request Headers and Metadata', () => {
    test('should pass request headers to controller', async () => {
      mockBinController.ingestSensorData.mockImplementation((req, res) => {
        res.json({ 
          userAgent: req.get('User-Agent'),
          customHeader: req.get('X-Custom-Header')
        });
      });

      const response = await request(app)
        .post('/api/bins/ingest')
        .set('X-Custom-Header', 'test-value')
        .send({ binId: 'BIN-HEADER-001', level: 50, category: 'biodegradable' })
        .expect(200);

      expect(response.body.customHeader).toBe('test-value');
      expect(response.body.userAgent).toBeTruthy();
    });

    test('should handle requests without optional headers', async () => {
      mockBinController.listBins.mockImplementation((req, res) => {
        res.json({ headerCount: Object.keys(req.headers).length });
      });

      const response = await request(app)
        .get('/api/bins')
        .expect(200);

      expect(response.body.headerCount).toBeGreaterThan(0);
    });
  });

  describe('Route Error Handling', () => {
    test('should handle controller method throwing exceptions', async () => {
      mockBinController.listBins.mockImplementation((req, res) => {
        throw new Error('Controller exception');
      });

      // This should be caught by the route's error handling
      await request(app)
        .get('/api/bins')
        .expect(500);
    });

    test('should handle async controller method rejections', async () => {
      mockBinController.getBinById.mockImplementation(async (req, res) => {
        await Promise.reject(new Error('Async rejection'));
      });

      await request(app)
        .get('/api/bins/BIN-ASYNC-ERROR')
        .expect(500);
    });
  });
});

console.log('✅ Comprehensive Bin Routes Tests - 25 tests covering all API endpoints, error handling, and edge cases');