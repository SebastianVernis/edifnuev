# 🔒 Mejoras de Seguridad Recomendadas

**Fecha:** 12 de Enero, 2026  
**Prioridad:** Alta  
**Estado:** Pendiente de Implementación

---

## 1. Generación de Contraseñas Seguras

### Problema Actual
```javascript
// ❌ INSEGURO: Contraseña hardcodeada
const password = 'admin123'; // Temporal
```

### Solución Recomendada
```javascript
// ✅ SEGURO: Generar contraseña aleatoria
function generateSecurePassword(length = 16) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Asegurar al menos un carácter de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Completar el resto de la contraseña
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Uso en el endpoint de setup
const password = generateSecurePassword(16);
```

### Implementación en Worker
```javascript
// En /api/onboarding/complete-setup
const password = generateSecurePassword(16);

const insertUser = await env.DB.prepare(
  'INSERT INTO usuarios (nombre, email, password, rol, departamento, activo, building_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
).bind('Administrador', email, password, 'ADMIN', 'Admin', 1, buildingId).run();

// Enviar contraseña por email (implementar servicio de email)
await sendPasswordEmail(email, password);

return new Response(JSON.stringify({
  ok: true,
  msg: 'Edificio configurado exitosamente. Revisa tu email para la contraseña.',
  buildingId: buildingId,
  userId: userId
  // ❌ NO devolver la contraseña en la respuesta
}), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

---

## 2. Remover OTP de Respuestas en Producción

### Problema Actual
```javascript
// ❌ INSEGURO: OTP expuesto en respuesta
return new Response(JSON.stringify({
  ok: true,
  msg: 'Código OTP enviado correctamente',
  otp: otpCode  // ❌ Expone el código
}), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

### Solución Recomendada
```javascript
// ✅ SEGURO: No exponer OTP en producción
const isDevelopment = env.ENVIRONMENT === 'development';

return new Response(JSON.stringify({
  ok: true,
  msg: 'Código OTP enviado correctamente',
  ...(isDevelopment && { otp: otpCode })  // Solo en desarrollo
}), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

### Configuración de Variables de Entorno
```bash
# En .dev.vars (desarrollo)
ENVIRONMENT=development

# En producción (Cloudflare Dashboard)
ENVIRONMENT=production
```

---

## 3. Implementar Rate Limiting para OTP

### Problema Actual
- No hay límite de intentos para envío de OTP
- Vulnerable a ataques de fuerza bruta

### Solución Recomendada
```javascript
// Rate limiting para envío de OTP
async function checkRateLimit(email, env) {
  const rateLimitKey = `rate:otp:${email}`;
  const attempts = await env.KV.get(rateLimitKey);
  
  if (attempts && parseInt(attempts) >= 3) {
    const ttl = await env.KV.getWithMetadata(rateLimitKey);
    const remainingTime = Math.ceil((ttl.metadata?.expiration - Date.now()) / 1000 / 60);
    
    return {
      allowed: false,
      message: `Demasiados intentos. Intenta nuevamente en ${remainingTime} minutos.`
    };
  }
  
  return { allowed: true };
}

async function incrementRateLimit(email, env) {
  const rateLimitKey = `rate:otp:${email}`;
  const attempts = await env.KV.get(rateLimitKey);
  const newAttempts = attempts ? parseInt(attempts) + 1 : 1;
  
  // Expirar después de 1 hora
  await env.KV.put(rateLimitKey, newAttempts.toString(), {
    expirationTtl: 3600,
    metadata: { expiration: Date.now() + 3600000 }
  });
}

// Uso en el endpoint de envío de OTP
const rateLimit = await checkRateLimit(email, env);
if (!rateLimit.allowed) {
  return new Response(JSON.stringify({
    ok: false,
    msg: rateLimit.message
  }), {
    status: 429,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Enviar OTP...
await incrementRateLimit(email, env);
```

---

## 4. Rate Limiting para Login

### Problema Actual
- No hay límite de intentos de login
- Vulnerable a ataques de fuerza bruta

### Solución Recomendada
```javascript
// Rate limiting para login
async function checkLoginRateLimit(email, env) {
  const rateLimitKey = `rate:login:${email}`;
  const attempts = await env.KV.get(rateLimitKey);
  
  if (attempts && parseInt(attempts) >= 5) {
    const ttl = await env.KV.getWithMetadata(rateLimitKey);
    const remainingTime = Math.ceil((ttl.metadata?.expiration - Date.now()) / 1000 / 60);
    
    return {
      allowed: false,
      message: `Demasiados intentos de login. Intenta nuevamente en ${remainingTime} minutos.`
    };
  }
  
  return { allowed: true };
}

async function incrementLoginAttempts(email, env) {
  const rateLimitKey = `rate:login:${email}`;
  const attempts = await env.KV.get(rateLimitKey);
  const newAttempts = attempts ? parseInt(attempts) + 1 : 1;
  
  // Expirar después de 1 hora
  await env.KV.put(rateLimitKey, newAttempts.toString(), {
    expirationTtl: 3600,
    metadata: { expiration: Date.now() + 3600000 }
  });
}

async function resetLoginAttempts(email, env) {
  const rateLimitKey = `rate:login:${email}`;
  await env.KV.delete(rateLimitKey);
}

// Uso en el endpoint de login
const rateLimit = await checkLoginRateLimit(email, env);
if (!rateLimit.allowed) {
  return new Response(JSON.stringify({
    success: false,
    message: rateLimit.message
  }), {
    status: 429,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Intentar login...
if (loginSuccessful) {
  await resetLoginAttempts(email, env);
} else {
  await incrementLoginAttempts(email, env);
}
```

---

## 5. Devolver Token JWT en Setup

### Problema Actual
```javascript
// ❌ Usuario debe hacer login después del setup
return new Response(JSON.stringify({
  ok: true,
  msg: 'Edificio configurado exitosamente',
  buildingId: buildingId,
  userId: userId,
  credentials: {
    email,
    password
  }
}), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

### Solución Recomendada
```javascript
// ✅ Devolver token JWT directamente
import jwt from '@tsndr/cloudflare-worker-jwt';

// Después de crear el usuario
const token = await jwt.sign({
  userId: userId,
  email: email,
  rol: 'ADMIN',
  buildingId: buildingId,
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
}, env.JWT_SECRET);

return new Response(JSON.stringify({
  ok: true,
  msg: 'Edificio configurado exitosamente',
  token: token,  // ✅ Token JWT incluido
  user: {
    id: userId,
    nombre: 'Administrador',
    email: email,
    rol: 'ADMIN',
    building_id: buildingId
  }
}), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

### Actualizar Frontend
```javascript
// En setup.html o checkout.html
const result = await response.json();

if (result.ok && result.token) {
  // Guardar token en localStorage
  localStorage.setItem('auth_token', result.token);
  localStorage.setItem('user', JSON.stringify(result.user));
  
  // Redirigir al dashboard
  window.location.href = '/admin';
}
```

---

## 6. Implementar Envío de Email

### Configuración de SendGrid
```javascript
// Función para enviar email con SendGrid
async function sendEmail(to, subject, html) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: to }],
        subject: subject
      }],
      from: {
        email: 'noreply@edificioadmin.com',
        name: 'Edificio Admin'
      },
      content: [{
        type: 'text/html',
        value: html
      }]
    })
  });
  
  return response.ok;
}

// Enviar OTP por email
async function sendOTPEmail(email, otp) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Código de Verificación</h2>
      <p>Tu código de verificación es:</p>
      <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
        ${otp}
      </div>
      <p>Este código expirará en 5 minutos.</p>
      <p>Si no solicitaste este código, ignora este email.</p>
    </div>
  `;
  
  return await sendEmail(email, 'Código de Verificación - Edificio Admin', html);
}

// Enviar contraseña por email
async function sendPasswordEmail(email, password) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Bienvenido a Edificio Admin</h2>
      <p>Tu cuenta ha sido creada exitosamente.</p>
      <p>Tus credenciales de acceso son:</p>
      <div style="background: #f0f0f0; padding: 20px; margin: 20px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Contraseña:</strong> ${password}</p>
      </div>
      <p>Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.</p>
      <a href="https://chispartbuilding.pages.dev/login" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
        Iniciar Sesión
      </a>
    </div>
  `;
  
  return await sendEmail(email, 'Bienvenido a Edificio Admin', html);
}
```

### Variables de Entorno
```bash
# Agregar en Cloudflare Dashboard
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
```

---

## 7. Logs de Auditoría

### Implementación
```javascript
// Función para registrar eventos de auditoría
async function logAuditEvent(env, event) {
  const auditLog = {
    timestamp: new Date().toISOString(),
    event: event.type,
    user: event.user || 'anonymous',
    email: event.email,
    ip: event.ip,
    details: event.details,
    success: event.success
  };
  
  // Guardar en D1
  await env.DB.prepare(
    `INSERT INTO audit_logs (timestamp, event, user_id, email, ip, details, success)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    auditLog.timestamp,
    auditLog.event,
    event.userId || null,
    auditLog.email,
    auditLog.ip,
    JSON.stringify(auditLog.details),
    auditLog.success ? 1 : 0
  ).run();
  
  // También guardar en KV para acceso rápido
  const logKey = `audit:${Date.now()}:${event.type}`;
  await env.KV.put(logKey, JSON.stringify(auditLog), {
    expirationTtl: 2592000 // 30 días
  });
}

// Uso en endpoints críticos
// Login
await logAuditEvent(env, {
  type: 'LOGIN_ATTEMPT',
  email: email,
  ip: request.headers.get('cf-connecting-ip'),
  success: loginSuccessful,
  details: { method: 'password' }
});

// Registro
await logAuditEvent(env, {
  type: 'USER_REGISTRATION',
  email: email,
  ip: request.headers.get('cf-connecting-ip'),
  success: true,
  details: { plan: selectedPlan }
});

// Setup
await logAuditEvent(env, {
  type: 'BUILDING_SETUP',
  userId: userId,
  email: email,
  ip: request.headers.get('cf-connecting-ip'),
  success: true,
  details: { buildingId: buildingId }
});
```

### Crear Tabla de Auditoría
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  event TEXT NOT NULL,
  user_id INTEGER,
  email TEXT,
  ip TEXT,
  details TEXT,
  success INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_event ON audit_logs(event);
CREATE INDEX idx_audit_email ON audit_logs(email);
```

---

## 8. Validación de Email Real

### Implementación
```javascript
// Validar formato de email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar que el dominio existe (DNS lookup)
async function validateEmailDomain(email) {
  const domain = email.split('@')[1];
  
  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    const data = await response.json();
    
    return data.Status === 0 && data.Answer && data.Answer.length > 0;
  } catch (error) {
    return false; // En caso de error, permitir el registro
  }
}

// Uso en el endpoint de registro
if (!isValidEmail(email)) {
  return new Response(JSON.stringify({
    ok: false,
    msg: 'Email inválido'
  }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

const domainValid = await validateEmailDomain(email);
if (!domainValid) {
  return new Response(JSON.stringify({
    ok: false,
    msg: 'El dominio del email no existe'
  }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

---

## 📋 Checklist de Implementación

### Alta Prioridad
- [ ] Implementar generación de contraseñas seguras
- [ ] Remover OTP de respuestas en producción
- [ ] Implementar rate limiting para OTP
- [ ] Implementar rate limiting para login

### Media Prioridad
- [ ] Devolver token JWT en setup
- [ ] Configurar envío de email (SendGrid)
- [ ] Implementar logs de auditoría
- [ ] Crear tabla de auditoría en D1

### Baja Prioridad
- [ ] Validación de email real
- [ ] Mejorar mensajes de error
- [ ] Agregar documentación de API

---

## 🧪 Testing de Seguridad

Después de implementar las mejoras, ejecutar:

```bash
# Test de rate limiting
for i in {1..10}; do
  curl -X POST https://edificio-admin.sebastianvernis.workers.dev/api/otp/send \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  echo ""
done

# Test de contraseñas seguras
node test-password-generation.js

# Test de logs de auditoría
node test-audit-logs.js
```

---

**Documento generado:** 12 de Enero, 2026  
**Versión:** 1.0  
**Estado:** Pendiente de Implementación
