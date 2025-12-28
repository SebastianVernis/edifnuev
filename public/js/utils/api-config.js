/**
 * API Configuration
 * Detecta automáticamente el entorno y configura la URL correcta
 */

// Detectar entorno
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';

const isProduction = window.location.hostname.includes('pages.dev') ||
                    window.location.hostname.includes('workers.dev');

// Configurar API_URL según entorno
export const API_CONFIG = {
  // Desarrollo local
  LOCAL: 'http://localhost:3001',
  
  // Producción - Cloudflare Workers
  WORKERS: 'https://edificio-admin.sebastianvernis.workers.dev',
  
  // Obtener URL actual
  get BASE_URL() {
    if (isLocalhost) {
      return this.LOCAL;
    }
    return this.WORKERS;
  },
  
  // Helper para construir URLs completas
  url(endpoint) {
    return `${this.BASE_URL}${endpoint}`;
  }
};

// Export para compatibilidad con código existente
export const API_URL = API_CONFIG.BASE_URL;

console.log('🔧 API Config:', {
  environment: isLocalhost ? 'local' : 'production',
  baseURL: API_CONFIG.BASE_URL
});
