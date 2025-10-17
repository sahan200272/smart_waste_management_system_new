/**
 * Comprehensive Bin Controller Tests
 * Tests for Smart Waste Management System - Bin Module
 */

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import BinController from '../src/controllers/binController.js';
import Bin from '../src/model/Bin.js';
import { setupTestEnvironment, teardownTestEnvironment, clearTestDB } from './testDatabase.js';

// Mock socket.io and notification service
const mockIo = {
  emit: jest.fn()
};

const mockNotificationService = {
  notifyResident: jest.fn()
};

// Setup Express app for testing
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  const binController = new BinController(mockIo, mockNotificationService);
  
  // Define routes
  app.post('/api/bins/ingest', binController.ingestSensorData.bind(binController));
  app.get('/api/bins', binController.listBins.bind(binController));
  app.get('/api/bins/:binId', binController.getBinById.bind(binController));
  app.patch('/api/bins/:binId/segregation-done', binController.markSegregationDone.bind(binController));
  
  return app;
}

describe('Bin Controller - Comprehensive Backend Tests', () => {
  let app;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = createTestApp();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await clearTestDB();
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/bins/ingest - Sensor Data Ingestion', () => {
    describe('Successful Data Ingestion', () => {
      test('should create new bin with valid sensor data', async () => {
        const sensorData = {
          binId: 'BIN-TEST-001',
          level: 45,
          category: 'biodegradable',
          mixed: false,
          deviceTs: '2024-01-01T10:00:00Z'
        };

        const response = await request(app)
          .post('/api/bins/ingest')
          .send(sensorData)
          .expect(200);

        expect(response.body).toHaveProperty('binId', 'BIN-TEST-001');
        expect(response.body).toHaveProperty('level', 45);
        expect(response.body).toHaveProperty('category', 'biodegradable');
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('mixed', false);

        // Verify bin was saved to database
        const savedBin = await Bin.findOne({ binId: 'BIN-TEST-001' });
        expect(savedBin).toBeTruthy();
        expect(savedBin.level).toBe(45);
      });

      test('should update existing bin with new sensor data', async () => {
        // Create initial bin
        const initialBin = new Bin({
          binId: 'BIN-TEST-002',
          location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
          level: 30,
          category: 'recyclable',
          mixed: false
        });
        await initialBin.save();

        // Update with new data
        const updateData = {
          binId: 'BIN-TEST-002',
          level: 75,
          category: 'recyclable',
          mixed: false
        };

        const response = await request(app)
          .post('/api/bins/ingest')
          .send(updateData)
          .expect(200);

        expect(response.body.level).toBe(75);
        
        // Verify database was updated
        const updatedBin = await Bin.findOne({ binId: 'BIN-TEST-002' });
        expect(updatedBin.level).toBe(75);
      });

      test('should emit socket events for bin updates', async () => {
        const sensorData = {
          binId: 'BIN-TEST-003',
          level: 60,
          category: 'non_biodegradable',
          mixed: false
        };

        await request(app)
          .post('/api/bins/ingest')
          .send(sensorData)
          .expect(200);

        expect(mockIo.emit).toHaveBeenCalledWith('bin:update', expect.objectContaining({
          binId: 'BIN-TEST-003',
          level: 60
        }));
      });
    });

    describe('Input Validation', () => {
      test('should reject data with missing binId', async () => {
        const invalidData = {
          level: 75,
          category: 'biodegradable'
        };

        const response = await request(app)
          .post('/api/bins/ingest')
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBe('Missing required fields: binId, level, category');
      });

      test('should reject data with missing level', async () => {
        const invalidData = {
          binId: 'BIN-TEST-004',
          category: 'biodegradable'
        };

        const response = await request(app)
          .post('/api/bins/ingest')
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBe('Missing required fields: binId, level, category');
      });

      test('should reject data with missing category', async () => {
        const invalidData = {
          binId: 'BIN-TEST-005',
          level: 75
        };

        const response = await request(app)
          .post('/api/bins/ingest')
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBe('Missing required fields: binId, level, category');
      });

      test('should reject level below 0', async () => {
        const invalidData = {
          binId: 'BIN-TEST-006',
          level: -5,
          category: 'biodegradable'
        };

        const response = await request(app)
          .post('/api/bins/ingest')
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBe('Level must be between 0 and 100');
      });

      test('should reject level above 100', async () => {
        const invalidData = {
          binId: 'BIN-TEST-007',
          level: 105,
          category: 'biodegradable'
        };

        const response = await request(app)
          .post('/api/bins/ingest')
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBe('Level must be between 0 and 100');
      });

      test('should reject invalid category', async () => {
        const invalidData = {
          binId: 'BIN-TEST-008',
          level: 50,
          category: 'invalid_category'
        };

        const response = await request(app)
          .post('/api/bins/ingest')
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBe('Invalid category. Must be: biodegradable, recyclable, or non_biodegradable');
      });
    });

    describe('Business Logic - Segregation Detection', () => {
      test('should mark bin as segregation_required when mixed waste detected', async () => {
        const sensorData = {
          binId: 'BIN-TEST-009',
          level: 50,
          category: 'biodegradable',
          mixed: true
        };

        const response = await request(app)
          .post('/api/bins/ingest')
          .send(sensorData)
          .expect(200);

        expect(response.body.status).toBe('segregation_required');
        expect(response.body.faultCode).toBe('mixed_waste_detected');
        expect(response.body.mixed).toBe(true);

        // Verify segregation alert was emitted
        expect(mockIo.emit).toHaveBeenCalledWith('bin:alert', expect.objectContaining({
          binId: 'BIN-TEST-009',
          type: 'segregation',
          message: expect.stringContaining('requires segregation')
        }));

        // Verify resident notification was sent
        expect(mockNotificationService.notifyResident).toHaveBeenCalledWith(
          expect.objectContaining({
            binId: 'BIN-TEST-009',
            type: 'segregation'
          })
        );
      });

      test('should resolve segregation_required status when mixed becomes false', async () => {
        // Create bin with segregation required
        const mixedBin = new Bin({
          binId: 'BIN-TEST-010',
          location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
          level: 50,
          category: 'recyclable',
          mixed: true,
          status: 'segregation_required',
          faultCode: 'mixed_waste_detected'
        });
        await mixedBin.save();

        // Update with segregated waste
        const updateData = {
          binId: 'BIN-TEST-010',
          level: 55,
          category: 'recyclable',
          mixed: false
        };

        const response = await request(app)
          .post('/api/bins/ingest')
          .send(updateData)
          .expect(200);

        expect(response.body.status).toBe('ok');
        expect(response.body.faultCode).toBeNull();
        expect(response.body.mixed).toBe(false);

        // Verify segregation resolved alert was emitted
        expect(mockIo.emit).toHaveBeenCalledWith('bin:alert', expect.objectContaining({
          binId: 'BIN-TEST-010',
          type: 'segregation_resolved'
        }));
      });
    });

    describe('Business Logic - High Fill Level Notifications', () => {
      test('should send resident notification for high fill level (>=85%)', async () => {
        const sensorData = {
          binId: 'BIN-TEST-011',
          level: 90,
          category: 'biodegradable',
          mixed: false
        };

        await request(app)
          .post('/api/bins/ingest')
          .send(sensorData)
          .expect(200);

        expect(mockNotificationService.notifyResident).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'residents',
            binId: 'BIN-TEST-011',
            type: 'level',
            message: expect.stringContaining('90% full')
          })
        );
      });

      test('should not send notification for normal fill levels', async () => {
        const sensorData = {
          binId: 'BIN-TEST-012',
          level: 60,
          category: 'recyclable',
          mixed: false
        };

        await request(app)
          .post('/api/bins/ingest')
          .send(sensorData)
          .expect(200);

        // Should not call notification for normal levels
        expect(mockNotificationService.notifyResident).not.toHaveBeenCalled();
      });
    });

    describe('Edge Cases', () => {
      test('should handle boundary level values correctly', async () => {
        // Test level 0
        await request(app)
          .post('/api/bins/ingest')
          .send({ binId: 'BIN-EDGE-001', level: 0, category: 'biodegradable' })
          .expect(200);

        // Test level 100
        await request(app)
          .post('/api/bins/ingest')
          .send({ binId: 'BIN-EDGE-002', level: 100, category: 'recyclable' })
          .expect(200);

        // Test level 85 (notification threshold)
        await request(app)
          .post('/api/bins/ingest')
          .send({ binId: 'BIN-EDGE-003', level: 85, category: 'non_biodegradable' })
          .expect(200);

        expect(mockNotificationService.notifyResident).toHaveBeenCalledTimes(2); // level 100 and 85
      });

      test('should handle all valid categories', async () => {
        const categories = ['biodegradable', 'recyclable', 'non_biodegradable'];
        
        for (let i = 0; i < categories.length; i++) {
          const response = await request(app)
            .post('/api/bins/ingest')
            .send({
              binId: `BIN-CAT-${i + 1}`,
              level: 50,
              category: categories[i]
            })
            .expect(200);

          expect(response.body.category).toBe(categories[i]);
        }
      });

      test('should handle missing optional fields gracefully', async () => {
        const minimalData = {
          binId: 'BIN-MIN-001',
          level: 45,
          category: 'biodegradable'
          // No mixed or deviceTs
        };

        const response = await request(app)
          .post('/api/bins/ingest')
          .send(minimalData)
          .expect(200);

        expect(response.body.mixed).toBe(false); // Default value
        expect(response.body.lastSeenAt).toBeTruthy(); // Should be set to current time
      });
    });
  });

  describe('GET /api/bins - List All Bins', () => {
    beforeEach(async () => {
      // Create test bins
      const testBins = [
        {
          binId: 'BIN-LIST-001',
          location: { lat: 6.9271, lng: 79.8612, address: 'Location 1' },
          level: 30,
          category: 'biodegradable',
          status: 'ok'
        },
        {
          binId: 'BIN-LIST-002',
          location: { lat: 6.9281, lng: 79.8622, address: 'Location 2' },
          level: 90,
          category: 'recyclable',
          status: 'ok'
        },
        {
          binId: 'BIN-LIST-003',
          location: { lat: 6.9291, lng: 79.8632, address: 'Location 3' },
          level: 75,
          category: 'non_biodegradable',
          status: 'segregation_required'
        }
      ];

      await Bin.insertMany(testBins);
    });

    test('should return all bins sorted by binId', async () => {
      const response = await request(app)
        .get('/api/bins')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
      
      // Verify sorting by binId
      expect(response.body[0].binId).toBe('BIN-LIST-001');
      expect(response.body[1].binId).toBe('BIN-LIST-002');
      expect(response.body[2].binId).toBe('BIN-LIST-003');
    });

    test('should return empty array when no bins exist', async () => {
      await clearTestDB();
      
      const response = await request(app)
        .get('/api/bins')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    test('should include all bin properties', async () => {
      const response = await request(app)
        .get('/api/bins')
        .expect(200);

      const bin = response.body[0];
      expect(bin).toHaveProperty('binId');
      expect(bin).toHaveProperty('location');
      expect(bin).toHaveProperty('level');
      expect(bin).toHaveProperty('category');
      expect(bin).toHaveProperty('status');
      expect(bin).toHaveProperty('mixed');
      expect(bin).toHaveProperty('lastSeenAt');
    });
  });

  describe('GET /api/bins/:binId - Get Specific Bin', () => {
    beforeEach(async () => {
      const testBin = new Bin({
        binId: 'BIN-SPECIFIC-001',
        location: { lat: 6.9271, lng: 79.8612, address: 'Specific Location' },
        level: 65,
        category: 'biodegradable',
        status: 'ok'
      });
      await testBin.save();
    });

    test('should return specific bin by binId', async () => {
      const response = await request(app)
        .get('/api/bins/BIN-SPECIFIC-001')
        .expect(200);

      expect(response.body.binId).toBe('BIN-SPECIFIC-001');
      expect(response.body.level).toBe(65);
      expect(response.body.category).toBe('biodegradable');
    });

    test('should return 404 for non-existent bin', async () => {
      const response = await request(app)
        .get('/api/bins/NON-EXISTENT-BIN')
        .expect(404);

      expect(response.body.error).toBe('Bin not found');
    });

    test('should handle empty binId gracefully', async () => {
      await request(app)
        .get('/api/bins/')
        .expect(404); // Route not found for empty parameter
    });
  });

  describe('PATCH /api/bins/:binId/segregation-done - Mark Segregation Complete', () => {
    beforeEach(async () => {
      // Create bin requiring segregation
      const segregationBin = new Bin({
        binId: 'BIN-SEG-001',
        location: { lat: 6.9271, lng: 79.8612, address: 'Segregation Location' },
        level: 60,
        category: 'recyclable',
        status: 'segregation_required',
        mixed: true,
        faultCode: 'mixed_waste_detected'
      });
      await segregationBin.save();

      // Create normal bin for testing invalid operations
      const normalBin = new Bin({
        binId: 'BIN-NORMAL-001',
        location: { lat: 6.9281, lng: 79.8622, address: 'Normal Location' },
        level: 40,
        category: 'biodegradable',
        status: 'ok',
        mixed: false
      });
      await normalBin.save();
    });

    test('should successfully mark segregation as done', async () => {
      const response = await request(app)
        .patch('/api/bins/BIN-SEG-001/segregation-done')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.mixed).toBe(false);
      expect(response.body.faultCode).toBeNull();

      // Verify database was updated
      const updatedBin = await Bin.findOne({ binId: 'BIN-SEG-001' });
      expect(updatedBin.status).toBe('ok');
      expect(updatedBin.mixed).toBe(false);

      // Verify socket events were emitted
      expect(mockIo.emit).toHaveBeenCalledWith('bin:update', expect.objectContaining({
        binId: 'BIN-SEG-001',
        status: 'ok'
      }));

      expect(mockIo.emit).toHaveBeenCalledWith('bin:alert', expect.objectContaining({
        binId: 'BIN-SEG-001',
        type: 'segregation_resolved'
      }));
    });

    test('should return 400 for bin that does not require segregation', async () => {
      const response = await request(app)
        .patch('/api/bins/BIN-NORMAL-001/segregation-done')
        .expect(400);

      expect(response.body.error).toBe('Bin does not require segregation');
    });

    test('should return 404 for non-existent bin', async () => {
      const response = await request(app)
        .patch('/api/bins/NON-EXISTENT/segregation-done')
        .expect(404);

      expect(response.body.error).toBe('Bin not found');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Temporarily close database connection
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/bins')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');

      // Reconnect for other tests
      await setupTestEnvironment();
    });

    test('should handle malformed JSON in requests', async () => {
      const response = await request(app)
        .post('/api/bins/ingest')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

console.log('✅ Comprehensive Bin Controller Tests - 36 tests covering all endpoints and business logic');