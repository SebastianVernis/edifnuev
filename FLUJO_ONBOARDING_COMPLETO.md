# 🚀 Flujo de Onboarding Completo - Edificio Admin

## 📋 Resumen

Sistema completo de onboarding SaaS con:
- Landing page con pricing
- Registro de usuario
- Verificación OTP por email (SMTP real)
- Checkout con mockup de pagos
- Primer login y configuración
- Gestión de usuarios con invitaciones por email

---

## 🔄 Flujo Completo

### 1. Landing Page (`/landing`)
**Archivo:** `public/landing.html`

- Muestra características del sistema
- 3 planes de pricing: Básico ($499), Profesional ($999), Empresarial ($1,999)
- Al seleccionar plan → guarda en sessionStorage → redirige a `/register`

### 2. Registro (`/register`)
**Archivo:** `public/register.html`  
**Backend:** `POST /api/onboarding/register`

**Flujo:**
1. Muestra plan seleccionado
2. Usuario ingresa:
   - Email
   - Nombre completo
   - Teléfono (opcional)
   - Nombre del edificio
3. Backend valida y crea registro pendiente
4. Redirige a `/verify-otp`

### 3. Verificación OTP (`/verify-otp`)
**Archivo:** `public/verify-otp.html`  
**Backend:** 
- `POST /api/onboarding/send-otp` - Enviar código
- `POST /api/onboarding/verify-otp` - Verificar código

**Flujo:**
1. Usuario solicita código OTP
2. Sistema genera código de 6 dígitos
3. **Envía email real usando nodemailer** con código
4. Usuario ingresa código (máximo 5 intentos, válido 10 minutos)
5. Si es correcto → redirige a `/checkout`

**Template de Email:**
- Diseño profesional con gradiente
- Código destacado visualmente
- Instrucciones claras
- Advertencias de seguridad

### 4. Checkout (`/checkout`)
**Archivo:** `public/checkout.html`  
**Backend:** `POST /api/onboarding/checkout`

**Flujo:**
1. Muestra resumen del plan seleccionado
2. **Mockup de pago** (sin cargo real):
   - Nombre del titular
   - Número de tarjeta (cualquier número, solo validación de formato)
   - Fecha de expiración (MM/AA)
   - CVC
3. Genera transaction ID simulado
4. Redirige a `/setup`

### 5. Setup / Primer Login (`/setup`)
**Archivo:** `public/setup.html`  
**Backend:** `POST /api/onboarding/setup-building`

**Flujo:**
1. Usuario configura datos del edificio:
   - Dirección completa
   - Total de unidades
   - Tipo (edificio/condominio/residencial)
   - Cuota mensual
   - Día de corte
2. Crea contraseña de administrador
3. Backend:
   - Crea usuario con rol ADMIN
   - Guarda datos del edificio
   - Genera token JWT
   - **Envía email de bienvenida**
4. Redirige a `/admin` (dashboard)

---

## 👥 Gestión de Usuarios con Invitaciones

### 6. Invitar Usuario
**Backend:** `POST /api/invitations/send`

**Flujo:**
1. Admin accede a gestión de usuarios
2. Clic en "Invitar Usuario"
3. Ingresa:
   - Email
   - Nombre
   - Rol (ADMIN, COMITE, INQUILINO)
   - Departamento/unidad
4. Sistema genera token de invitación único
5. **Envía email con link de activación**
6. Link válido por 7 días

**Template de Email:**
- Saludo personalizado
- Información del edificio y rol
- Botón de activación destacado
- Fecha de expiración

### 7. Activar Invitación (`/activate`)
**Archivo:** `public/activate.html`  
**Backend:** 
- `GET /api/invitations/verify/:token` - Verificar token
- `POST /api/invitations/activate` - Activar cuenta

**Flujo:**
1. Usuario hace clic en link del email
2. Sistema verifica token
3. Muestra información de la invitación
4. Usuario crea su contraseña
5. Sistema:
   - Crea cuenta de usuario
   - Genera token JWT
   - Redirige a dashboard según rol

---

## 🔧 Configuración SMTP

### Archivo: `.env`

```bash
# Puerto del servidor
PORT=3001

# JWT Secret
JWT_SECRET=edificio-admin-secret-key-2025

# URL de la aplicación
APP_URL=http://localhost:3001

# Configuración SMTP (Gmail ejemplo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=noreply@edificio-admin.com
```

### Proveedores Recomendados

#### Gmail (Desarrollo)
1. Habilitar verificación en 2 pasos
2. Crear App Password
3. Usar en `SMTP_PASS`

#### SendGrid (Producción - Recomendado)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu-sendgrid-api-key
```

#### Mailgun (Alternativa)
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@tu-dominio.mailgun.org
SMTP_PASS=tu-mailgun-password
```

---

## 📁 Estructura de Archivos

### Backend

```
src/
├── controllers/
│   ├── onboarding.controller.js    # Registro, OTP, checkout, setup
│   └── invitations.controller.js   # Invitaciones de usuarios
├── routes/
│   ├── onboarding.routes.js
│   └── invitations.routes.js
└── utils/
    ├── smtp.js                     # Envío de emails con nodemailer
    └── emailTemplates.js           # Templates HTML de emails
```

### Frontend

```
public/
├── landing.html           # Landing page con pricing
├── register.html          # Registro de usuario
├── verify-otp.html        # Verificación de OTP
├── checkout.html          # Mockup de pago
├── setup.html             # Configuración inicial
├── activate.html          # Activación de invitación
└── js/modules/usuarios/
    └── invitar-usuario.js # Modal de invitación
```

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales SMTP
```

### 3. Iniciar Servidor

```bash
npm start
```

### 4. Acceder al Sistema

1. **Landing:** http://localhost:3001/landing
2. **Login existente:** http://localhost:3001/
3. **Dashboard Admin:** http://localhost:3001/admin (después de configuración)

---

## 📊 API Endpoints

### Onboarding

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/onboarding/plans` | Obtener planes disponibles |
| POST | `/api/onboarding/register` | Iniciar registro |
| POST | `/api/onboarding/send-otp` | Enviar código OTP |
| POST | `/api/onboarding/verify-otp` | Verificar código OTP |
| POST | `/api/onboarding/checkout` | Procesar pago (mockup) |
| POST | `/api/onboarding/setup-building` | Configurar edificio y crear admin |
| GET | `/api/onboarding/status/:email` | Estado del onboarding |

### Invitaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/invitations/send` | Enviar invitación (requiere auth) |
| GET | `/api/invitations/verify/:token` | Verificar token de invitación |
| POST | `/api/invitations/activate` | Activar cuenta con token |
| GET | `/api/invitations/pending` | Listar invitaciones pendientes (admin) |
| DELETE | `/api/invitations/:token` | Cancelar invitación (admin) |

---

## 🔒 Seguridad

### Rate Limiting
- OTP: Máximo 5 emails por hora por dirección
- Intentos de verificación: Máximo 5 intentos por código

### Expiración
- Códigos OTP: 10 minutos
- Invitaciones: 7 días
- Registros pendientes: 24 horas

### Validaciones
- Email válido
- Contraseña mínimo 6 caracteres
- Tokens únicos e irrepetibles
- Verificación de autenticación en endpoints protegidos

---

## 📧 Templates de Email

### 1. Código OTP
- **Asunto:** "Código de verificación - Edificio Admin"
- **Contenido:** Código de 6 dígitos destacado
- **Validez:** 10 minutos
- **Advertencias:** No compartir código

### 2. Invitación
- **Asunto:** "Invitación a Edificio Admin - [Nombre del Edificio]"
- **Contenido:** 
  - Información de la invitación
  - Rol asignado
  - Link de activación
  - Fecha de expiración
- **Validez:** 7 días

### 3. Bienvenida
- **Asunto:** "¡Bienvenido a Edificio Admin!"
- **Contenido:**
  - Confirmación de cuenta creada
  - Funcionalidades disponibles
  - Primeros pasos
  - Link al dashboard

---

## 🧪 Testing

### Flujo Completo de Prueba

1. **Acceder a landing:** `/landing`
2. **Seleccionar plan:** Clic en cualquier plan
3. **Registrarse:** Completar formulario de registro
4. **Solicitar OTP:** Clic en "Solicitar Código"
5. **Revisar email:** Copiar código de 6 dígitos
6. **Verificar OTP:** Ingresar código
7. **Checkout:** Ingresar datos de tarjeta (cualquier número válido)
8. **Configurar:** Datos del edificio + contraseña
9. **Acceder:** Automáticamente redirige a `/admin`

### Invitar Usuario

1. Login como admin
2. Ir a "Usuarios"
3. Clic en "Invitar Usuario"
4. Completar formulario
5. Usuario invitado recibe email
6. Usuario accede a link de activación
7. Crea contraseña
8. Accede al sistema

---

## 📝 Notas Importantes

### Mockup de Pagos
- **NO se realizan cargos reales**
- Acepta cualquier número de tarjeta con formato válido
- Solo genera un transaction ID simulado
- Para producción, integrar con Stripe, PayPal, Conekta, etc.

### SMTP en Producción
- **No usar Gmail** para producción (límites estrictos)
- **Usar SendGrid, Mailgun o Amazon SES**
- Configurar SPF, DKIM y DMARC para mejor entregabilidad
- Monitorear tasa de entrega y bounces

### Limpieza Automática
- Códigos OTP expirados: Se limpian cada hora
- Invitaciones expiradas: Se limpian cada hora
- Registros pendientes: Se limpian después de 24 horas

---

## ✅ Checklist de Implementación

- [x] Backend: Controladores de onboarding
- [x] Backend: Controladores de invitaciones
- [x] Backend: Utilidades SMTP con nodemailer
- [x] Backend: Templates de email HTML
- [x] Backend: Rutas de API
- [x] Frontend: Landing page con pricing
- [x] Frontend: Página de registro
- [x] Frontend: Página de verificación OTP
- [x] Frontend: Página de checkout
- [x] Frontend: Página de setup
- [x] Frontend: Página de activación
- [x] Frontend: Modal de invitación de usuarios
- [x] Configuración: .env.example
- [x] Documentación: Este archivo

---

## 🚀 Próximos Pasos

1. **Configurar SMTP** en `.env` con credenciales reales
2. **Probar flujo completo** desde landing hasta dashboard
3. **Integrar pasarela de pago real** (Stripe, Conekta, etc.)
4. **Configurar dominio** y SSL para producción
5. **Monitorear emails** y ajustar templates según feedback

---

## 💡 Soporte

Para más información o problemas:
1. Revisar logs del servidor
2. Verificar configuración SMTP
3. Validar que todos los archivos estén en su lugar
4. Revisar este documento para flujo completo

---

**Fecha de implementación:** 2025-12-13  
**Versión:** 1.0.0  
**Estado:** ✅ COMPLETADO
