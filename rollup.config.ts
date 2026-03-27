import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

const tsPlugin = () =>
  typescript({
    tsconfig: './tsconfig.json',
    compilerOptions: {
      declaration: false,
      declarationMap: false,
      sourceMap: false,
    },
  });

const basePlugins = (browser = false) => [
  nodeResolve({ browser }),
  commonjs(),
  json(),
  tsPlugin(),
];

const config = [
  // 1. CJS for Node.js (require)
  {
    input: 'src/platform/node.ts',
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      exports: 'named',
    },
    external: ['ws', 'lowdb', 'lowdb/adapters/FileSync'],
    plugins: basePlugins(),
  },

  // 2. ESM for modern bundlers / Node ESM
  {
    input: 'src/platform/node.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
    },
    external: ['ws', 'lowdb', 'lowdb/adapters/FileSync'],
    plugins: basePlugins(),
  },

  // 3. IIFE for browsers (uses native WebSocket, no ws)
  {
    input: 'src/platform/browser.ts',
    output: {
      file: 'dist/douyudm.browser.min.js',
      format: 'iife',
      name: 'douyudm',
      exports: 'named',
    },
    plugins: [...basePlugins(true), terser()],
  },

  // 4. CLI binary (bundles everything needed)
  {
    input: 'src/cli/cmd.ts',
    output: {
      file: 'dist/cli/cmd.js',
      format: 'cjs',
      banner: '#!/usr/bin/env node',
    },
    external: ['ws', 'lowdb', 'lowdb/adapters/FileSync', 'commander'],
    plugins: basePlugins(),
  },
];

export default config;
