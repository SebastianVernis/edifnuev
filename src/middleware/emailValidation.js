/**
 * Middleware de Validación de Email
 * Valida emails usando APILayer antes de procesar requests
 */

import { verifyEmailWithCache } from '../utils/emailVerification.js';

/**
 * Middleware para validar email en el body del request
 * Uso: router.post('/endpoint', validateEmailMiddleware, handler)
 */
export async function validateEmailMiddleware(req, res, next) {
  try {
    const { email } = req.body;

    // Verificar que el email esté presente
    if (!email) {
      return res.status(400).json({
        ok: false,
        msg: 'Email es requerido'
      });
    }

    // Verificar email con APILayer (con caché)
    const verification = await verifyEmailWithCache(email, req.env || process.env);

    // Si el email no es válido, rechazar el request
    if (!verification.valid) {
      return res.status(400).json({
        ok: false,
        msg: verification.message,
        reason: verification.reason,
        details: verification.details?.did_you_mean ? {
          suggestion: verification.details.did_you_mean
        } : null
      });
    }

    // Email válido - agregar resultado de verificación al request
    req.emailVerification = verification;

    // Continuar al siguiente middleware/handler
    next();

  } catch (error) {
    console.error('❌ Error en middleware de validación de email:', error);
    
    // En caso de error, permitir continuar pero loguear el error
    // (no queremos bloquear el flujo si la API de verificación falla)
    req.emailVerification = {
      ok: false,
      valid: true, // Asumir válido en caso de error
      error: error.message,
      fallback: true
    };
    
    next();
  }
}

/**
 * Middleware para validar email con opciones personalizadas
 * @param {Object} options - Opciones de validación
 * @param {boolean} options.required - Si el email es requerido (default: true)
 * @param {boolean} options.blockDisposable - Bloquear emails desechables (default: true)
 * @param {number} options.minScore - Score mínimo requerido (default: 0.5)
 * @param {boolean} options.allowFallback - Permitir continuar si la API falla (default: true)
 */
export function validateEmailWithOptions(options = {}) {
  const {
    required = true,
    blockDisposable = true,
    minScore = 0.5,
    allowFallback = true
  } = options;

  return async (req, res, next) => {
    try {
      const { email } = req.body;

      // Verificar si el email es requerido
      if (required && !email) {
        return res.status(400).json({
          ok: false,
          msg: 'Email es requerido'
        });
      }

      // Si no es requerido y no está presente, continuar
      if (!required && !email) {
        return next();
      }

      // Verificar email
      const verification = await verifyEmailWithCache(email, req.env || process.env);

      // Si hubo error y no se permite fallback, rechazar
      if (!verification.ok && !allowFallback) {
        return res.status(503).json({
          ok: false,
          msg: 'Servicio de verificación de email no disponible'
        });
      }

      // Validaciones personalizadas
      if (!verification.valid) {
        // Verificar si es por email desechable y si está bloqueado
        if (verification.reason === 'disposable_email' && blockDisposable) {
          return res.status(400).json({
            ok: false,
            msg: verification.message,
            reason: verification.reason
          });
        }

        // Verificar score mínimo
        if (verification.details?.score !== null && verification.details.score < minScore) {
          return res.status(400).json({
            ok: false,
            msg: `Email de baja calidad. Por favor usa un email válido.`,
            reason: 'low_quality_score',
            details: {
              score: verification.details.score,
              minRequired: minScore
            }
          });
        }

        // Otras razones de invalidez
        return res.status(400).json({
          ok: false,
          msg: verification.message,
          reason: verification.reason
        });
      }

      // Email válido - agregar al request
      req.emailVerification = verification;
      next();

    } catch (error) {
      console.error('❌ Error en middleware de validación:', error);
      
      if (allowFallback) {
        req.emailVerification = {
          ok: false,
          valid: true,
          error: error.message,
          fallback: true
        };
        next();
      } else {
        return res.status(500).json({
          ok: false,
          msg: 'Error en validación de email'
        });
      }
    }
  };
}

/**
 * Middleware para validar email en parámetros de query
 * Uso: router.get('/endpoint', validateEmailInQuery, handler)
 */
export async function validateEmailInQuery(req, res, next) {
  try {
    const email = req.query.email || req.params.email;

    if (!email) {
      return res.status(400).json({
        ok: false,
        msg: 'Email es requerido'
      });
    }

    const verification = await verifyEmailWithCache(email, req.env || process.env);

    if (!verification.valid) {
      return res.status(400).json({
        ok: false,
        msg: verification.message,
        reason: verification.reason
      });
    }

    req.emailVerification = verification;
    next();

  } catch (error) {
    console.error('❌ Error validando email en query:', error);
    req.emailVerification = {
      ok: false,
      valid: true,
      error: error.message,
      fallback: true
    };
    next();
  }
}

/**
 * Función helper para validar email manualmente en controllers
 * @param {string} email - Email a validar
 * @param {Object} env - Environment variables
 * @param {Object} options - Opciones de validación
 * @returns {Promise<Object>} {valid: boolean, error: string|null}
 */
export async function validateEmailManual(email, env = null, options = {}) {
  const {
    blockDisposable = true,
    minScore = 0.5
  } = options;

  try {
    const verification = await verifyEmailWithCache(email, env);

    if (!verification.valid) {
      return {
        valid: false,
        error: verification.message,
        reason: verification.reason,
        details: verification.details
      };
    }

    // Validaciones adicionales
    if (blockDisposable && verification.details?.disposable) {
      return {
        valid: false,
        error: 'No se permiten emails temporales o desechables',
        reason: 'disposable_email'
      };
    }

    if (verification.details?.score !== null && verification.details.score < minScore) {
      return {
        valid: false,
        error: 'Email de baja calidad',
        reason: 'low_quality_score',
        details: { score: verification.details.score }
      };
    }

    return {
      valid: true,
      error: null,
      verification
    };

  } catch (error) {
    console.error('❌ Error en validación manual:', error);
    return {
      valid: true, // Fallback: asumir válido en caso de error
      error: null,
      fallback: true
    };
  }
}
