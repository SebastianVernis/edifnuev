/**
 * Global Configuration
 * Auto-detecta entorno y configura API URL
 */

(function() {
  'use strict';
  
  // Detectar entorno
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPages = hostname.includes('.pages.dev');
  const isWorkers = hostname.includes('.workers.dev');
  
  // Configurar API_BASE_URL
  let API_BASE_URL;
  
  if (isLocalhost) {
    // Desarrollo local - backend local
    API_BASE_URL = 'http://localhost:3001';
  } else if (isPages || isWorkers) {
    // Producción - usar Worker API
    API_BASE_URL = 'https://edificio-admin.sebastianvernis.workers.dev';
  } else {
    // Fallback - usar rutas relativas
    API_BASE_URL = '';
  }
  
  // Configuración global
  window.APP_CONFIG = {
    API_BASE_URL: API_BASE_URL,
    ENVIRONMENT: isLocalhost ? 'development' : 'production',
    VERSION: '2.0.0',
    
    // Helper para construir URLs
    apiUrl: function(endpoint) {
      // Si endpoint ya es absoluto, devolverlo
      if (endpoint.startsWith('http')) {
        return endpoint;
      }
      // Si empieza con /, concatenar con base
      if (endpoint.startsWith('/')) {
        return this.API_BASE_URL + endpoint;
      }
      // Sino, agregar /api/ prefix
      return this.API_BASE_URL + '/api/' + endpoint;
    }
  };
  
  console.log('🔧 App Config:', {
    environment: window.APP_CONFIG.ENVIRONMENT,
    apiBaseUrl: window.APP_CONFIG.API_BASE_URL,
    hostname: hostname
  });
  
  // Interceptar fetch para agregar base URL automáticamente
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Si la URL empieza con /api/, agregar base URL
    if (typeof url === 'string' && url.startsWith('/api/')) {
      url = window.APP_CONFIG.API_BASE_URL + url;
    }
    return originalFetch(url, options);
  };
  
})();
