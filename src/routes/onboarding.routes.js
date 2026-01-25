/**
 * Rutas de Onboarding
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  register,
  sendOtp,
  verifyOtp,
  checkout,
  setupBuilding,
  getPlans,
  getOnboardingStatus
} from '../controllers/onboarding.controller.js';
import {
  getBuildingInfo,
  updateBuildingInfo,
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument
} from '../controllers/onboarding-endpoints.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

const router = express.Router();

// Rutas públicas (sin autenticación)
router.get('/plans', getPlans);
router.post('/register', register);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/checkout', checkout);
router.post('/complete-setup', setupBuilding);
router.get('/status/:email', getOnboardingStatus);

// Rutas protegidas (requieren autenticación)
router.get('/building-info', verifyToken, getBuildingInfo);
router.put('/building-info', verifyToken, isAdmin, updateBuildingInfo);
router.get('/documents', verifyToken, getDocuments);
router.post('/documents', verifyToken, isAdmin, upload.single('archivo'), uploadDocument);
router.get('/documents/:id', verifyToken, downloadDocument);
router.delete('/documents/:id', verifyToken, isAdmin, deleteDocument);

export default router;
