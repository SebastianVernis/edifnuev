import express from 'express';
import cors from 'cors';
import { verifyToken } from '../middleware/auth.js';
import { getBuildingInfo, getDocuments } from '../controllers/onboarding.controller.js';

const router = express.Router();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://chispartbuilding.pages.dev',
      'https://edificio-admin.sebastianvernis.workers.dev',
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.pages.dev') || origin.endsWith('.workers.dev')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
};

router.use(verifyToken);
router.use(cors(corsOptions));

router.get('/building-info', getBuildingInfo);
router.get('/documents', getDocuments);
router.options('/documents', cors(corsOptions));

export default router;