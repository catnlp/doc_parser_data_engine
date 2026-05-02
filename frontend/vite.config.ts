import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-pdf')) return 'vendor-pdf';
            if (id.includes('@codemirror') || id.includes('@uiw/react-codemirror')) return 'vendor-editor';
            if (id.includes('react-markdown') || id.includes('remark-') || id.includes('rehype-katex') || id.includes('katex')) return 'vendor-markdown';
          }
        },
      },
    },
  },
})
