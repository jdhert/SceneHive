const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  reporters: process.env.CI
    ? [
        'default',
        ['jest-junit', { outputDirectory: 'test-results', outputName: 'junit.xml' }],
      ]
    : ['default'],
};

module.exports = createJestConfig(customJestConfig);
