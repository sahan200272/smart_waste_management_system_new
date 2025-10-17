/**
 * @fileoverview Jest Configuration for Field Operations Module
 * Comprehensive testing setup with ES modules and coverage thresholds
 */

module.exports = {
  displayName: "Field Operations Backend Tests",
  testEnvironment: "node",
  
  // Test file patterns
  testMatch: [
    "**/tests/server/fieldops/**/*.test.js"
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    "<rootDir>/tests/server/fieldops/setup.js"
  ],
  
  // ES modules support
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  transform: {},
  
  // Module handling
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // Coverage configuration
  collectCoverage: false, // Enable via CLI flag
  coverageDirectory: "coverage/fieldops",
  collectCoverageFrom: [
    "backend/src/features/fieldops/**/*.js",
    "!backend/src/features/fieldops/**/*.test.js",
    "!**/node_modules/**"
  ],
  coverageReporters: [
    "text",
    "lcov",
    "html"
  ],
  
  // Coverage thresholds - University rubric quality
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    "./backend/src/features/fieldops/": {
      branches: 80,
      functions: 85,
      lines: 85
    }
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true
};