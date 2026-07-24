import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pkg = require('./package.json') as {
  dependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Keep npm packages (and subpaths like @prisma/client/runtime/client) external
 * in the Electron main process. Bundling those CJS/ESM packages into the main
 * bundle strips their `__filename` shims and crashes the Windows installer.
 */
function externalNodePackages(): Plugin {
  const depNames = Object.keys({
    ...pkg.dependencies,
    ...pkg.optionalDependencies,
  })

  // Rolldown (Vite 8) only accepts string | RegExp — not functions.
  const external: Array<string | RegExp> = [
    'electron',
    /^node:/,
    // Common Node builtins imported without the node: prefix
    'fs',
    'path',
    'url',
    'os',
    'crypto',
    'module',
    'util',
    'stream',
    'events',
    'buffer',
    'assert',
    'child_process',
    'worker_threads',
    'diagnostics_channel',
    'async_hooks',
    'tty',
    'net',
    'http',
    'https',
    'zlib',
    'readline',
    ...depNames,
    ...depNames.map((name) => new RegExp(`^${escapeRegExp(name)}/`)),
    // Transitive packages that must stay on disk for native bindings
    /^@prisma\//,
    /^@libsql\//,
    /^libsql(\/|$)/,
  ]

  return {
    name: 'pos:external-node-packages',
    enforce: 'pre',
    config() {
      return {
        build: {
          rollupOptions: {
            external,
          },
        },
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          plugins: [externalNodePackages()],
          build: {
            rollupOptions: {
              output: {
                inlineDynamicImports: true,
              },
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          build: {
            // Preload must be CJS: package.json is "type":"module", so .mjs
            // files cannot use require("electron") and fail to load in production.
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: '[name].cjs',
                inlineDynamicImports: true,
              },
            },
          },
        },
      },
    }),
  ],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@tanstack')) return 'tanstack'
          if (id.includes('react-router')) return 'router'
          if (id.includes('zustand') || id.includes('zod')) return 'state'
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('purify')) {
            return 'export'
          }
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
        },
      },
    },
  },
})
