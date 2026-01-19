/**
 * Email Verification Utility usando APILayer
 * Valida emails en tiempo real para prevenir registros con emails inválidos o desechables
 */

/**
 * Verificar email usando APILayer Email Verification API
 * @param {string} email - Email a verificar
 * @param {Object} env - Environment variables (para Cloudflare Workers)
 * @returns {Promise<Object>} Resultado de la verificación
 */
export async function verifyEmail(email, env = null) {
  try {
    // Validación básica de formato
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return {
        ok: false,
        valid: false,
        reason: 'invalid_format',
        message: 'Formato de email inválido',
        details: null
      };
    }

    // Obtener API key desde env (Cloudflare Workers) o process.env (Node.js)
    const apiKey = env?.APILAYER_API_KEY || process.env.APILAYER_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ APILAYER_API_KEY no configurada. Usando validación básica.');
      return basicEmailValidation(email);
    }

    // Llamar a APILayer Email Verification API
    const url = `https://api.apilayer.com/email_verification/check?email=${encodeURIComponent(email)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': apiKey
      }
    });

    if (!response.ok) {
      console.error('❌ Error en APILayer:', response.status, response.statusText);
      // Fallback a validación básica si la API falla
      return basicEmailValidation(email);
    }

    const data = await response.json();

    // Analizar respuesta de APILayer
    const result = analyzeEmailVerification(data);
    
    console.log(`📧 Email verificado: ${email} - Válido: ${result.valid} - Score: ${data.score}`);
    
    return result;

  } catch (error) {
    console.error('❌ Error verificando email:', error);
    // Fallback a validación básica en caso de error
    return basicEmailValidation(email);
  }
}

/**
 * Analizar respuesta de APILayer y determinar si el email es válido
 * @param {Object} data - Respuesta de APILayer
 * @returns {Object} Resultado analizado
 */
function analyzeEmailVerification(data) {
  const {
    email,
    format_valid,
    mx_found,
    smtp_check,
    disposable,
    free,
    score,
    did_you_mean
  } = data;

  // Criterios de validación
  // Nota: Score puede ser bajo para emails genéricos pero válidos (ej: test@gmail.com)
  // Priorizamos: formato válido, MX encontrado, y NO desechable
  const isValid = 
    format_valid === true &&
    mx_found === true &&
    disposable === false;
  
  // Advertencia si el score es muy bajo (pero no rechazar)
  const lowScore = score !== null && score < 0.3;

  // Determinar razón de rechazo
  let reason = null;
  let message = 'Email válido';
  let warning = null;

  if (!format_valid) {
    reason = 'invalid_format';
    message = 'El formato del email es inválido';
  } else if (!mx_found) {
    reason = 'no_mx_records';
    message = 'El dominio del email no tiene registros MX válidos';
  } else if (disposable) {
    reason = 'disposable_email';
    message = 'No se permiten emails temporales o desechables';
  } else if (lowScore) {
    // Advertencia pero no rechazo
    warning = `Email con score bajo (${score}). Verifica que sea correcto.`;
  }

  // Sugerencia de corrección si existe
  if (did_you_mean && did_you_mean !== '') {
    message += ` ¿Quisiste decir ${did_you_mean}?`;
  }

  return {
    ok: true,
    valid: isValid,
    reason,
    message,
    warning,
    details: {
      email,
      format_valid,
      mx_found,
      smtp_check,
      disposable,
      free,
      score,
      did_you_mean
    }
  };
}

/**
 * Validación básica de email (fallback cuando APILayer no está disponible)
 * @param {string} email - Email a validar
 * @returns {Object} Resultado de validación básica
 */
function basicEmailValidation(email) {
  // Regex básico para validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const isValid = emailRegex.test(email);

  // Lista básica de dominios desechables conocidos
  const disposableDomains = [
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
    'fakeinbox.com',
    'trashmail.com'
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  const isDisposable = disposableDomains.includes(domain);

  return {
    ok: true,
    valid: isValid && !isDisposable,
    reason: !isValid ? 'invalid_format' : (isDisposable ? 'disposable_email' : null),
    message: !isValid 
      ? 'Formato de email inválido' 
      : (isDisposable ? 'No se permiten emails temporales o desechables' : 'Email válido (validación básica)'),
    details: {
      email,
      format_valid: isValid,
      mx_found: null,
      smtp_check: null,
      disposable: isDisposable,
      free: null,
      score: null,
      did_you_mean: null,
      fallback: true
    }
  };
}

/**
 * Verificar email con caché en KV (para Cloudflare Workers)
 * @param {string} email - Email a verificar
 * @param {Object} env - Environment con KV binding
 * @returns {Promise<Object>} Resultado de verificación
 */
export async function verifyEmailWithCache(email, env) {
  if (!env?.KV) {
    // Si no hay KV disponible, verificar directamente
    return verifyEmail(email, env);
  }

  try {
    // Generar key para caché
    const cacheKey = `email_verification:${email.toLowerCase()}`;
    
    // Intentar obtener del caché
    const cached = await env.KV.get(cacheKey, 'json');
    
    if (cached) {
      console.log(`📦 Email verificado desde caché: ${email}`);
      return {
        ...cached,
        fromCache: true
      };
    }

    // Si no está en caché, verificar con API
    const result = await verifyEmail(email, env);

    // Guardar en caché solo si la verificación fue exitosa
    if (result.ok) {
      // TTL de 24 horas (86400 segundos)
      await env.KV.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 86400
      });
      console.log(`💾 Email verificado guardado en caché: ${email}`);
    }

    return {
      ...result,
      fromCache: false
    };

  } catch (error) {
    console.error('❌ Error en caché de verificación:', error);
    // Fallback a verificación sin caché
    return verifyEmail(email, env);
  }
}

/**
 * Validar múltiples emails en batch
 * @param {string[]} emails - Array de emails a verificar
 * @param {Object} env - Environment variables
 * @returns {Promise<Object[]>} Array de resultados
 */
export async function verifyEmailsBatch(emails, env = null) {
  const results = await Promise.all(
    emails.map(email => verifyEmailWithCache(email, env))
  );
  
  return results;
}

/**
 * Obtener estadísticas de verificación
 * @param {Object} result - Resultado de verificación
 * @returns {string} Descripción legible
 */
export function getVerificationSummary(result) {
  if (!result.valid) {
    return result.message;
  }

  const details = result.details;
  const parts = ['Email válido'];

  if (details.free) {
    parts.push('proveedor gratuito');
  }

  if (details.score !== null) {
    parts.push(`score: ${details.score}`);
  }

  return parts.join(', ');
}
