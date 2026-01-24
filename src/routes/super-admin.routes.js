import { Router } from 'express';
import { verifyToken, isSuperAdmin } from '../middleware/auth.js';
import * as superAdminController from '../controllers/super-admin.controller.js';

const router = Router();

// Ruta de login pública (verificación de rol dentro del controlador)
router.post('/login', superAdminController.login);

// Todas las rutas siguientes requieren token y privilegio de Super Admin
router.use(verifyToken);
router.use(isSuperAdmin);

// Estadísticas globales
router.get('/stats', superAdminController.getStats);

// Gestión de Edificios
router.get('/buildings', superAdminController.getBuildings);
router.put('/buildings/:id/limits', superAdminController.updateBuildingLimits);
router.put('/buildings/:id/status', superAdminController.updateBuildingStatus);

// Gestión de Administradores (Restricciones)
router.put('/admins/:id/restrict', superAdminController.restrictAdmin);

// Soporte y Troubleshooting
router.get('/support/report', superAdminController.generateSupportReport);

export default router;
