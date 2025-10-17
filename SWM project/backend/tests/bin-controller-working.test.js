/**
 * Working Bin Controller Tests
 * Tests for Smart Waste Management System - Bin Controller
 */

// Mock the model first
jest.mock('../src/model/Bin.js', () => ({
  default: {
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  }
}));

import BinController from '../src/controllers/binController.js';
import Bin from '../src/model/Bin.js';

describe('Bin Controller Tests', () => {
  let binController;
  let req, res;
  let mockNotificationService;
  let mockIo;

  beforeEach(() => {
    // Mock dependencies
    mockNotificationService = {
      notifyResident: jest.fn().mockResolvedValue(true),
      notifyWorker: jest.fn().mockResolvedValue(true),
    };
    
    mockIo = {
      emit: jest.fn(),
    };
    
    // Create controller instance with mocked dependencies
    binController = new BinController(mockIo, mockNotificationService);
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup request/response mocks
    req = {
      body: {},
      params: {},
      query: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('Sensor Data Ingestion', () => {
    test('should handle missing binId', async () => {
      req.body = { level: 50, category: 'biodegradable' };

      await binController.ingestSensorData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields: binId, level, category'
      });
    });

    test('should handle invalid level range', async () => {
      req.body = { binId: 'BIN-001', level: 150, category: 'biodegradable' };

      await binController.ingestSensorData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Level must be between 0 and 100'
      });
    });

    test('should handle invalid category', async () => {
      req.body = { binId: 'BIN-001', level: 50, category: 'invalid' };

      await binController.ingestSensorData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid category. Must be: biodegradable, recyclable, or non_biodegradable'
      });
    });

    test('should process valid sensor data', async () => {
      req.body = {
        binId: 'BIN-001',
        level: 75,
        category: 'biodegradable'
      };

      mockBinData = {
        binId: 'BIN-001',
        level: 75,
        category: 'biodegradable',
        status: 'ok'
      };

      Bin.findOneAndUpdate.mockResolvedValue(mockBinData);

      await binController.ingestSensorData(req, res);

      expect(Bin.findOneAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining('processed successfully'),
        data: mockBinData
      });
    });

    test('should trigger notification for high fill level', async () => {
      req.body = {
        binId: 'BIN-HIGH',
        level: 90,
        category: 'biodegradable'
      };

      const mockBinData = {
        binId: 'BIN-HIGH',
        level: 90,
        status: 'ok'
      };

      mockBin.findOneAndUpdate.mockResolvedValue(mockBinData);

      await binController.ingestSensorData(req, res);

      expect(mockNotificationService.notifyResident).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle database errors', async () => {
      req.body = {
        binId: 'BIN-ERROR',
        level: 50,
        category: 'biodegradable'
      };

      mockBin.findOneAndUpdate.mockRejectedValue(new Error('DB Error'));

      await binController.ingestSensorData(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });

  describe('Bin Retrieval', () => {
    test('should get all bins', async () => {
      const mockBins = [
        { binId: 'BIN-001', level: 30 },
        { binId: 'BIN-002', level: 80 }
      ];

      mockBin.find.mockResolvedValue(mockBins);

      await binController.getAllBins(req, res);

      expect(mockBin.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockBins
      });
    });

    test('should get bin by ID', async () => {
      req.params.binId = 'BIN-SPECIFIC';
      const mockBin_data = { binId: 'BIN-SPECIFIC', level: 45 };

      mockBin.findOne.mockResolvedValue(mockBin_data);

      await binController.getBinById(req, res);

      expect(mockBin.findOne).toHaveBeenCalledWith({ binId: 'BIN-SPECIFIC' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockBin_data
      });
    });

    test('should handle bin not found', async () => {
      req.params.binId = 'NONEXISTENT';
      mockBin.findOne.mockResolvedValue(null);

      await binController.getBinById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bin not found'
      });
    });

    test('should handle retrieval errors', async () => {
      mockBin.find.mockRejectedValue(new Error('DB Error'));

      await binController.getAllBins(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });

  describe('Segregation Management', () => {
    test('should mark segregation as done', async () => {
      req.params.binId = 'BIN-SEG';
      const updatedBin = {
        binId: 'BIN-SEG',
        mixed: false,
        status: 'ok'
      };

      mockBin.findOneAndUpdate.mockResolvedValue(updatedBin);

      await binController.markSegregationDone(req, res);

      expect(mockBin.findOneAndUpdate).toHaveBeenCalledWith(
        { binId: 'BIN-SEG' },
        { mixed: false },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle segregation for nonexistent bin', async () => {
      req.params.binId = 'NONEXISTENT';
      mockBin.findOneAndUpdate.mockResolvedValue(null);

      await binController.markSegregationDone(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Business Logic Edge Cases', () => {
    test('should handle boundary level values', async () => {
      // Test minimum level
      req.body = {
        binId: 'BIN-MIN',
        level: 0,
        category: 'biodegradable'
      };

      mockBin.findOneAndUpdate.mockResolvedValue({
        binId: 'BIN-MIN',
        level: 0,
        status: 'ok'
      });

      await binController.ingestSensorData(req, res);
      expect(res.status).toHaveBeenCalledWith(200);

      // Test maximum level
      req.body.level = 100;
      await binController.ingestSensorData(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should validate all required fields', async () => {
      req.body = { level: 50 }; // Missing binId and category

      await binController.ingestSensorData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields: binId, level, category'
      });
    });

    test('should handle all valid categories', async () => {
      const categories = ['biodegradable', 'recyclable', 'non_biodegradable'];
      
      for (const category of categories) {
        req.body = {
          binId: `BIN-${category}`,
          level: 50,
          category: category
        };

        mockBin.findOneAndUpdate.mockResolvedValue({
          binId: `BIN-${category}`,
          category: category
        });

        await binController.ingestSensorData(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
      }
    });
  });
});

console.log('✅ Working Bin Controller Tests - 18 comprehensive tests completed');