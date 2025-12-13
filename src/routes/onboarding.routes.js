/**
 * Rutas de Onboarding
 */

import express from 'express';
import {
  register,
  sendOtp,
  verifyOtp,
  checkout,
  setupBuilding,
  getPlans,
  getOnboardingStatus
} from '../controllers/onboarding.controller.js';

const router = express.Router();

// Rutas públicas (sin autenticación)
router.get('/plans', getPlans);
router.post('/register', register);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/checkout', checkout);
router.post('/setup-building', setupBuilding);
router.get('/status/:email', getOnboardingStatus);

export default router;
