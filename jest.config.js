module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverageFrom: [
    'content.js',
    'grammar_engine.js',
    'popup.js',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test.js',
  ],
  testMatch: [
    '**/test.js',
  ],
};

