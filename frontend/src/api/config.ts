export const API_CONFIG = {
  layoutModel: {
    url: import.meta.env.VITE_LAYOUT_API_URL || 'http://localhost:8002',
    endpoint: '/api/layout',
    timeout: 60000,
  },
  ocrModel: {
    url: import.meta.env.VITE_OCR_API_URL || 'http://localhost:8002',
    endpoint: '/api/parse',
    timeout: 60000,
  },
};
