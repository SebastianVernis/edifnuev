/**
 * Rutas para Webhooks de Clerk
 * 
 * Endpoint: /api/webhooks/clerk
 * Compatible con Express (desarrollo local) y Cloudflare Workers
 */

import express from 'express';
import { handleClerkWebhook, testWebhook } from '../controllers/clerk-webhook.controller.js';

const router = express.Router();

/**
 * POST /api/webhooks/clerk
 * Endpoint principal para recibir webhooks de Clerk
 * 
 * Este endpoint debe ser configurado en el dashboard de Clerk:
 * https://dashboard.clerk.com/apps/[your-app]/webhooks
 * 
 * URL del webhook (desarrollo): http://localhost:3001/api/webhooks/clerk
 * URL del webhook (producción): https://tu-worker.workers.dev/api/webhooks/clerk
 * 
 * Eventos a suscribir:
 * - user.created
 * - user.updated
 * - user.deleted
 */
router.post('/', async (req, res) => {
  try {
    // Simular env para desarrollo local
    const env = {
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
      DB: null // En desarrollo local usamos data.js
    };

    const response = await handleClerkWebhook(req, env);
    
    // Si handleClerkWebhook retorna un Response object (Cloudflare Workers)
    if (response instanceof Response) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }
    
    // Si retorna directamente
    return response;
  } catch (error) {
    console.error('Error in webhook route:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error processing webhook',
      error: error.message
    });
  }
});

/**
 * GET /api/webhooks/clerk/test
 * Endpoint de prueba para verificar que el webhook está activo
 */
router.get('/test', (req, res) => {
  res.json({
    ok: true,
    msg: 'Clerk webhook endpoint is active',
    timestamp: new Date().toISOString(),
    env: {
      hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
      hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
      mode: 'development'
    }
  });
});

export default router;
