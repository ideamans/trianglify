module.exports = {
  setupFiles: ['jest-canvas-mock'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^chroma-js$': '<rootDir>/node_modules/chroma-js/dist/chroma.cjs'
  }
}