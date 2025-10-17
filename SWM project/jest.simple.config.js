/**
 * @fileoverview Simple Jest Configuration for Field Operations Testing
 */

export default {
  displayName: 'Field Operations Tests',
  testEnvironment: 'node',
  testMatch: [
    '**/backend/src/test/**/*.test.js'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html'],
  collectCoverageFrom: [
    'backend/src/**/*.js',
    '!backend/src/test/**/*.js'
  ],
  verbose: true
};