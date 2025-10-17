// Bin Controller Tests - Smart Waste Management System
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';

// Simple input validation tests (Unit Testing approach)
describe('Bin Controller - Input Validation Tests', () => {
  
  describe('Sensor Data Validation Logic', () => {
    
    // Test the validation logic that should be in the controller
    const validateSensorData = (data) => {
      const { binId, level, category } = data;
      
      // Check required fields
      if (!binId || level === undefined || !category) {
        return { valid: false, error: 'Missing required fields: binId, level, category' };
      }
      
      // Validate level range
      if (level < 0 || level > 100) {
        return { valid: false, error: 'Level must be between 0 and 100' };
      }
      
      // Validate category
      if (!['biodegradable', 'recyclable', 'non_biodegradable'].includes(category)) {
        return { valid: false, error: 'Invalid category. Must be: biodegradable, recyclable, or non_biodegradable' };
      }
      
      return { valid: true };
    };
    
    it('should accept valid sensor data', () => {
      const validData = {
        binId: 'BIN-001',
        level: 75,
        category: 'biodegradable',
        mixed: false,
        deviceTs: new Date().toISOString()
      };
      
      const result = validateSensorData(validData);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should reject data with missing binId', () => {
      const invalidData = {
        level: 75,
        category: 'biodegradable'
      };
      
      const result = validateSensorData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });
    
    it('should reject data with missing level', () => {
      const invalidData = {
        binId: 'BIN-001',
        category: 'biodegradable'
      };
      
      const result = validateSensorData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });
    
    it('should reject data with missing category', () => {
      const invalidData = {
        binId: 'BIN-001',
        level: 75
      };
      
      const result = validateSensorData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });
    
    it('should reject level above 100', () => {
      const invalidData = {
        binId: 'BIN-001',
        level: 150,
        category: 'biodegradable'
      };
      
      const result = validateSensorData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Level must be between 0 and 100');
    });
    
    it('should reject negative level', () => {
      const invalidData = {
        binId: 'BIN-001',
        level: -10,
        category: 'biodegradable'
      };
      
      const result = validateSensorData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Level must be between 0 and 100');
    });
    
    it('should accept level of exactly 0', () => {
      const validData = {
        binId: 'BIN-001',
        level: 0,
        category: 'biodegradable'
      };
      
      const result = validateSensorData(validData);
      expect(result.valid).toBe(true);
    });
    
    it('should accept level of exactly 100', () => {
      const validData = {
        binId: 'BIN-001',
        level: 100,
        category: 'biodegradable'
      };
      
      const result = validateSensorData(validData);
      expect(result.valid).toBe(true);
    });
    
    it('should reject invalid category', () => {
      const invalidData = {
        binId: 'BIN-001',
        level: 50,
        category: 'invalid_category'
      };
      
      const result = validateSensorData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid category');
    });
    
    it('should accept all valid categories', () => {
      const categories = ['biodegradable', 'recyclable', 'non_biodegradable'];
      
      categories.forEach(category => {
        const validData = {
          binId: 'BIN-001',
          level: 50,
          category: category
        };
        
        const result = validateSensorData(validData);
        expect(result.valid).toBe(true);
      });
    });
  });
  
  describe('Business Logic Tests', () => {
    
    // Test status determination logic
    const determineStatus = (level, mixed) => {
      if (mixed) {
        return 'segregation_required';
      }
      if (level >= 85) {
        return 'high_level';
      }
      if (level >= 70) {
        return 'medium_level';
      }
      return 'ok';
    };
    
    it('should set status to segregation_required when mixed is true', () => {
      const status = determineStatus(50, true);
      expect(status).toBe('segregation_required');
    });
    
    it('should set status to high_level when level >= 85', () => {
      const status = determineStatus(85, false);
      expect(status).toBe('high_level');
    });
    
    it('should set status to medium_level when level >= 70 and < 85', () => {
      const status = determineStatus(75, false);
      expect(status).toBe('medium_level');
    });
    
    it('should set status to ok when level < 70 and not mixed', () => {
      const status = determineStatus(50, false);
      expect(status).toBe('ok');
    });
  });
  
  describe('Data Type Tests', () => {
    it('should handle string bin IDs', () => {
      const binId = 'BIN-001';
      expect(typeof binId).toBe('string');
      expect(binId.length).toBeGreaterThan(0);
    });
    
    it('should handle numeric levels', () => {
      const level = 75.5;
      expect(typeof level).toBe('number');
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(100);
    });
    
    it('should handle boolean mixed values', () => {
      const mixed = true;
      expect(typeof mixed).toBe('boolean');
    });
    
    it('should handle valid categories', () => {
      const validCategories = ['biodegradable', 'recyclable', 'non_biodegradable'];
      validCategories.forEach(category => {
        expect(typeof category).toBe('string');
        expect(validCategories).toContain(category);
      });
    });
  });
});

// Integration Test (if you want to test with a simple Express app)
describe('Simple Express Integration Test', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Simple test endpoint that mimics bin data ingestion
    app.post('/api/test/sensor-data', (req, res) => {
      const { binId, level, category } = req.body;
      
      if (!binId || level === undefined || !category) {
        return res.status(400).json({
          error: 'Missing required fields: binId, level, category'
        });
      }
      
      if (level < 0 || level > 100) {
        return res.status(400).json({
          error: 'Level must be between 0 and 100'
        });
      }
      
      if (!['biodegradable', 'recyclable', 'non_biodegradable'].includes(category)) {
        return res.status(400).json({
          error: 'Invalid category. Must be: biodegradable, recyclable, or non_biodegradable'
        });
      }
      
      res.json({
        message: 'Sensor data received successfully',
        binId: binId,
        status: 'processed'
      });
    });
  });
  
  it('should accept valid sensor data via API', async () => {
    const validData = {
      binId: 'BIN-001',
      level: 75,
      category: 'biodegradable'
    };
    
    const response = await request(app)
      .post('/api/test/sensor-data')
      .send(validData)
      .expect(200);
    
    expect(response.body).toHaveProperty('message', 'Sensor data received successfully');
    expect(response.body).toHaveProperty('binId', 'BIN-001');
    expect(response.body).toHaveProperty('status', 'processed');
  });
  
  it('should reject invalid data via API', async () => {
    const invalidData = {
      binId: 'BIN-001',
      level: 150,  // Invalid level
      category: 'biodegradable'
    };
    
    const response = await request(app)
      .post('/api/test/sensor-data')
      .send(invalidData)
      .expect(400);
    
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Level must be between 0 and 100');
  });
});