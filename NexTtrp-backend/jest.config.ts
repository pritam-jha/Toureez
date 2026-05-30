import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Only look for tests inside src/__tests__/
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  // ts-jest compiles with the same tsconfig used for production.
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  // Give each test file a generous timeout — integration tests can be slow.
  testTimeout: 15000,
  // Clear mock state between tests.
  clearMocks: true,
  restoreMocks: true,
};

export default config;
