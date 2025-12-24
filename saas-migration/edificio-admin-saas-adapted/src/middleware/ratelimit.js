/**
 * Rate Limiting Middleware para Cloudflare Workers
 * Protege contra abuso y reduce carga del Worker
 */

/**
 * Rate limiting usando KV
 * @param {Request} request 
 * @param {object} env 
 * @param {object} options - { max: number, windowSeconds: number, keyPrefix: string }
 */
export async function rateLimit(request, env, options = {}) {
  const {
    max = 10,
    windowSeconds = 60,
    keyPrefix = 'ratelimit'
  } = options;

  // Obtener IP del cliente
  const ip = request.headers.get('CF-Connecting-IP') || 
             request.headers.get('X-Forwarded-For') || 
             'unknown';
  
  const url = new URL(request.url);
  const endpoint = url.pathname;
  
  // Key única por IP + endpoint
  const key = `${keyPrefix}:${ip}:${endpoint}`;
  
  try {
    // Obtener contador actual del KV
    const currentCount = await env.RATE_LIMIT?.get(key);
    const count = currentCount ? parseInt(currentCount) : 0;
    
    // Verificar límite
    if (count >= max) {
      return new Response(
        JSON.stringify({
          ok: false,
          msg: 'Demasiadas solicitudes. Por favor intente más tarde.',
          retryAfter: windowSeconds
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': windowSeconds.toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + (windowSeconds * 1000)).toString()
          }
        }
      );
    }
    
    // Incrementar contador
    await env.RATE_LIMIT?.put(key, (count + 1).toString(), {
      expirationTtl: windowSeconds
    });
    
    // Agregar headers informativos
    request.rateLimitInfo = {
      limit: max,
      remaining: max - count - 1,
      reset: Date.now() + (windowSeconds * 1000)
    };
    
    return null; // Continuar con el request
    
  } catch (error) {
    // Si falla el rate limiting, permitir el request
    console.error('Rate limit error:', error);
    return null;
  }
}

/**
 * Wrapper para aplicar rate limiting a un handler
 */
export function withRateLimit(handler, options = {}) {
  return async (request, env, ctx) => {
    const rateLimitResponse = await rateLimit(request, env, options);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Ejecutar handler original
    const response = await handler(request, env, ctx);
    
    // Agregar headers de rate limit a la respuesta
    if (request.rateLimitInfo && response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', request.rateLimitInfo.limit.toString());
      response.headers.set('X-RateLimit-Remaining', request.rateLimitInfo.remaining.toString());
      response.headers.set('X-RateLimit-Reset', request.rateLimitInfo.reset.toString());
    }
    
    return response;
  };
}

/**
 * Rate limiting específico para login (más estricto)
 */
export function loginRateLimit(request, env) {
  return rateLimit(request, env, {
    max: 50,          // 50 intentos (suficiente para testing)
    windowSeconds: 60, // en 1 minuto
    keyPrefix: 'login'
  });
}

/**
 * Rate limiting para registro
 */
export function registroRateLimit(request, env) {
  return rateLimit(request, env, {
    max: 3,           // 3 intentos
    windowSeconds: 600, // en 10 minutos
    keyPrefix: 'registro'
  });
}

/**
 * Rate limiting general para APIs
 */
export function apiRateLimit(request, env) {
  return rateLimit(request, env, {
    max: 100,         // 100 requests
    windowSeconds: 60, // por minuto
    keyPrefix: 'api'
  });
}

export default { rateLimit, withRateLimit, loginRateLimit, registroRateLimit, apiRateLimit };
