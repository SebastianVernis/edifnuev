/**
 * Onboarding Controller
 * Maneja el flujo completo de registro, OTP, checkout y configuración inicial
 */

import { getData, setData } from '../data.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendOtpEmail, sendWelcomeEmail, checkEmailRateLimit } from '../utils/smtp.js';

const JWT_SECRET = process.env.JWT_SECRET || 'edificio-admin-secret-key-2025';

// Planes disponibles
const PLANS = {
  basico: { 
    name: 'Plan Básico', 
    price: 499, 
    maxUnits: 20,
    features: ['Gestión de cuotas', 'Registro de gastos', 'Comunicados', 'Acceso para residentes']
  },
  profesional: { 
    name: 'Plan Profesional', 
    price: 999, 
    maxUnits: 50,
    features: ['Todo en Básico', 'Presupuestos', 'Notificaciones email', 'Reportes', 'Roles personalizados']
  },
  empresarial: { 
    name: 'Plan Empresarial', 
    price: 1999, 
    maxUnits: 200,
    features: ['Todo en Profesional', 'Múltiples edificios', 'Dashboard personalizado', 'API', 'Soporte prioritario']
  },
};

// Storage temporal para OTPs y registros pendientes
const otpStore = new Map();
const pendingRegistrations = new Map();

/**
 * Generar código OTP de 6 dígitos
 */
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/onboarding/register
 * Iniciar registro de nuevo usuario
 */
export async function register(req, res) {
  try {
    const { email, fullName, phone, buildingName, selectedPlan } = req.body;

    // Validar datos requeridos
    if (!email || !fullName || !buildingName || !selectedPlan) {
      return res.status(400).json({
        ok: false,
        msg: 'Datos incompletos. Se requiere email, nombre, nombre del edificio y plan.'
      });
    }

    // Validar email
    if (!email.includes('@')) {
      return res.status(400).json({
        ok: false,
        msg: 'Email inválido'
      });
    }

    // Validar que el plan existe
    if (!PLANS[selectedPlan]) {
      return res.status(400).json({
        ok: false,
        msg: 'Plan seleccionado no válido'
      });
    }

    // Verificar si el email ya existe en usuarios
    const data = getData();
    const existingUser = data.usuarios.find(u => u.email === email);
    
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        msg: 'Este email ya está registrado'
      });
    }

    // Verificar si ya hay un registro pendiente
    if (pendingRegistrations.has(email)) {
      return res.status(409).json({
        ok: false,
        msg: 'Ya existe un registro pendiente para este email. Completa el proceso de verificación.'
      });
    }

    // Guardar registro pendiente
    pendingRegistrations.set(email, {
      email,
      fullName,
      phone: phone || null,
      buildingName,
      selectedPlan,
      planDetails: PLANS[selectedPlan],
      otpVerified: false,
      checkoutCompleted: false,
      createdAt: new Date().toISOString(),
    });

    res.json({
      ok: true,
      msg: 'Registro iniciado correctamente',
      data: {
        email,
        nextStep: 'otp-verification',
        plan: PLANS[selectedPlan]
      }
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * POST /api/onboarding/send-otp
 * Enviar código OTP por email
 */
export async function sendOtp(req, res) {
  try {
    const { email } = req.body;

    // Validar email
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        ok: false,
        msg: 'Email inválido'
      });
    }

    // Verificar que existe un registro pendiente
    const pendingReg = pendingRegistrations.get(email);
    if (!pendingReg) {
      return res.status(404).json({
        ok: false,
        msg: 'No se encontró un registro pendiente para este email'
      });
    }

    // Verificar rate limiting
    const rateLimitCheck = checkEmailRateLimit(email);
    if (!rateLimitCheck.ok) {
      return res.status(429).json({
        ok: false,
        msg: rateLimitCheck.msg
      });
    }

    // Generar código OTP
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Guardar OTP
    otpStore.set(email, {
      code,
      email,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Enviar email con código OTP
    const emailResult = await sendOtpEmail(email, code);

    if (!emailResult.ok) {
      return res.status(500).json({
        ok: false,
        msg: 'Error al enviar el código. Intenta nuevamente.',
        error: emailResult.error
      });
    }

    res.json({
      ok: true,
      msg: 'Código OTP enviado correctamente',
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('Error en sendOtp:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * POST /api/onboarding/verify-otp
 * Verificar código OTP
 */
export async function verifyOtp(req, res) {
  try {
    const { email, code } = req.body;

    // Validar datos
    if (!email || !code) {
      return res.status(400).json({
        ok: false,
        msg: 'Email y código son requeridos'
      });
    }

    // Validar formato de código (6 dígitos)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        ok: false,
        msg: 'Código inválido. Debe ser de 6 dígitos'
      });
    }

    // Obtener OTP
    const otpData = otpStore.get(email);

    if (!otpData) {
      return res.status(404).json({
        ok: false,
        msg: 'Código expirado o no encontrado. Solicita uno nuevo.'
      });
    }

    // Verificar si ya se alcanzó el máximo de intentos
    if (otpData.attempts >= otpData.maxAttempts) {
      otpStore.delete(email);
      return res.status(403).json({
        ok: false,
        msg: 'Máximo de intentos alcanzado. Solicita un nuevo código.'
      });
    }

    // Verificar si expiró
    if (new Date() > new Date(otpData.expiresAt)) {
      otpStore.delete(email);
      return res.status(410).json({
        ok: false,
        msg: 'El código ha expirado. Solicita uno nuevo.'
      });
    }

    // Verificar si el código es correcto
    if (otpData.code !== code) {
      otpData.attempts += 1;
      otpStore.set(email, otpData);

      const remainingAttempts = otpData.maxAttempts - otpData.attempts;

      return res.status(400).json({
        ok: false,
        msg: `Código incorrecto. Te quedan ${remainingAttempts} intentos.`,
        remainingAttempts,
      });
    }

    // Código correcto - eliminar OTP y actualizar registro pendiente
    otpStore.delete(email);
    
    const pendingReg = pendingRegistrations.get(email);
    if (pendingReg) {
      pendingReg.otpVerified = true;
      pendingReg.verifiedAt = new Date().toISOString();
      pendingRegistrations.set(email, pendingReg);
    }

    res.json({
      ok: true,
      msg: 'Código verificado correctamente',
      verified: true,
      nextStep: 'checkout'
    });

  } catch (error) {
    console.error('Error en verifyOtp:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * POST /api/onboarding/checkout
 * Procesar pago (mockup)
 */
export async function checkout(req, res) {
  try {
    const { email, cardNumber, cardExpiry, cardCvc, cardName } = req.body;

    // Validar datos
    if (!email) {
      return res.status(400).json({
        ok: false,
        msg: 'Email es requerido'
      });
    }

    // Verificar que el usuario verificó el OTP
    const pendingReg = pendingRegistrations.get(email);
    if (!pendingReg) {
      return res.status(404).json({
        ok: false,
        msg: 'No se encontró un registro pendiente para este email'
      });
    }

    if (!pendingReg.otpVerified) {
      return res.status(403).json({
        ok: false,
        msg: 'Debes verificar tu email primero'
      });
    }

    // Validar datos de tarjeta (mockup - validación básica)
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      return res.status(400).json({
        ok: false,
        msg: 'Información de tarjeta incompleta'
      });
    }

    // Simular procesamiento de pago
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const plan = pendingReg.planDetails;

    // Actualizar registro pendiente
    pendingReg.checkoutCompleted = true;
    pendingReg.transactionId = transactionId;
    pendingReg.cardLastFour = cardNumber.slice(-4);
    pendingReg.checkoutAt = new Date().toISOString();
    pendingRegistrations.set(email, pendingReg);

    res.json({
      ok: true,
      msg: 'Pago procesado correctamente',
      data: {
        transactionId,
        amount: plan.price,
        plan: plan.name,
        nextStep: 'setup-building'
      }
    });

  } catch (error) {
    console.error('Error en checkout:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error procesando el pago',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * POST /api/onboarding/setup-building
 * Configurar edificio y crear usuario admin (primer login)
 */
export async function setupBuilding(req, res) {
  try {
    const { 
      email, 
      password,
      buildingData 
    } = req.body;

    // Validar datos
    if (!email || !password || !buildingData) {
      return res.status(400).json({
        ok: false,
        msg: 'Datos incompletos'
      });
    }

    // Verificar registro pendiente
    const pendingReg = pendingRegistrations.get(email);
    if (!pendingReg) {
      return res.status(404).json({
        ok: false,
        msg: 'No se encontró un registro pendiente para este email'
      });
    }

    if (!pendingReg.checkoutCompleted) {
      return res.status(403).json({
        ok: false,
        msg: 'Completa el pago primero'
      });
    }

    // Validar datos del edificio
    if (!buildingData.totalUnits || !buildingData.address) {
      return res.status(400).json({
        ok: false,
        msg: 'Datos del edificio incompletos'
      });
    }

    // Crear usuario administrador
    const data = getData();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const nuevoUsuario = {
      id: data.usuarios.length + 1,
      nombre: pendingReg.fullName,
      email: pendingReg.email,
      password: hashedPassword,
      telefono: pendingReg.phone || '',
      departamento: 'Admin',
      rol: 'ADMIN',
      activo: true,
      fechaRegistro: new Date().toISOString(),
      subscription: {
        plan: pendingReg.selectedPlan,
        transactionId: pendingReg.transactionId,
        startDate: new Date().toISOString(),
      },
      building: {
        name: pendingReg.buildingName,
        address: buildingData.address,
        totalUnits: buildingData.totalUnits,
        type: buildingData.type || 'edificio',
        monthlyFee: buildingData.monthlyFee || 0,
        cutoffDay: buildingData.cutoffDay || 1,
      }
    };

    data.usuarios.push(nuevoUsuario);
    setData(data);

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: nuevoUsuario.id, 
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Eliminar registro pendiente
    pendingRegistrations.delete(email);

    // Enviar email de bienvenida
    await sendWelcomeEmail({
      name: nuevoUsuario.nombre,
      email: nuevoUsuario.email,
      buildingName: pendingReg.buildingName,
    });

    res.json({
      ok: true,
      msg: 'Configuración completada exitosamente',
      token,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        departamento: nuevoUsuario.departamento,
        building: nuevoUsuario.building
      }
    });

  } catch (error) {
    console.error('Error en setupBuilding:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error en la configuración',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * GET /api/onboarding/plans
 * Obtener planes disponibles
 */
export async function getPlans(req, res) {
  try {
    res.json({
      ok: true,
      plans: PLANS
    });
  } catch (error) {
    console.error('Error en getPlans:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al obtener planes'
    });
  }
}

/**
 * GET /api/onboarding/status/:email
 * Obtener estado del proceso de onboarding
 */
export async function getOnboardingStatus(req, res) {
  try {
    const { email } = req.params;

    const pendingReg = pendingRegistrations.get(email);
    
    if (!pendingReg) {
      return res.json({
        ok: true,
        exists: false,
        msg: 'No hay proceso de onboarding activo'
      });
    }

    res.json({
      ok: true,
      exists: true,
      data: {
        email: pendingReg.email,
        fullName: pendingReg.fullName,
        buildingName: pendingReg.buildingName,
        selectedPlan: pendingReg.selectedPlan,
        otpVerified: pendingReg.otpVerified,
        checkoutCompleted: pendingReg.checkoutCompleted,
        createdAt: pendingReg.createdAt,
      }
    });

  } catch (error) {
    console.error('Error en getOnboardingStatus:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al obtener estado'
    });
  }
}

// Limpiar registros pendientes expirados cada hora
setInterval(() => {
  const now = Date.now();
  const expirationTime = 24 * 60 * 60 * 1000; // 24 horas

  for (const [email, data] of pendingRegistrations.entries()) {
    const createdAt = new Date(data.createdAt).getTime();
    if (now - createdAt > expirationTime) {
      pendingRegistrations.delete(email);
      console.log(`Registro pendiente expirado eliminado: ${email}`);
    }
  }

  // Limpiar OTPs expirados
  for (const [email, data] of otpStore.entries()) {
    if (new Date() > new Date(data.expiresAt)) {
      otpStore.delete(email);
      console.log(`OTP expirado eliminado: ${email}`);
    }
  }
}, 3600000); // Cada hora
