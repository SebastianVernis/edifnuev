/**
 * Onboarding Controller
 * Maneja el flujo completo de registro, OTP, checkout y configuración inicial
 */

import { readData, writeData } from '../data.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendOtpEmail, sendWelcomeEmail, checkEmailRateLimit } from '../utils/smtp.js';
import { verifyEmailWithCache } from '../utils/emailVerification.js';
import { uploadBase64File } from '../utils/upload.js';

const JWT_SECRET = process.env.JWT_SECRET || 'edificio-admin-secret-key-2025';

// Planes disponibles (Todos con 100% de funcionalidades)
const ALL_FEATURES = [
  'Gestión de cuotas 2026-2027',
  'Historial de auditoría (Logs)',
  'Respaldos horários automáticos',
  'Gestión de fondos y presupuesto',
  'Portal completo para residentes',
  'Soporte técnico prioritario'
];

const PLANS = {
  basico: {
    name: 'Comunidad Pequeña',
    price: 499,
    maxUnits: 20,
    features: ALL_FEATURES
  },
  profesional: {
    name: 'Comunidad Mediana',
    price: 949,
    maxUnits: 50,
    features: ALL_FEATURES
  },
  empresarial: {
    name: 'Comunidad Grande',
    price: 1799,
    maxUnits: 200,
    features: ALL_FEATURES
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

    // Validar email con APILayer
    const emailVerification = await verifyEmailWithCache(email, req.env || process.env);

    if (!emailVerification.valid) {
      return res.status(400).json({
        ok: false,
        msg: emailVerification.message,
        reason: emailVerification.reason,
        suggestion: emailVerification.details?.did_you_mean || null
      });
    }

    // Log de verificación exitosa
    console.log(`✅ Email verificado: ${email} - Score: ${emailVerification.details?.score || 'N/A'}`);

    // Validar que el plan existe
    if (!PLANS[selectedPlan]) {
      return res.status(400).json({
        ok: false,
        msg: 'Plan seleccionado no válido'
      });
    }

    // Verificar si el email ya existe en usuarios
    const data = readData();
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

    // Guardar registro pendiente en memoria y en DB para persistencia
    const pendingData = {
      email,
      fullName,
      phone: phone || null,
      buildingName,
      selectedPlan,
      planDetails: PLANS[selectedPlan],
      otpVerified: false,
      checkoutCompleted: false,
      validated: false,
      status: 'pending_otp',
      createdAt: new Date().toISOString(),
    };

    pendingRegistrations.set(email, pendingData);
    
    // Persistir en data.json
    if (!data.registros_pendientes) data.registros_pendientes = [];
    const existingIndex = data.registros_pendientes.findIndex(r => r.email === email);
    if (existingIndex >= 0) {
      data.registros_pendientes[existingIndex] = pendingData;
    } else {
      data.registros_pendientes.push(pendingData);
    }
    writeData(data);

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

    // Validar email con APILayer antes de enviar OTP
    const emailVerification = await verifyEmailWithCache(email, req.env || process.env);

    if (!emailVerification.valid) {
      return res.status(400).json({
        ok: false,
        msg: emailVerification.message,
        reason: emailVerification.reason
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
      pendingReg.status = 'pending_checkout';
      pendingReg.verifiedAt = new Date().toISOString();
      pendingRegistrations.set(email, pendingReg);

      // Actualizar en DB
      const data = readData();
      const dbRegIndex = data.registros_pendientes?.findIndex(r => r.email === email);
      if (dbRegIndex >= 0) {
        data.registros_pendientes[dbRegIndex] = pendingReg;
        writeData(data);
      }
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
    const { email, cardNumber, cardExpiry, cardCvc, cardName, paymentProof, fileName } = req.body;

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

    // Si hay comprobante de pago, subirlo
    let paymentProofUrl = null;
    if (paymentProof) {
        try {
            paymentProofUrl = await uploadBase64File(
                paymentProof, 
                fileName || 'comprobante.jpg', 
                'payments', 
                req.env || process.env
            );
        } catch (uploadError) {
            console.error('Error subiendo comprobante:', uploadError);
            // No bloqueamos el proceso si falla la subida, pero avisamos
        }
    }

    // Validar datos de tarjeta (mockup - validación básica)
    // Solo si no se proporcionó un comprobante (pago con tarjeta vs transferencia)
    if (!paymentProof && (!cardNumber || !cardExpiry || !cardCvc || !cardName)) {
      return res.status(400).json({
        ok: false,
        msg: 'Información de pago incompleta'
      });
    }

    // Simular procesamiento de pago
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const plan = pendingReg.planDetails;

    // Actualizar registro pendiente
    pendingReg.checkoutCompleted = true;
    pendingReg.transactionId = transactionId;
    pendingReg.status = 'pending_validation';
    pendingReg.cardLastFour = cardNumber ? cardNumber.slice(-4) : null;
    pendingReg.cardName = cardName || null;
    pendingReg.paymentProofUrl = paymentProofUrl;
    pendingReg.paymentMethod = paymentProof ? 'transfer' : 'card';
    pendingReg.checkoutAt = new Date().toISOString();
    pendingRegistrations.set(email, pendingReg);

    // Actualizar en DB
    const data = readData();
    const dbRegIndex = data.registros_pendientes?.findIndex(r => r.email === email);
    if (dbRegIndex >= 0) {
      data.registros_pendientes[dbRegIndex] = pendingReg;
      writeData(data);
    }

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
    let pendingReg = pendingRegistrations.get(email);

    // Si no está en memoria o no está validado, verificar en persistencia (DB)
    if (!pendingReg || !pendingReg.validated) {
      const data = readData();
      const dbReg = data.registros_pendientes?.find(r => r.email === email);
      if (dbReg) {
        // Actualizar memoria con lo que hay en DB
        pendingReg = dbReg;
        pendingRegistrations.set(email, pendingReg);
      }
    }

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

    if (!pendingReg.validated) {
      return res.status(403).json({
        ok: false,
        msg: 'Tu pago está pendiente de validación por un Super Administrador'
      });
    }

    // Validar datos del edificio
    if (!buildingData.totalUnits || !buildingData.address) {
      return res.status(400).json({
        ok: false,
        msg: 'Datos del edificio incompletos'
      });
    }

    // Generar lista de unidades si se solicita un esquema específico
    let unidades = [];
    const { numberingScheme, totalUnits, unitsPB, unitsPerFloor } = buildingData;

    if (numberingScheme === 'pb_pisos') {
      // Generar PB (1, 2, 3...)
      for (let i = 1; i <= unitsPB; i++) {
        unidades.push(i.toString());
      }
      // Generar pisos (101, 102..., 201, 202...)
      const unitsRemaining = totalUnits - unitsPB;
      if (unitsRemaining > 0 && unitsPerFloor > 0) {
        const floors = Math.ceil(unitsRemaining / unitsPerFloor);
        for (let f = 1; f <= floors; f++) {
          for (let u = 1; u <= unitsPerFloor; u++) {
            if (unidades.length < totalUnits) {
              unidades.push(`${f}${u.toString().padStart(2, '0')}`);
            }
          }
        }
      }
    } else if (numberingScheme === 'consecutivo') {
      for (let i = 1; i <= totalUnits; i++) {
        unidades.push(i.toString());
      }
    } else {
      // Estándar (101, 102...)
      const upf = unitsPerFloor || 5; 
      const floors = Math.ceil(totalUnits / upf);
      for (let f = 1; f <= floors; f++) {
        for (let u = 1; u <= upf; u++) {
          if (unidades.length < totalUnits) {
            unidades.push(`${f}${u.toString().padStart(2, '0')}`);
          }
        }
      }
    }

    // Crear usuario administrador
    const data = readData();
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
        numberingScheme: buildingData.numberingScheme || 'estandar',
        unitsPB: buildingData.unitsPB || 0,
        unitsPerFloor: buildingData.unitsPerFloor || 0,
        unidades: unidades // Lista generada de departamentos
      }
    };

    data.usuarios.push(nuevoUsuario);

    // Inicializar fondos si no existen
    if (!data.fondos) {
      data.fondos = {
        ahorroAcumulado: 67500,
        gastosMayores: 125000,
        dineroOperacional: 48000,
        patrimonioTotal: 240500
      };
    }

    // Inicializar proyectos críticos si no existen
    if (!data.proyectos) {
      data.proyectos = [
        { id: 1, nombre: 'Legitimidad Legal', monto: 35000, prioridad: 'URGENTE' },
        { id: 2, nombre: 'Irregularidades Eléctricas', monto: 85000, prioridad: 'ALTA' },
        { id: 3, nombre: 'Bombas Base Inestable', monto: 45000, prioridad: 'MEDIA' },
        { id: 4, nombre: 'Estructura Castillos', monto: 120000, prioridad: 'ALTA' }
      ];
    }

    writeData(data);

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
if (process.env.NODE_ENV !== 'test') {
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
}
