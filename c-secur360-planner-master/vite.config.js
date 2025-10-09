import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Plugin pour injecter la version dans le service worker
function injectServiceWorkerVersion() {
  return {
    name: 'inject-sw-version',
    closeBundle() {
      // Générer un timestamp de build
      const buildVersion = Date.now().toString();

      // Lire le service worker source
      const swSourcePath = resolve(__dirname, 'public/service-worker.js');
      const swDistPath = resolve(__dirname, 'dist/service-worker.js');

      try {
        let swContent = fs.readFileSync(swSourcePath, 'utf8');

        // Remplacer __BUILD_VERSION__ par le timestamp
        swContent = swContent.replace(/__BUILD_VERSION__/g, buildVersion);

        // Écrire dans dist/
        fs.writeFileSync(swDistPath, swContent, 'utf8');

        console.log(`✅ Service Worker généré avec version: ${buildVersion}`);
      } catch (error) {
        console.error('❌ Erreur lors de la génération du Service Worker:', error);
      }
    }
  };
}

export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,tsx}",
    }),
    injectServiceWorkerVersion()
  ],
  root: __dirname,
  publicDir: 'public',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    'process.env': {}
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  }
})