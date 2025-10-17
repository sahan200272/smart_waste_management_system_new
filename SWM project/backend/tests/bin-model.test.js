/**
 * Comprehensive Bin Model Tests
 * Tests for Smart Waste Management System - Bin Model/Schema
 */

const mongoose = require('mongoose');
const Bin = require('../src/model/Bin.js');

describe('Bin Model - Database Schema and Validation Tests', () => {
  
  beforeAll(async () => {
    // Connect to in-memory database for testing
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/test-bin-model', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all test data before each test
    await Bin.deleteMany({});
  });

  describe('Schema Validation - Required Fields', () => {
    test('should create bin with all required fields', async () => {
      const binData = {
        binId: 'BIN-MODEL-001',
        location: {
          lat: 6.9271,
          lng: 79.8612,
          address: 'Test Location'
        },
        level: 45,
        category: 'biodegradable'
      };

      const bin = new Bin(binData);
      const savedBin = await bin.save();

      expect(savedBin._id).toBeDefined();
      expect(savedBin.binId).toBe('BIN-MODEL-001');
      expect(savedBin.level).toBe(45);
      expect(savedBin.category).toBe('biodegradable');
      expect(savedBin.status).toBe('ok'); // Default value
      expect(savedBin.mixed).toBe(false); // Default value
      expect(savedBin.lastSeenAt).toBeDefined();
    });

    test('should fail validation when binId is missing', async () => {
      const binData = {
        location: {
          lat: 6.9271,
          lng: 79.8612,
          address: 'Test Location'
        },
        level: 45,
        category: 'biodegradable'
      };

      const bin = new Bin(binData);
      
      await expect(bin.save()).rejects.toThrow(/binId.*required/);
    });

    test('should fail validation when location is missing', async () => {
      const binData = {
        binId: 'BIN-MODEL-002',
        level: 45,
        category: 'biodegradable'
      };

      const bin = new Bin(binData);
      
      await expect(bin.save()).rejects.toThrow(/location.*required/);
    });

    test('should fail validation when level is missing', async () => {
      const binData = {
        binId: 'BIN-MODEL-003',
        location: {
          lat: 6.9271,
          lng: 79.8612,
          address: 'Test Location'
        },
        category: 'biodegradable'
      };

      const bin = new Bin(binData);
      
      await expect(bin.save()).rejects.toThrow(/level.*required/);
    });

    test('should fail validation when category is missing', async () => {
      const binData = {
        binId: 'BIN-MODEL-004',
        location: {
          lat: 6.9271,
          lng: 79.8612,
          address: 'Test Location'
        },
        level: 45
      };

      const bin = new Bin(binData);
      
      await expect(bin.save()).rejects.toThrow(/category.*required/);
    });
  });

  describe('Schema Validation - Field Constraints', () => {
    test('should enforce unique binId constraint', async () => {
      const binData1 = {
        binId: 'BIN-UNIQUE-001',
        location: { lat: 6.9271, lng: 79.8612, address: 'Location 1' },
        level: 45,
        category: 'biodegradable'
      };

      const binData2 = {
        binId: 'BIN-UNIQUE-001', // Same binId
        location: { lat: 6.9281, lng: 79.8622, address: 'Location 2' },
        level: 60,
        category: 'recyclable'
      };

      const bin1 = new Bin(binData1);
      await bin1.save();

      const bin2 = new Bin(binData2);
      await expect(bin2.save()).rejects.toThrow(/duplicate key.*binId/);
    });

    test('should enforce level minimum constraint (>= 0)', async () => {
      const binData = {
        binId: 'BIN-LEVEL-MIN',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
        level: -5, // Invalid
        category: 'biodegradable'
      };

      const bin = new Bin(binData);
      await expect(bin.save()).rejects.toThrow(/level.*Path.*-5.*less than minimum/);
    });

    test('should enforce level maximum constraint (<= 100)', async () => {
      const binData = {
        binId: 'BIN-LEVEL-MAX',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
        level: 105, // Invalid
        category: 'biodegradable'
      };

      const bin = new Bin(binData);
      await expect(bin.save()).rejects.toThrow(/level.*Path.*105.*more than maximum/);
    });

    test('should accept valid level boundary values', async () => {
      // Test level 0
      const bin1 = new Bin({
        binId: 'BIN-LEVEL-0',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
        level: 0,
        category: 'biodegradable'
      });
      await expect(bin1.save()).resolves.toBeTruthy();

      // Test level 100
      const bin2 = new Bin({
        binId: 'BIN-LEVEL-100',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
        level: 100,
        category: 'recyclable'
      });
      await expect(bin2.save()).resolves.toBeTruthy();
    });

    test('should enforce category enum constraint', async () => {
      const invalidCategories = ['invalid', 'garbage', 'waste', ''];
      
      for (const invalidCategory of invalidCategories) {
        const binData = {
          binId: `BIN-CAT-${invalidCategory || 'empty'}`,
          location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
          level: 45,
          category: invalidCategory
        };

        const bin = new Bin(binData);
        await expect(bin.save()).rejects.toThrow(/`.*` is not a valid enum value for path `category`/);
      }
    });

    test('should accept valid category values', async () => {
      const validCategories = ['biodegradable', 'recyclable', 'non_biodegradable'];
      
      for (let i = 0; i < validCategories.length; i++) {
        const binData = {
          binId: `BIN-VALID-CAT-${i}`,
          location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
          level: 45,
          category: validCategories[i]
        };

        const bin = new Bin(binData);
        const savedBin = await bin.save();
        expect(savedBin.category).toBe(validCategories[i]);
      }
    });

    test('should enforce status enum constraint', async () => {
      const invalidStatuses = ['invalid', 'broken', 'full', ''];
      
      for (const invalidStatus of invalidStatuses) {
        const binData = {
          binId: `BIN-STATUS-${invalidStatus || 'empty'}`,
          location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
          level: 45,
          category: 'biodegradable',
          status: invalidStatus
        };

        const bin = new Bin(binData);
        await expect(bin.save()).rejects.toThrow(/`.*` is not a valid enum value for path `status`/);
      }
    });

    test('should accept valid status values', async () => {
      const validStatuses = ['ok', 'segregation_required', 'maintenance_needed'];
      
      for (let i = 0; i < validStatuses.length; i++) {
        const binData = {
          binId: `BIN-VALID-STATUS-${i}`,
          location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
          level: 45,
          category: 'biodegradable',
          status: validStatuses[i]
        };

        const bin = new Bin(binData);
        const savedBin = await bin.save();
        expect(savedBin.status).toBe(validStatuses[i]);
      }
    });
  });

  describe('Schema Default Values', () => {
    test('should set default values correctly', async () => {
      const binData = {
        binId: 'BIN-DEFAULTS-001',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
        level: 45,
        category: 'biodegradable'
        // No mixed, status, faultCode, lastSeenAt provided
      };

      const bin = new Bin(binData);
      const savedBin = await bin.save();

      expect(savedBin.mixed).toBe(false); // Default
      expect(savedBin.status).toBe('ok'); // Default
      expect(savedBin.faultCode).toBeNull(); // Default
      expect(savedBin.lastSeenAt).toBeDefined(); // Auto-generated
      expect(savedBin.lastSeenAt).toBeInstanceOf(Date);
    });

    test('should allow overriding default values', async () => {
      const customDate = new Date('2024-01-01T12:00:00Z');
      const binData = {
        binId: 'BIN-CUSTOM-001',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
        level: 45,
        category: 'biodegradable',
        mixed: true,
        status: 'segregation_required',
        faultCode: 'mixed_waste_detected',
        lastSeenAt: customDate
      };

      const bin = new Bin(binData);
      const savedBin = await bin.save();

      expect(savedBin.mixed).toBe(true);
      expect(savedBin.status).toBe('segregation_required');
      expect(savedBin.faultCode).toBe('mixed_waste_detected');
      expect(savedBin.lastSeenAt.getTime()).toBe(customDate.getTime());
    });
  });

  describe('Location Sub-Schema Validation', () => {
    test('should require all location fields', async () => {
      const binDataMissingLat = {
        binId: 'BIN-LOC-001',
        location: {
          lng: 79.8612,
          address: 'Test Location'
        },
        level: 45,
        category: 'biodegradable'
      };

      const bin1 = new Bin(binDataMissingLat);
      await expect(bin1.save()).rejects.toThrow(/location.lat.*required/);

      const binDataMissingLng = {
        binId: 'BIN-LOC-002',
        location: {
          lat: 6.9271,
          address: 'Test Location'
        },
        level: 45,
        category: 'biodegradable'
      };

      const bin2 = new Bin(binDataMissingLng);
      await expect(bin2.save()).rejects.toThrow(/location.lng.*required/);

      const binDataMissingAddress = {
        binId: 'BIN-LOC-003',
        location: {
          lat: 6.9271,
          lng: 79.8612
        },
        level: 45,
        category: 'biodegradable'
      };

      const bin3 = new Bin(binDataMissingAddress);
      await expect(bin3.save()).rejects.toThrow(/location.address.*required/);
    });

    test('should validate location coordinate types', async () => {
      const binDataInvalidLat = {
        binId: 'BIN-LAT-001',
        location: {
          lat: 'invalid', // Should be number
          lng: 79.8612,
          address: 'Test Location'
        },
        level: 45,
        category: 'biodegradable'
      };

      const bin1 = new Bin(binDataInvalidLat);
      await expect(bin1.save()).rejects.toThrow(/Cast to Number failed/);

      const binDataInvalidLng = {
        binId: 'BIN-LNG-001',
        location: {
          lat: 6.9271,
          lng: 'invalid', // Should be number
          address: 'Test Location'
        },
        level: 45,
        category: 'biodegradable'
      };

      const bin2 = new Bin(binDataInvalidLng);
      await expect(bin2.save()).rejects.toThrow(/Cast to Number failed/);
    });

    test('should accept valid coordinate ranges', async () => {
      const validCoordinates = [
        { lat: -90, lng: -180 }, // Min values
        { lat: 90, lng: 180 },   // Max values
        { lat: 0, lng: 0 },      // Zero values
        { lat: 6.9271, lng: 79.8612 }, // Typical Colombo coordinates
        { lat: -34.6037, lng: -58.3816 } // Buenos Aires (negative)
      ];

      for (let i = 0; i < validCoordinates.length; i++) {
        const binData = {
          binId: `BIN-COORD-${i}`,
          location: {
            lat: validCoordinates[i].lat,
            lng: validCoordinates[i].lng,
            address: `Test Location ${i}`
          },
          level: 45,
          category: 'biodegradable'
        };

        const bin = new Bin(binData);
        const savedBin = await bin.save();
        expect(savedBin.location.lat).toBe(validCoordinates[i].lat);
        expect(savedBin.location.lng).toBe(validCoordinates[i].lng);
      }
    });
  });

  describe('Data Type Validation', () => {
    test('should validate mixed field as boolean', async () => {
      const invalidMixedValues = ['true', 'false', 1, 0, 'yes', 'no'];
      
      for (const invalidValue of invalidMixedValues) {
        const binData = {
          binId: `BIN-MIXED-${invalidValue}`,
          location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
          level: 45,
          category: 'biodegradable',
          mixed: invalidValue
        };

        const bin = new Bin(binData);
        const savedBin = await bin.save();
        
        // Mongoose will cast truthy/falsy values to boolean
        expect(typeof savedBin.mixed).toBe('boolean');
      }
    });

    test('should validate lastSeenAt as Date', async () => {
      const binData = {
        binId: 'BIN-DATE-001',
        location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
        level: 45,
        category: 'biodegradable',
        lastSeenAt: 'invalid-date'
      };

      const bin = new Bin(binData);
      await expect(bin.save()).rejects.toThrow(/Cast to date failed/);
    });

    test('should accept valid date formats for lastSeenAt', async () => {
      const validDates = [
        new Date(),
        new Date('2024-01-01'),
        new Date('2024-01-01T12:00:00Z'),
        Date.now()
      ];

      for (let i = 0; i < validDates.length; i++) {
        const binData = {
          binId: `BIN-VALID-DATE-${i}`,
          location: { lat: 6.9271, lng: 79.8612, address: 'Test Location' },
          level: 45,
          category: 'biodegradable',
          lastSeenAt: validDates[i]
        };

        const bin = new Bin(binData);
        const savedBin = await bin.save();
        expect(savedBin.lastSeenAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('CRUD Operations', () => {
    test('should perform create operation successfully', async () => {
      const binData = {
        binId: 'BIN-CRUD-CREATE',
        location: { lat: 6.9271, lng: 79.8612, address: 'CRUD Test Location' },
        level: 75,
        category: 'recyclable'
      };

      const bin = new Bin(binData);
      const savedBin = await bin.save();

      expect(savedBin._id).toBeDefined();
      expect(savedBin.binId).toBe('BIN-CRUD-CREATE');
    });

    test('should perform read operations successfully', async () => {
      // Create test data
      const binData = {
        binId: 'BIN-CRUD-READ',
        location: { lat: 6.9271, lng: 79.8612, address: 'CRUD Test Location' },
        level: 80,
        category: 'non_biodegradable'
      };
      const bin = new Bin(binData);
      await bin.save();

      // Test findOne
      const foundBin = await Bin.findOne({ binId: 'BIN-CRUD-READ' });
      expect(foundBin).toBeTruthy();
      expect(foundBin.level).toBe(80);

      // Test find
      const foundBins = await Bin.find({ category: 'non_biodegradable' });
      expect(foundBins.length).toBeGreaterThan(0);
    });

    test('should perform update operations successfully', async () => {
      // Create test data
      const binData = {
        binId: 'BIN-CRUD-UPDATE',
        location: { lat: 6.9271, lng: 79.8612, address: 'CRUD Test Location' },
        level: 30,
        category: 'biodegradable'
      };
      const bin = new Bin(binData);
      await bin.save();

      // Update
      await Bin.updateOne(
        { binId: 'BIN-CRUD-UPDATE' },
        { level: 95, status: 'segregation_required' }
      );

      // Verify update
      const updatedBin = await Bin.findOne({ binId: 'BIN-CRUD-UPDATE' });
      expect(updatedBin.level).toBe(95);
      expect(updatedBin.status).toBe('segregation_required');
    });

    test('should perform delete operations successfully', async () => {
      // Create test data
      const binData = {
        binId: 'BIN-CRUD-DELETE',
        location: { lat: 6.9271, lng: 79.8612, address: 'CRUD Test Location' },
        level: 40,
        category: 'recyclable'
      };
      const bin = new Bin(binData);
      await bin.save();

      // Delete
      await Bin.deleteOne({ binId: 'BIN-CRUD-DELETE' });

      // Verify deletion
      const deletedBin = await Bin.findOne({ binId: 'BIN-CRUD-DELETE' });
      expect(deletedBin).toBeNull();
    });
  });

  describe('Query Operations and Indexing', () => {
    beforeEach(async () => {
      // Create multiple test bins
      const testBins = [
        { binId: 'BIN-Q-001', location: { lat: 6.9271, lng: 79.8612, address: 'Location 1' }, level: 20, category: 'biodegradable', status: 'ok' },
        { binId: 'BIN-Q-002', location: { lat: 6.9281, lng: 79.8622, address: 'Location 2' }, level: 60, category: 'recyclable', status: 'ok' },
        { binId: 'BIN-Q-003', location: { lat: 6.9291, lng: 79.8632, address: 'Location 3' }, level: 90, category: 'non_biodegradable', status: 'segregation_required' },
        { binId: 'BIN-Q-004', location: { lat: 6.9301, lng: 79.8642, address: 'Location 4' }, level: 95, category: 'biodegradable', status: 'maintenance_needed' }
      ];
      await Bin.insertMany(testBins);
    });

    test('should query by status efficiently', async () => {
      const okBins = await Bin.find({ status: 'ok' });
      const segregationBins = await Bin.find({ status: 'segregation_required' });
      const maintenanceBins = await Bin.find({ status: 'maintenance_needed' });

      expect(okBins).toHaveLength(2);
      expect(segregationBins).toHaveLength(1);
      expect(maintenanceBins).toHaveLength(1);
    });

    test('should query by level ranges', async () => {
      const lowFillBins = await Bin.find({ level: { $lt: 50 } });
      const mediumFillBins = await Bin.find({ level: { $gte: 50, $lt: 85 } });
      const highFillBins = await Bin.find({ level: { $gte: 85 } });

      expect(lowFillBins).toHaveLength(1);
      expect(mediumFillBins).toHaveLength(1);
      expect(highFillBins).toHaveLength(2);
    });

    test('should query by category', async () => {
      const biodegradableBins = await Bin.find({ category: 'biodegradable' });
      const recyclableBins = await Bin.find({ category: 'recyclable' });
      const nonBiodegradableBins = await Bin.find({ category: 'non_biodegradable' });

      expect(biodegradableBins).toHaveLength(2);
      expect(recyclableBins).toHaveLength(1);
      expect(nonBiodegradableBins).toHaveLength(1);
    });

    test('should support complex queries', async () => {
      // Bins that need attention (high fill or segregation required)
      const attentionBins = await Bin.find({
        $or: [
          { level: { $gte: 85 } },
          { status: 'segregation_required' }
        ]
      });

      expect(attentionBins).toHaveLength(3); // BIN-Q-003 and BIN-Q-004 and BIN-Q-003 again (overlap)
    });

    test('should support sorting and limiting', async () => {
      // Get top 2 bins by fill level
      const topFillBins = await Bin.find().sort({ level: -1 }).limit(2);
      
      expect(topFillBins).toHaveLength(2);
      expect(topFillBins[0].level).toBe(95);
      expect(topFillBins[1].level).toBe(90);
    });
  });
});

console.log('✅ Comprehensive Bin Model Tests - 30 tests covering schema validation, CRUD operations, and queries');