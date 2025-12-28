// validation.routes.js - Rutas para validación y mantenimiento de datos

import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import {
  obtenerReporteSalud,
  validarEstructura,
  limpiarDatos,
  migrarDatos,
  crearBackup
} from '../controllers/validation.controller.js';

const router = express.Router();

// Health check endpoint (public, for Cloud Run and monitoring)
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Todas las rutas requieren autenticación y rol de administrador
router.use(verifyToken);
router.use(isAdmin);

// GET /api/validation/health-admin - Obtener reporte de salud de datos (admin)
router.get('/health-admin', obtenerReporteSalud);

// GET /api/validation/validate - Validar estructura de datos
router.get('/validate', validarEstructura);

// POST /api/validation/clean - Limpiar datos inconsistentes
router.post('/clean', limpiarDatos);

// POST /api/validation/migrate - Migrar datos al nuevo formato
router.post('/migrate', migrarDatos);

// POST /api/validation/backup - Crear backup manual
router.post('/backup', crearBackup);

export default router;