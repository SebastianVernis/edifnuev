
import { jest } from '@jest/globals';

// Mock data store
let mockData = {
  usuarios: [],
  registros_pendientes: [],
  buildings: [],
  fondos: {},
  proyectos: []
};

// Mock implementations
const mockReadData = jest.fn(() => mockData);
const mockWriteData = jest.fn((newData) => {
  mockData = newData;
});

// Mock dependencies BEFORE importing app
jest.unstable_mockModule('../src/data.js', () => {
  const mockAddItem = jest.fn((collection, item) => {
    if (!mockData[collection]) mockData[collection] = [];
    const newId = mockData[collection].length + 1;
    const newItem = { ...item, id: newId };
    mockData[collection].push(newItem);
    return newItem;
  });

  const mockUpdateItem = jest.fn((collection, id, updates) => {
     if (!mockData[collection]) return null;
     const index = mockData[collection].findIndex(item => item.id === parseInt(id));
     if (index === -1) return null;
     mockData[collection][index] = { ...mockData[collection][index], ...updates };
     return mockData[collection][index];
  });

  return {
    readData: mockReadData,
    writeData: mockWriteData,
    getById: jest.fn((collection, id) => {
        if (!mockData[collection]) return null;
        return mockData[collection].find(item => item.id === parseInt(id));
    }),
    getAll: jest.fn((collection) => mockData[collection] || []),
    addItem: mockAddItem,
    create: mockAddItem,
    updateItem: mockUpdateItem,
    update: mockUpdateItem,
    deleteItem: jest.fn(),
    remove: jest.fn(),
    updateFondos: jest.fn(),
    getFondos: jest.fn(() => mockData.fondos),
    default: {
        readData: mockReadData,
        writeData: mockWriteData
    }
  };
});

jest.unstable_mockModule('../src/utils/smtp.js', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue({ ok: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ ok: true }),
  sendInvitationEmail: jest.fn().mockResolvedValue({ ok: true }),
  sendEmail: jest.fn().mockResolvedValue({ ok: true }),
  checkEmailRateLimit: jest.fn().mockReturnValue({ ok: true }),
  getTransporter: jest.fn().mockResolvedValue(true)
}));

jest.unstable_mockModule('../src/utils/emailVerification.js', () => ({
  verifyEmailWithCache: jest.fn().mockResolvedValue({ valid: true, ok: true }),
  verifyEmail: jest.fn().mockResolvedValue({ valid: true, ok: true })
}));

// Mock upload utils to avoid S3/R2 calls
jest.unstable_mockModule('../src/utils/upload.js', () => ({
  uploadBase64File: jest.fn().mockResolvedValue('https://mock-upload.com/file.jpg')
}));

// Mock auth middleware to avoid side effects (setInterval) and auth checks
jest.unstable_mockModule('../src/middleware/auth.js', () => ({
  verifyToken: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
  isSuperAdmin: jest.fn((req, res, next) => next()),
  isComiteOrAdmin: jest.fn((req, res, next) => next()),
  hasPermission: jest.fn(() => (req, res, next) => next()),
  isOwner: jest.fn((req, res, next) => next()),
  generarJWT: jest.fn(() => 'mock-token'),
  clearPermissionsCache: jest.fn(),
  getCacheStats: jest.fn(),
  getTodayAccessLogs: jest.fn()
}));

// Dynamic imports after mocks
// Import Express and Routes directly to avoid src/app.js side effects
const express = (await import('express')).default;
const request = (await import('supertest')).default;
const { default: onboardingRoutes } = await import('../src/routes/onboarding.routes.js');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/onboarding', onboardingRoutes);

describe('Numbering Scheme Integration Tests', () => {
  const testEmail = 'test-scheme@example.com';
  const testOtp = '123456';

  beforeEach(() => {
    // Reset mock data
    mockData = {
      usuarios: [],
      registros_pendientes: [],
      buildings: [],
      fondos: {},
      proyectos: []
    };
    jest.clearAllMocks();

    // Mock Math.random to return a predictable value for OTP generation
    // 0.123456 * 900000 = 111110.4 + 100000 = 211110.4 -> floor -> 211110
    // To get '123456': (123456 - 100000) / 900000 = 23456 / 900000 = 0.0260622...
    // Let's just mock generateOtpCode if we could, but it's internal.
    // Instead we will spy on Math.random or just capture the OTP from the store?
    // We can't access the store.
    // We'll mock Math.random to return a fixed value.
    // The code is: Math.floor(100000 + Math.random() * 900000).toString()
    // We want 123456.
    // 123456 = 100000 + x * 900000
    // 23456 = x * 900000
    // x = 23456 / 900000 = 0.026062222
    
    jest.spyOn(Math, 'random').mockReturnValue(0.026062222222222222);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Complete flow with PB + Pisos numbering scheme', async () => {
    // 1. Register
    const regRes = await request(app)
      .post('/api/onboarding/register')
      .send({
        email: testEmail,
        fullName: 'Test User',
        buildingName: 'Test Building',
        selectedPlan: 'basico'
      });
    
    expect(regRes.status).toBe(200);
    expect(regRes.body.ok).toBe(true);

    // 2. Send OTP
    const sendOtpRes = await request(app)
      .post('/api/onboarding/send-otp')
      .send({ email: testEmail });

    expect(sendOtpRes.status).toBe(200);

    // 3. Verify OTP (using the predictable OTP '123456')
    const verifyRes = await request(app)
      .post('/api/onboarding/verify-otp')
      .send({
        email: testEmail,
        code: '123456'
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.ok).toBe(true);
    expect(verifyRes.body.verified).toBe(true);

    // 4. Checkout (Mock Payment)
    const checkoutRes = await request(app)
      .post('/api/onboarding/checkout')
      .send({
        email: testEmail,
        cardNumber: '4242424242424242',
        cardExpiry: '12/25',
        cardCvc: '123',
        cardName: 'Test User'
      });

    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.ok).toBe(true);

    // 5. MANUAL VALIDATION (Simulate Super Admin Action)
    // Find the pending registration in our mock data and set validated = true
    const pendingReg = mockData.registros_pendientes.find(r => r.email === testEmail);
    expect(pendingReg).toBeDefined();
    pendingReg.validated = true;
    pendingReg.validatedAt = new Date().toISOString();
    
    // 6. Setup Building with 'pb_pisos' scheme
    // Scheme: 15 units total, 5 in PB, 5 per floor.
    // Expected: 1, 2, 3, 4, 5 (PB)
    // Floor 1: 101, 102, 103, 104, 105
    // Floor 2: 201, 202, 203, 204, 205
    const setupRes = await request(app)
      .post('/api/onboarding/complete-setup')
      .send({
        email: testEmail,
        password: 'password123',
        buildingData: {
          address: '123 Test St',
          totalUnits: 15,
          numberingScheme: 'pb_pisos',
          unitsPB: 5,
          unitsPerFloor: 5
        }
      });

    expect(setupRes.status).toBe(200);
    expect(setupRes.body.ok).toBe(true);

    const user = setupRes.body.usuario;
    expect(user).toBeDefined();
    expect(user.building).toBeDefined();
    
    const unidades = user.building.unidades;
    const expected = ['1', '2', '3', '4', '5', '101', '102', '103', '104', '105', '201', '202', '203', '204', '205'];

    expect(unidades).toEqual(expected);
  });

  test('Complete flow with Consecutivo numbering scheme', async () => {
     // Reuse logic, just skip to setup since we need a fresh flow for each test usually,
     // but to save time let's just create a new registration directly in mockData
     // bypassing the API calls for previous steps.

     const email = 'consecutivo@example.com';
     mockData.registros_pendientes.push({
         email: email,
         fullName: 'Consecutive User',
         buildingName: 'Consecutive Building',
         selectedPlan: 'basico',
         otpVerified: true,
         checkoutCompleted: true,
         validated: true, // Auto-validated
         validatedAt: new Date().toISOString(),
         planDetails: { name: 'Basic', price: 100 }
     });

     const setupRes = await request(app)
      .post('/api/onboarding/complete-setup')
      .send({
        email: email,
        password: 'password123',
        buildingData: {
          address: '456 Test Ave',
          totalUnits: 10,
          numberingScheme: 'consecutivo'
        }
      });

    expect(setupRes.status).toBe(200);
    expect(setupRes.body.ok).toBe(true);

    const unidades = setupRes.body.usuario.building.unidades;
    const expected = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    expect(unidades).toEqual(expected);
  });
});
