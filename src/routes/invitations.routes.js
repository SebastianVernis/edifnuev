/**
 * Rutas de Invitaciones
 */

import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  sendInvitation,
  verifyInvitation,
  activateInvitation,
  getPendingInvitations,
  cancelInvitation
} from '../controllers/invitations.controller.js';

const router = express.Router();

// Rutas públicas
router.get('/verify/:token', verifyInvitation);
router.post('/activate', activateInvitation);

// Rutas protegidas (requieren autenticación)
router.post('/send', verifyToken, sendInvitation);
router.get('/pending', verifyToken, getPendingInvitations);
router.delete('/:token', verifyToken, cancelInvitation);

export default router;
