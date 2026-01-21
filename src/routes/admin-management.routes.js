import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin
} from '../controllers/admin-management.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación y permiso de administrador
router.use(verifyToken);
router.use(isAdmin);

// GET /api/admin-management - Obtener todos los administradores
router.get('/', getAdmins);

// GET /api/admin-management/:id - Obtener un administrador por ID
router.get('/:id', getAdminById);

// POST /api/admin-management - Crear un nuevo administrador
router.post('/', createAdmin);

// PUT /api/admin-management/:id - Actualizar un administrador
router.put('/:id', updateAdmin);

// DELETE /api/admin-management/:id - Eliminar un administrador
router.delete('/:id', deleteAdmin);

export default router;