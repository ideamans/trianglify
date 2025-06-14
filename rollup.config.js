import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import bundleSize from 'rollup-plugin-bundle-size'
import pkg from './package.json'

export default [
  { // build for node & module bundlers
    input: 'src/trianglify.ts',
    external: ['chroma-js', 'delaunator', 'canvas'],
    plugins: [typescript({ tsconfig: './tsconfig.json' }), babel({ babelHelpers: 'bundled', extensions: ['.js', '.ts'] }), bundleSize()],
    output: { file: pkg.main, format: 'cjs', exports: 'default' }
  },
  {
    // build minified bundle to be used standalone for browser use
    // note: // chroma.js weighs 40k minified, a smaller solution would be nice
    input: 'src/trianglify.ts',
    plugins: [typescript({ tsconfig: './tsconfig.json' }), resolve({ browser: true }), commonjs(), babel({ babelHelpers: 'bundled', extensions: ['.js', '.ts'] }), terser({ output: { comments: false } }), bundleSize()],
    output: { file: 'dist/trianglify.bundle.js', format: 'umd', name: 'trianglify' }
  },
  {
    // build non-minified bundle to be used for debugging
    input: 'src/trianglify.ts',
    plugins: [typescript({ tsconfig: './tsconfig.json' }), resolve({ browser: true }), commonjs(), babel({ babelHelpers: 'bundled', extensions: ['.js', '.ts'] }), bundleSize()],
    output: { file: 'dist/trianglify.bundle.debug.js', format: 'umd', name: 'trianglify' }
  }
]
