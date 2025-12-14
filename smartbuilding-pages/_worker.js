/**
 * Cloudflare Pages Proxy to Workers
 * Proxy all requests to the main Worker
 */
export default {
  async fetch(request, env) {
    const workerUrl = 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev';
    const url = new URL(request.url);
    
    // Construir URL destino manteniendo path y query
    const targetUrl = new URL(workerUrl);
    targetUrl.pathname = url.pathname;
    targetUrl.search = url.search;
    
    console.log(`Proxying: ${url.pathname} -> ${targetUrl.href}`);
    
    // Proxy request completo
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    // Return response con headers CORS si es necesario
    return response;
  }
}
