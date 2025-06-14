module.exports = {
  setupFiles: ['jest-canvas-mock'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^chroma-js$': '<rootDir>/node_modules/chroma-js/dist/chroma.cjs'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/?(*.)+(spec|test).(js|jsx|ts|tsx)'
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json']
}
