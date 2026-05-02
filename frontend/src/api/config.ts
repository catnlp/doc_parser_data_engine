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
  remoteOcr: {
    url: import.meta.env.VITE_REMOTE_OCR_API_URL || 'http://192.168.3.10:8899',
    endpoint: '/ocr/file',
    timeout: 60000,
    enabled: import.meta.env.VITE_USE_REMOTE_OCR !== 'false',
  },
  formulaApi: {
    url: import.meta.env.VITE_FORMULA_API_URL || 'http://192.168.3.10:8899',
    endpoint: '/formula/file',
    timeout: 60000,
    enabled: import.meta.env.VITE_USE_FORMULA_API !== 'false',
  },
  tableApi: {
    url: import.meta.env.VITE_TABLE_API_URL || 'http://192.168.3.10:8899',
    endpoint: '/table/file',
    timeout: 60000,
    enabled: import.meta.env.VITE_USE_TABLE_API !== 'false',
  },
  parseConcurrency: parseInt(import.meta.env.VITE_PARSE_CONCURRENCY || '3', 10),
};
