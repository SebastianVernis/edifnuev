import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { 
  getProyectos, 
  crearProyecto, 
  actualizarProyecto, 
  eliminarProyecto 
} from '../controllers/proyectos.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener proyectos (todos los usuarios autenticados)
router.get('/', getProyectos);

// Crear, actualizar y eliminar proyectos (solo admin)
router.post('/', isAdmin, crearProyecto);
router.put('/:id', isAdmin, actualizarProyecto);
router.delete('/:id', isAdmin, eliminarProyecto);

export default router;
