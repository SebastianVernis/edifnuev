/**
 * Edificio Admin - Cloudflare Workers Implementation
 * Sistema de administración de edificios adaptado para multi-tenancy SaaS
 * 
 * IMPORTANTE: Este archivo mantiene TODA la funcionalidad del sistema actual
 * y añade la capa SAAS de subscripciones y multi-edificio
 */

import { Router } from 'itty-router';
import { handleCors, addCorsHeaders } from './middleware/cors.js';
import { verifyToken } from './middleware/auth.js';
import { withDb } from './middleware/database.js';

// Import SAAS handlers (nuevos)
import * as subscription from './handlers/subscription.js';
import * as buildings from './handlers/buildings.js';
import * as onboarding from './handlers/onboarding.js';
import * as otp from './handlers/otp.js';
import * as invitations from './handlers/invitations.js';

// Import existing handlers (adaptados desde Express)
import * as authHandler from './handlers/auth.js';
import * as usuariosHandler from './handlers/usuarios.js';
import * as cuotasHandler from './handlers/cuotas.js';
import * as gastosHandler from './handlers/gastos.js';
import * as presupuestosHandler from './handlers/presupuestos.js';
import * as cierresHandler from './handlers/cierres.js';
import * as anunciosHandler from './handlers/anuncios.js';
import * as fondosHandler from './handlers/fondos.js';
import * as permisosHandler from './handlers/permisos.js';
import * as auditHandler from './handlers/audit.js';
import * as solicitudesHandler from './handlers/solicitudes.js';
import * as parcialidadesHandler from './handlers/parcialidades.js';
import * as cronHandler from './handlers/cron.js';
import * as downloadsHandler from './handlers/downloads.js';
import * as missingEndpoints from './handlers/missing-endpoints.js';

// Create router
const router = Router();

// ============================================================================
// CORS MIDDLEWARE
// ============================================================================
router.all('*', (request) => {
  const response = handleCors(request);
  if (response instanceof Response) {
    return response;
  }
});

// ============================================================================
// NUEVAS RUTAS SAAS - Subscripciones y Multi-tenancy
// ============================================================================

// Subscription and onboarding routes (NUEVAS - CAPA SAAS)
router.post('/api/subscription/select-plan', verifyToken, subscription.selectPlan);
router.post('/api/subscription/custom-plan', verifyToken, subscription.customPlan);
router.post('/api/subscription/checkout', verifyToken, subscription.checkout);
router.post('/api/subscription/confirm', verifyToken, subscription.confirm);

// Building/Condominium management (NUEVAS - MULTI-EDIFICIO)
router.post('/api/buildings', verifyToken, buildings.create);
router.get('/api/buildings', verifyToken, buildings.list);
router.get('/api/buildings/:id', verifyToken, buildings.getDetails);
router.put('/api/buildings/:id', verifyToken, buildings.update);
router.delete('/api/buildings/:id', verifyToken, buildings.remove);

// Onboarding routes (NUEVAS - FLUJO DE REGISTRO)
router.post('/api/onboarding/register', onboarding.register);
router.post('/api/onboarding/checkout', onboarding.checkout);
router.post('/api/onboarding/setup-building', onboarding.setupBuilding);

// OTP routes (NUEVAS - VERIFICACIÓN EMAIL)
router.post('/api/otp/send', otp.sendOtp);
router.post('/api/otp/verify', otp.verifyOtp);
router.post('/api/otp/resend', otp.resendOtp);
router.get('/api/otp/status/:email', otp.getOtpStatus);

// Invitation routes (NUEVAS - SISTEMA DE INVITACIONES)
router.post('/api/invitations/send', verifyToken, invitations.sendInvitation);
router.get('/api/invitations/validate/:token', invitations.validateToken);
router.post('/api/invitations/activate', invitations.activateInvitation);

// ============================================================================
// RUTAS EXISTENTES - Funcionalidad actual del sistema (SIN MODIFICAR)
// ============================================================================

// Authentication routes
router.post('/api/auth/login', authHandler.login);
router.post('/api/auth/registro', authHandler.registro);
router.get('/api/auth/renew', verifyToken, authHandler.renovarToken);
router.get('/api/auth/perfil', verifyToken, authHandler.getPerfil);

// Debug endpoint (temporal)
router.get('/api/debug/token/:email', async (request, env) => {
  const email = request.params.email;
  const user = await request.db.prepare('SELECT id, nombre, email, rol FROM usuarios WHERE email = ?').bind(email).first();
  if (!user) return new Response(JSON.stringify({ ok: false, msg: 'Usuario no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  
  const { generateToken } = await import('./middleware/auth.js');
  const token = await generateToken({ id: user.id, rol: user.rol }, env);
  
  return new Response(JSON.stringify({ ok: true, token, user }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

// Usuarios routes
router.get('/api/usuarios', verifyToken, usuariosHandler.getAll);
router.get('/api/usuarios/:id', verifyToken, usuariosHandler.getById);
router.post('/api/usuarios', verifyToken, usuariosHandler.create);
router.put('/api/usuarios/:id', verifyToken, usuariosHandler.update);
router.delete('/api/usuarios/:id', verifyToken, usuariosHandler.remove);

// Cuotas routes
router.get('/api/cuotas', verifyToken, cuotasHandler.getAll);
router.get('/api/cuotas/departamento/:departamento', verifyToken, cuotasHandler.getByDepartamento);
router.get('/api/cuotas/stats', verifyToken, missingEndpoints.cuotasGetStats);
router.get('/api/cuotas/pendientes', verifyToken, missingEndpoints.cuotasGetPendientes);
router.post('/api/cuotas', verifyToken, cuotasHandler.create);
router.post('/api/cuotas/generar', verifyToken, cuotasHandler.create);
router.post('/api/cuotas/verificar-vencimientos', verifyToken, missingEndpoints.cuotasVerificarVencimientos);
router.put('/api/cuotas/:id', verifyToken, cuotasHandler.update);
router.delete('/api/cuotas/:id', verifyToken, cuotasHandler.remove);
router.post('/api/cuotas/:id/pagar', verifyToken, cuotasHandler.pagar);

// Gastos routes
router.get('/api/gastos', verifyToken, gastosHandler.getAll);
router.get('/api/gastos/:id', verifyToken, gastosHandler.getById);
router.get('/api/gastos/stats', verifyToken, missingEndpoints.gastosGetStats);
router.post('/api/gastos', verifyToken, gastosHandler.create);
router.put('/api/gastos/:id', verifyToken, gastosHandler.update);
router.delete('/api/gastos/:id', verifyToken, gastosHandler.remove);

// Presupuestos routes
router.get('/api/presupuestos', verifyToken, presupuestosHandler.getAll);
router.get('/api/presupuestos/:id', verifyToken, presupuestosHandler.getById);
router.post('/api/presupuestos', verifyToken, presupuestosHandler.create);
router.put('/api/presupuestos/:id', verifyToken, presupuestosHandler.update);
router.delete('/api/presupuestos/:id', verifyToken, presupuestosHandler.remove);

// Cierres routes
router.get('/api/cierres', verifyToken, cierresHandler.getAll);
router.get('/api/cierres/:id', verifyToken, cierresHandler.getById);
router.post('/api/cierres', verifyToken, cierresHandler.create);

// Anuncios routes
router.get('/api/anuncios', verifyToken, anunciosHandler.getAll);
router.get('/api/anuncios/:id', verifyToken, anunciosHandler.getById);
router.post('/api/anuncios', verifyToken, anunciosHandler.create);
router.put('/api/anuncios/:id', verifyToken, anunciosHandler.update);
router.delete('/api/anuncios/:id', verifyToken, anunciosHandler.remove);

// Fondos routes
router.get('/api/fondos', verifyToken, fondosHandler.getAll);
router.get('/api/fondos/:id', verifyToken, fondosHandler.getById);
router.get('/api/fondos/patrimonio', verifyToken, missingEndpoints.fondosGetPatrimonio);
router.post('/api/fondos', verifyToken, fondosHandler.create);
router.post('/api/fondos/transferencia', verifyToken, missingEndpoints.fondosTransferir);
router.post('/api/fondos/transferir', verifyToken, missingEndpoints.fondosTransferir);
router.put('/api/fondos/:id', verifyToken, fondosHandler.update);
router.delete('/api/fondos/:id', verifyToken, fondosHandler.remove);

// Permisos routes
router.get('/api/permisos/:usuarioId', verifyToken, permisosHandler.getByUsuario);
router.put('/api/permisos/:usuarioId', verifyToken, permisosHandler.update);

// Audit routes
router.get('/api/audit/logs', verifyToken, auditHandler.getLogs);

// Solicitudes routes
router.get('/api/solicitudes', verifyToken, solicitudesHandler.getAll);
router.get('/api/solicitudes/:id', verifyToken, solicitudesHandler.getById);
router.post('/api/solicitudes', verifyToken, solicitudesHandler.create);
router.put('/api/solicitudes/:id', verifyToken, solicitudesHandler.update);
router.delete('/api/solicitudes/:id', verifyToken, solicitudesHandler.remove);

// Parcialidades routes
router.get('/api/parcialidades', verifyToken, parcialidadesHandler.getAll);
router.get('/api/parcialidades/cuota/:cuotaId', verifyToken, parcialidadesHandler.getByCuota);
router.get('/api/parcialidades/pagos', verifyToken, missingEndpoints.parcialidadesGetPagos);
router.get('/api/parcialidades/estado', verifyToken, missingEndpoints.parcialidadesGetEstado);
router.post('/api/parcialidades', verifyToken, parcialidadesHandler.create);
router.post('/api/parcialidades/pagos/:pagoId/validar', verifyToken, missingEndpoints.parcialidadesValidarPago);
router.put('/api/parcialidades/:id', verifyToken, parcialidadesHandler.update);
router.delete('/api/parcialidades/:id', verifyToken, parcialidadesHandler.remove);

// Downloads routes (archivos de cierres)
router.get('/api/downloads/cierres/*', downloadsHandler.downloadCierreFile);
router.get('/api/cierres/:id/files', verifyToken, downloadsHandler.listCierreFiles);

// ============================================================================
// EXPORT DEFAULT HANDLER
// ============================================================================
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Manejar rutas de API
      if (url.pathname.startsWith('/api/')) {
        // Add database and environment to the request
        const requestWithDb = withDb(request, env);
        
        // Handle the request with the router
        const response = await router.handle(requestWithDb, env, ctx);
        
        // Si no hay respuesta del router, devolver 404
        if (!response) {
          return addCorsHeaders(new Response(JSON.stringify({
            success: false,
            message: 'Ruta no encontrada'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }), request);
        }
        
        return response;
      }
      
      // Servir archivos estáticos usando el nuevo Assets binding
      if (env.ASSETS) {
        try {
          // Intentar obtener el asset
          const asset = await env.ASSETS.fetch(request);
          
          if (asset && asset.status !== 404) {
            return asset;
          }
          
          // Si no se encuentra, intentar servir HTML según la ruta
          let htmlPath = '/index.html';
          
          if (url.pathname === '/admin' || url.pathname === '/admin/') {
            htmlPath = '/admin.html';
          } else if (url.pathname === '/inquilino' || url.pathname === '/inquilino/') {
            htmlPath = '/inquilino.html';
          } else if (url.pathname === '/' || url.pathname === '') {
            htmlPath = '/index.html';
          }
          
          const htmlRequest = new Request(new URL(htmlPath, url.origin), request);
          const htmlAsset = await env.ASSETS.fetch(htmlRequest);
          
          if (htmlAsset && htmlAsset.status === 200) {
            return htmlAsset;
          }
          
          return new Response('Not Found', { status: 404 });
        } catch (e) {
          console.error('Asset error:', e);
          return new Response(`Error: ${e.message}`, { status: 500 });
        }
      }
      
      return new Response('Assets not configured', { status: 500 });

    } catch (error) {
      // General error handler
      console.error('Unhandled error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Error interno del servidor',
        error: env.ENVIRONMENT === 'development' ? error.message : undefined
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  },

  // Scheduled event handler for periodic tasks
  async scheduled(event, env, ctx) {
    console.log('🕒 Cron trigger:', event.cron);
    
    switch (event.cron) {
      case '0 0 * * *':
        // Tareas diarias: actualizar cuotas vencidas, backups, etc.
        console.log('Running daily maintenance tasks');
        break;
        
      case '0 9 * * MON':
        // Tareas semanales: reportes, notificaciones
        console.log('Generating weekly reports');
        break;
        
      case '0 0 L * *':
        // Último día del mes a medianoche: Generar cierres automáticos
        console.log('🕛 Ejecutando cierre automático de fin de mes');
        await cronHandler.handleCronFinDeMes(event, env, ctx);
        break;
        
      default:
        console.log('Unknown cron pattern:', event.cron);
    }
  }
};
