/**
 * Simplified Bin Model Tests
 * Tests for Smart Waste Management System - Bin Model/Schema
 */

import Bin from '../src/model/Bin.js';

describe('Bin Model - Schema Validation Tests', () => {
  
  describe('Schema Structure Tests', () => {
    test('should have required schema fields', () => {
      const binSchema = Bin.schema;
      
      // Test required fields exist
      expect(binSchema.paths.binId).toBeDefined();
      expect(binSchema.paths['location.lat']).toBeDefined();
      expect(binSchema.paths['location.lng']).toBeDefined();
      expect(binSchema.paths['location.address']).toBeDefined();
      expect(binSchema.paths.level).toBeDefined();
      expect(binSchema.paths.category).toBeDefined();
      
      // Test required field constraints
      expect(binSchema.paths.binId.isRequired).toBe(true);
      expect(binSchema.paths['location.lat'].isRequired).toBe(true);
      expect(binSchema.paths['location.lng'].isRequired).toBe(true);
      expect(binSchema.paths['location.address'].isRequired).toBe(true);
      expect(binSchema.paths.level.isRequired).toBe(true);
      expect(binSchema.paths.category.isRequired).toBe(true);
    });

    test('should have correct field types', () => {
      const binSchema = Bin.schema;
      
      expect(binSchema.paths.binId.instance).toBe('String');
      expect(binSchema.paths.level.instance).toBe('Number');
      expect(binSchema.paths.category.instance).toBe('String');
      expect(binSchema.paths.status.instance).toBe('String');
      expect(binSchema.paths.mixed.instance).toBe('Boolean');
    });

    test('should have enum constraints for category', () => {
      const binSchema = Bin.schema;
      const categoryPath = binSchema.paths.category;
      
      expect(categoryPath.enumValues).toContain('biodegradable');
      expect(categoryPath.enumValues).toContain('recyclable');
      expect(categoryPath.enumValues).toContain('non_biodegradable');
    });

    test('should have enum constraints for status', () => {
      const binSchema = Bin.schema;
      const statusPath = binSchema.paths.status;
      
      expect(statusPath.enumValues).toContain('ok');
      expect(statusPath.enumValues).toContain('segregation_required');
      expect(statusPath.enumValues).toContain('maintenance_needed');
    });

    test('should have level validation constraints', () => {
      const binSchema = Bin.schema;
      const levelPath = binSchema.paths.level;
      
      expect(levelPath.options.min).toBe(0);
      expect(levelPath.options.max).toBe(100);
    });
  });

  describe('Model Instance Creation Tests', () => {
    test('should create valid bin instance with required fields', () => {
      const binData = {
        binId: 'BIN-TEST-001',
        location: {
          lat: 6.9271,
          lng: 79.8612,
          address: 'Colombo, Sri Lanka'
        },
        level: 50,
        category: 'biodegradable'
      };

      const bin = new Bin(binData);
      
      expect(bin.binId).toBe('BIN-TEST-001');
      expect(bin.location.lat).toBe(6.9271);
      expect(bin.location.lng).toBe(79.8612);
      expect(bin.level).toBe(50);
      expect(bin.category).toBe('biodegradable');
    });

    test('should set default values correctly', () => {
      const binData = {
        binId: 'BIN-TEST-002',
        location: {
          lat: 6.9271,
          lng: 79.8612,
          address: 'Colombo, Sri Lanka'
        },
        level: 30,
        category: 'recyclable'
      };

      const bin = new Bin(binData);
      
      // Check default values
      expect(bin.status).toBe('ok'); // Default status
      expect(bin.mixed).toBe(false); // Default mixed value
      expect(bin.lastSeenAt).toBeInstanceOf(Date);
    });

    test('should validate required field constraints', () => {
      const incompleteBin = new Bin({});
      const validationError = incompleteBin.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.binId).toBeDefined();
      expect(validationError.errors['location.lat']).toBeDefined();
      expect(validationError.errors['location.lng']).toBeDefined();
      expect(validationError.errors['location.address']).toBeDefined();
      expect(validationError.errors.level).toBeDefined();
      expect(validationError.errors.category).toBeDefined();
    });

    test('should validate level constraints', () => {
      const invalidLevelBin = new Bin({
        binId: 'BIN-TEST-003',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test' },
        level: 150, // Invalid: over max
        category: 'biodegradable'
      });
      
      const validationError = invalidLevelBin.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.level).toBeDefined();
    });

    test('should validate category enum constraints', () => {
      const invalidCategoryBin = new Bin({
        binId: 'BIN-TEST-004',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test' },
        level: 50,
        category: 'invalid-category' // Invalid category
      });
      
      const validationError = invalidCategoryBin.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.category).toBeDefined();
    });

    test('should validate status enum constraints', () => {
      const invalidStatusBin = new Bin({
        binId: 'BIN-TEST-005',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test' },
        level: 50,
        category: 'biodegradable',
        status: 'invalid-status' // Invalid status
      });
      
      const validationError = invalidStatusBin.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.status).toBeDefined();
    });
  });

  describe('Location Sub-Schema Tests', () => {
    test('should validate location sub-schema', () => {
      const binWithInvalidLocation = new Bin({
        binId: 'BIN-TEST-006',
        location: {
          lat: 'invalid', // Should be number
          lng: 79.8612,
          address: 'Test'
        },
        level: 50,
        category: 'general'
      });
      
      const validationError = binWithInvalidLocation.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors['location.lat']).toBeDefined();
    });

    test('should accept valid location coordinates', () => {
      const binWithValidLocation = new Bin({
        binId: 'BIN-TEST-007',
        location: {
          lat: -90, // Valid boundary
          lng: 180, // Valid boundary
          address: 'Test Location'
        },
        level: 50,
        category: 'biodegradable'
      });
      
      const validationError = binWithValidLocation.validateSync();
      expect(validationError).toBeUndefined();
    });
  });

  describe('Business Logic Validation Tests', () => {
    test('should handle boundary level values correctly', () => {
      // Test minimum boundary
      const minLevelBin = new Bin({
        binId: 'BIN-TEST-008',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test' },
        level: 0, // Minimum valid level
        category: 'biodegradable'
      });
      
      expect(minLevelBin.validateSync()).toBeUndefined();

      // Test maximum boundary
      const maxLevelBin = new Bin({
        binId: 'BIN-TEST-009',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test' },
        level: 100, // Maximum valid level
        category: 'biodegradable'
      });
      
      expect(maxLevelBin.validateSync()).toBeUndefined();
    });

    test('should support all valid category types', () => {
      const categories = ['biodegradable', 'recyclable', 'non_biodegradable'];
      
      categories.forEach(category => {
        const bin = new Bin({
          binId: `BIN-TEST-${category}`,
          location: { lat: 6.9271, lng: 79.8612, address: 'Test' },
          level: 50,
          category: category
        });
        
        expect(bin.validateSync()).toBeUndefined();
        expect(bin.category).toBe(category);
      });
    });

    test('should support all valid status types', () => {
      const statuses = ['ok', 'segregation_required', 'maintenance_needed'];
      
      statuses.forEach(status => {
        const bin = new Bin({
          binId: `BIN-TEST-${status}`,
          location: { lat: 6.9271, lng: 79.8612, address: 'Test' },
          level: 50,
          category: 'biodegradable',
          status: status
        });
        
        expect(bin.validateSync()).toBeUndefined();
        expect(bin.status).toBe(status);
      });
    });

    test('should handle boolean mixed field correctly', () => {
      const mixedBin = new Bin({
        binId: 'BIN-TEST-MIXED',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test' },
        level: 75,
        category: 'biodegradable',
        mixed: true
      });
      
      expect(mixedBin.validateSync()).toBeUndefined();
      expect(mixedBin.mixed).toBe(true);
    });

    test('should handle date fields correctly', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      const dateBin = new Bin({
        binId: 'BIN-TEST-DATE',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test' },
        level: 60,
        category: 'recyclable',
        lastSeenAt: testDate
      });
      
      expect(dateBin.validateSync()).toBeUndefined();
      expect(dateBin.lastSeenAt).toEqual(testDate);
    });
  });

  describe('Model Methods and Functionality Tests', () => {
    test('should create bin instance with toJSON support', () => {
      const bin = new Bin({
        binId: 'BIN-TEST-JSON',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test' },
        level: 80,
        category: 'non_biodegradable'
      });
      
      const binJSON = bin.toJSON();
      expect(binJSON.binId).toBe('BIN-TEST-JSON');
      expect(binJSON.location.lat).toBe(6.9271);
      expect(binJSON.level).toBe(80);
      expect(binJSON.category).toBe('non_biodegradable');
    });

    test('should support model queries structure', () => {
      // Test that Bin model has expected query methods
      expect(typeof Bin.find).toBe('function');
      expect(typeof Bin.findOne).toBe('function');
      expect(typeof Bin.findById).toBe('function');
      expect(typeof Bin.create).toBe('function');
      expect(typeof Bin.updateOne).toBe('function');
      expect(typeof Bin.deleteOne).toBe('function');
    });

    test('should have proper schema indexes', () => {
      const indexes = Bin.schema.indexes();
      expect(indexes.length).toBeGreaterThan(0);
      
      // Check if binId has unique index
      const binIdIndex = indexes.find(index => index[0].binId);
      expect(binIdIndex).toBeDefined();
    });
  });
});

console.log('✅ Simplified Bin Model Tests - 25 tests covering schema validation and model functionality');