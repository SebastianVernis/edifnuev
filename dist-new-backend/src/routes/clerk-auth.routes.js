/**
 * Rutas de Autenticación con Clerk
 * 
 * Endpoints para gestionar autenticación con Clerk
 */

import express from 'express';
import { getAuthenticatedUser, syncClerkUser, completeClerkSetup } from '../controllers/clerk-auth.controller.js';
import { clerkAuthMiddleware } from '../middleware/clerk-auth.js';

const router = express.Router();

/**
 * GET /api/auth/me
 * Obtiene los datos del usuario autenticado
 * Requiere token de Clerk en el header Authorization
 */
router.get('/me', async (req, res, next) => {
  // Simular env para desarrollo local
  const env = {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_JWT_KEY: process.env.CLERK_JWT_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    APP_URL: process.env.APP_URL || 'http://localhost:3001',
    DB: null // En desarrollo local usamos data.js
  };

  // Aplicar middleware de autenticación
  const middlewareResult = await clerkAuthMiddleware(env)(req);
  
  if (middlewareResult instanceof Response) {
    // Si el middleware retorna un Response (error), convertirlo a Express response
    const data = await middlewareResult.json();
    return res.status(middlewareResult.status).json(data);
  }

  // Continuar con el controller
  return getAuthenticatedUser(req, res);
});

/**
 * POST /api/auth/clerk-sync
 * Sincroniza el usuario de Clerk con el backend
 * Requiere token de Clerk en el header Authorization
 */
router.post('/clerk-sync', async (req, res, next) => {
  const env = {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_JWT_KEY: process.env.CLERK_JWT_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    APP_URL: process.env.APP_URL || 'http://localhost:3001',
    DB: null
  };

  const middlewareResult = await clerkAuthMiddleware(env)(req);
  
  if (middlewareResult instanceof Response) {
    const data = await middlewareResult.json();
    return res.status(middlewareResult.status).json(data);
  }

  return syncClerkUser(req, res);
});

/**
 * POST /api/auth/clerk-setup
 * Completa el setup de un nuevo usuario de Clerk
 * Requiere token de Clerk en el header Authorization
 */
router.post('/clerk-setup', async (req, res, next) => {
  const env = {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_JWT_KEY: process.env.CLERK_JWT_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    APP_URL: process.env.APP_URL || 'http://localhost:3001',
    DB: null
  };

  const middlewareResult = await clerkAuthMiddleware(env)(req);
  
  if (middlewareResult instanceof Response) {
    const data = await middlewareResult.json();
    return res.status(middlewareResult.status).json(data);
  }

  // Adjuntar env al request para el controller
  req.env = env;
  
  return completeClerkSetup(req, res);
});

export default router;
