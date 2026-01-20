import express from 'express';
import { 
  getTheme, 
  getMyTheme,
  createOrUpdateTheme, 
  deleteTheme, 
  getThemeCSS,
  getMyThemeCSS,
  getAllThemes 
} from '../controllers/theme.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (con autenticación)
router.get('/my-theme', verifyToken, getMyTheme);
router.get('/my-theme/css', verifyToken, getMyThemeCSS);

// Rutas para un building específico
router.get('/building/:buildingId', verifyToken, getTheme);
router.get('/building/:buildingId/css', getThemeCSS); // Pública para cargar estilos
router.put('/building/:buildingId', verifyToken, createOrUpdateTheme);
router.delete('/building/:buildingId', verifyToken, deleteTheme);

// Ruta para super admin
router.get('/all', verifyToken, getAllThemes);

export default router;
