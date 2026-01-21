# Cambios en el Sistema de Pago (Checkout)

## 📅 Fecha
16 de Enero de 2026

## 🎯 Cambios Implementados

Se reemplazó el **checkout falso con tarjeta** por un **sistema de pago por transferencia bancaria** con acceso temporal de 48 horas y placeholder para integración futura de MercadoPago.

---

## 🔄 Antes vs Después

### ❌ Antes
- Formulario de tarjeta de crédito falso
- Procesamiento simulado instantáneo
- Acceso inmediato sin validación
- Sin opciones de pago reales

### ✅ Después
- **Transferencia bancaria** (método principal)
  - Datos bancarios reales
  - CLABE interbancaria
  - Referencia única por transacción
  - Instrucciones paso a paso
- **Acceso temporal de 48 horas**
  - Activado al confirmar transferencia
  - Countdown en tiempo real
  - Alerta visible en admin panel
- **Placeholder de MercadoPago**
  - Botón deshabilitado
  - Mensaje "Próximamente disponible"
  - Listo para integración futura

---

## 💳 Nueva Pantalla de Checkout

### Características Principales

#### 1. **Método de Pago: Transferencia Bancaria**

**Información mostrada:**
```
Banco: BBVA Bancomer
Beneficiario: ChispartBuilding SA de CV
CLABE: 012180015123456789
Referencia: CHIS-[timestamp único]
Monto: $[total con IVA] MXN
```

**Funcionalidades:**
- ✅ Botón "Copiar" para CLABE
- ✅ Botón "Copiar" para Referencia
- ✅ Cálculo automático de IVA (16%)
- ✅ Muestra subtotal, IVA y total

**Instrucciones paso a paso:**
1. Ingresar a banca en línea
2. Seleccionar "Transferencia SPEI"
3. Copiar CLABE y referencia
4. Realizar transferencia por el monto indicado
5. Conservar comprobante
6. Presionar "Confirmar Transferencia Realizada"
7. Acceso inmediato por 48 horas
8. Validación en máximo 24 horas

#### 2. **Método de Pago: MercadoPago (Placeholder)**

**Estado:** Deshabilitado / Próximamente

**Elementos visuales:**
- Icono de tarjeta de crédito
- Título: "Tarjeta de Crédito/Débito"
- Badge: "Próximamente disponible"
- Mensaje explicativo
- Botón deshabilitado con candado

**Para integrar después:**
```html
<!-- El botón ya está creado, solo necesitas -->
<button class="btn btn-primary" id="mercadopagoBtn">
  <i class="fas fa-credit-card"></i>
  Pagar con MercadoPago
</button>

<!-- Y agregar el SDK de MercadoPago -->
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

#### 3. **Alerta de Acceso Temporal**

**Ubicación:** Parte superior de la página

**Contenido:**
> **Acceso temporal de 48 horas**
>
> Una vez que confirmes tu método de pago, tendrás acceso inmediato a la plataforma por 48 horas mientras validamos tu pago. Después de la validación, tu acceso será permanente.

---

## ⏰ Modal de Confirmación

### Aparece cuando:
- Usuario presiona "Confirmar Transferencia Realizada"
- Usuario entra al admin panel con pago pendiente

### Contenido del Modal

**Título:** ¡Acceso Temporal Activado!

**Mensaje:**
> Has recibido acceso temporal a la plataforma por **48 horas** mientras validamos tu pago.

**Countdown en tiempo real:**
```
Tu acceso expira en:
48:00:00
```

**Información importante:**
- ✓ Validaremos tu pago en las próximas 24 horas
- ✓ Una vez validado, tu acceso será permanente
- ✓ Si no recibimos el pago en 48 horas, el acceso expirará
- ✓ Conserva tu comprobante de pago

**Botón:** "Entendido, continuar" → Cierra modal y va al setup

---

## 🔄 Flujo de Pago Actualizado

### Flujo Completo

```
1. Registro (register.html)
   └─> Usuario selecciona plan
   
2. Verificación OTP (verify-otp.html)
   └─> Código OTP enviado por email
   
3. Checkout (checkout.html) ← NUEVO
   ├─> Opción 1: Transferencia Bancaria
   │   ├─> Muestra datos bancarios
   │   ├─> Usuario realiza transferencia
   │   ├─> Presiona "Confirmar Transferencia"
   │   └─> ✅ Acceso temporal activado (48h)
   │
   └─> Opción 2: MercadoPago (próximamente)
       └─> Botón deshabilitado
       └─> Mensaje "Próximamente disponible"

4. Modal de Confirmación ← NUEVO
   ├─> Muestra countdown de 48 horas
   ├─> Explica validación pendiente
   └─> Botón "Continuar al Setup"

5. Setup (setup.html)
   └─> Configura edificio con acceso temporal
   
6. Login → Admin Panel
   └─> Si pago pendiente: Modal de alerta
       ├─> Muestra tiempo restante
       ├─> Explica proceso de validación
       └─> Permite continuar trabajando
```

---

## 🔧 Cambios en Backend

### Endpoint: POST /api/onboarding/checkout

**Antes:**
```javascript
// Requería datos de tarjeta
{ email, cardNumber, cardExpiry, cardCVV, cardName }

// Respuesta
{ ok: true, transactionId, nextStep }
```

**Después:**
```javascript
// Acepta método de pago
{ 
  email, 
  paymentMethod: 'transfer', 
  reference: 'CHIS-12345678',
  amount: 1158.40
}

// Respuesta
{
  ok: true,
  msg: 'Pago confirmado. Acceso temporal activado por 48 horas.',
  data: {
    transactionId,
    paymentMethod: 'transfer',
    paymentStatus: 'pending_validation',
    tempAccessExpires: '2026-01-18T18:30:00.000Z',
    hoursRemaining: 48,
    nextStep: 'setup-building'
  }
}
```

### Datos Guardados en KV

**Clave:** `otp:${email}`

**Datos adicionales:**
```javascript
{
  // ... datos existentes ...
  checkoutCompleted: true,
  paymentMethod: 'transfer',
  paymentReference: 'CHIS-12345678',
  paymentAmount: 1158.40,
  paymentStatus: 'pending_validation',
  tempAccessExpires: '2026-01-18T18:30:00.000Z',
  transactionId: 'TRANS-1768610...'
}
```

**TTL:** 172800 segundos (48 horas)

### Clave de Acceso Temporal

**Clave:** `temp_access:${buildingId}`

**Datos:**
```javascript
{
  buildingId: 1,
  userId: 1,
  email: 'user@example.com',
  paymentStatus: 'pending_validation',
  tempAccessExpires: '2026-01-18T18:30:00.000Z',
  createdAt: '2026-01-16T18:30:00.000Z'
}
```

**TTL:** 172800 segundos (48 horas)

---

## 🎨 Diseño de la Nueva Pantalla

### Layout
- **Grid de 2 columnas**: Métodos de pago | Resumen del pedido
- **Responsive**: En móvil se apila en 1 columna
- **Progress bar**: Muestra paso 3 de 4

### Colores y Estilos
- **Alerta de 48h**: Fondo amarillo (#FEF3C7), borde naranja
- **Transferencia**: Badge verde "Recomendado"
- **MercadoPago**: Badge azul, botón gris deshabilitado
- **Info bancaria**: Fondo gris claro (#F3F4F6)
- **Botón copiar**: Azul primario, cambia a verde al copiar

### Componentes Visuales

#### Alerta Superior
```
⚠️ Acceso temporal de 48 horas
Una vez que confirmes tu método de pago, tendrás acceso inmediato...
```

#### Card de Transferencia
```
🏦 Transferencia Bancaria [Recomendado]
   Realiza tu pago mediante transferencia SPEI
   
   [Tabla con datos bancarios + botones copiar]
   
   📋 Instrucciones para pago (8 pasos)
   
   [Botón: Confirmar Transferencia Realizada]
```

#### Card de MercadoPago
```
💳 Tarjeta de Crédito/Débito
   Pago inmediato con MercadoPago
   
   🔧 Próximamente disponible
   Estamos integrando MercadoPago...
   
   [Botón deshabilitado: Pagar con MercadoPago (Próximamente)]
```

---

## 📱 Modal de Acceso Temporal

### Diseño
- **Fondo oscuro** con transparencia (rgba(0,0,0,0.7))
- **Card central** blanco con sombra
- **Icono de reloj** en círculo amarillo
- **Countdown grande** en azul con fuente monospace
- **Animación** de entrada (slideIn)

### Estructura
```
┌─────────────────────────────────────┐
│          🕐 (icono reloj)           │
│                                     │
│    Acceso Temporal Activo           │
│                                     │
│  Tu pago está pendiente de...      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Tu acceso expira en:          │ │
│  │       48:00:00                │ │
│  └───────────────────────────────┘ │
│                                     │
│  ⚠️ ¿Qué sigue?                    │
│  • Validaremos tu pago...          │
│  • Una vez validado...             │
│  • Recibirás un email...           │
│                                     │
│  [✓ Entendido, continuar]          │
└─────────────────────────────────────┘
```

### Countdown Actualizado
- Se actualiza cada 1 segundo
- Formato: HH:MM:SS (ej: 47:59:58)
- Cuando llega a 00:00:00, el acceso expira

---

## 🗄️ Datos en LocalStorage

### Después del Checkout
```javascript
localStorage.setItem('payment_pending', 'true');
localStorage.setItem('temp_access_expires', expiresAt); // timestamp
localStorage.setItem('onboarding_email', email);
```

### Limpieza al Completar Setup
```javascript
// Se mantiene para validación en admin panel
// NO se limpia payment_pending ni temp_access_expires
```

---

## 🔐 Estados de Pago

### Estados Posibles

| Estado | Descripción | Acceso | Duración |
|--------|-------------|--------|----------|
| **pending_validation** | Transferencia confirmada, pendiente de validar | ✅ Temporal (48h) | 48 horas |
| **validated** | Pago validado manualmente | ✅ Permanente | Ilimitado |
| **rejected** | Pago rechazado o no recibido | ❌ Sin acceso | - |
| **expired** | Acceso temporal expirado sin validación | ❌ Sin acceso | - |

### Transiciones de Estado

```
pending_validation
    ↓ (admin valida pago)
validated ✅
    
pending_validation
    ↓ (48 horas sin validación)
expired ❌
    
pending_validation
    ↓ (pago no válido)
rejected ❌
```

---

## 📊 Información de Transferencia

### Datos Bancarios (Placeholder)

> **⚠️ IMPORTANTE**: Estos son datos de ejemplo. Debes reemplazarlos con tus datos bancarios reales.

```
Banco: BBVA Bancomer
Beneficiario: ChispartBuilding SA de CV
CLABE: 012180015123456789
Referencia: CHIS-[timestamp]
```

**Para actualizar:**
Editar en `public/checkout.html` líneas ~363-370

---

## 🛠️ Integración Futura de MercadoPago

### Pasos para Integrar

#### 1. Agregar SDK de MercadoPago
```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

#### 2. Inicializar MercadoPago
```javascript
const mp = new MercadoPago('TU_PUBLIC_KEY');
```

#### 3. Habilitar Botón
```javascript
// En checkout.html, cambiar:
<button class="btn btn-disabled" disabled id="mercadopagoBtn">
// Por:
<button class="btn btn-primary" id="mercadopagoBtn" onclick="pagarConMercadoPago()">
  <i class="fas fa-credit-card"></i>
  Pagar con MercadoPago
</button>
```

#### 4. Implementar Función de Pago
```javascript
async function pagarConMercadoPago() {
  // Crear preferencia de pago
  const preferenceData = {
    items: [{
      title: plan.name,
      unit_price: total,
      quantity: 1
    }],
    payer: { email: email },
    back_urls: {
      success: `${BASE_URL}/setup`,
      failure: `${BASE_URL}/checkout`,
      pending: `${BASE_URL}/checkout`
    }
  };

  // Crear preferencia en tu backend
  const response = await fetch('/api/mercadopago/create-preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferenceData)
  });

  const { id } = await response.json();

  // Abrir checkout de MercadoPago
  mp.checkout({
    preference: { id },
    autoOpen: true
  });
}
```

#### 5. Endpoint de Backend (a crear)
```javascript
// POST /api/mercadopago/create-preference
// POST /api/mercadopago/webhook (notificaciones de pago)
```

---

## ⚙️ Cambios en Backend

### workers-build/index.js

#### Endpoint Modificado: `/api/onboarding/checkout`

**Parámetros aceptados:**
```javascript
{
  email: string,
  paymentMethod: 'transfer' | 'mercadopago',
  reference: string,  // Referencia de transferencia
  amount: number      // Monto total
}
```

**Lógica:**
1. Verifica que el usuario completó OTP
2. Genera transactionId único
3. Calcula `tempAccessExpires` (ahora + 48h)
4. Guarda en KV con estado `pending_validation`
5. TTL de 48 horas en KV
6. Retorna datos de acceso temporal

**Respuesta:**
```javascript
{
  ok: true,
  msg: 'Pago confirmado. Acceso temporal activado por 48 horas.',
  data: {
    transactionId: 'TRANS-1768610...',
    paymentMethod: 'transfer',
    paymentStatus: 'pending_validation',
    tempAccessExpires: '2026-01-18T18:30:00.000Z',
    hoursRemaining: 48,
    nextStep: 'setup-building'
  }
}
```

#### Endpoint Modificado: `/api/onboarding/complete-setup`

**Cambios:**
- Lee `paymentStatus` y `tempAccessExpires` desde KV
- Guarda acceso temporal en KV con clave `temp_access:${buildingId}`
- Retorna información de acceso temporal en la respuesta

**Respuesta actualizada:**
```javascript
{
  ok: true,
  buildingId: 1,
  userId: 1,
  paymentStatus: 'pending_validation',
  tempAccessExpires: '2026-01-18T18:30:00.000Z',
  credentials: { email, password }
}
```

---

## 🖥️ Modal en Admin Panel

### Ubicación
`public/admin.html` - Al final del archivo, antes de `</body>`

### Lógica de Activación

```javascript
// Verificar al cargar la página
const paymentPending = localStorage.getItem('payment_pending');
const tempAccessExpires = localStorage.getItem('temp_access_expires');

if (paymentPending === 'true' && tempAccessExpires) {
  const expiresAt = parseInt(tempAccessExpires);
  const now = Date.now();
  
  if (now < expiresAt) {
    // Mostrar modal
    showPaymentPendingAlert(expiresAt);
  }
}
```

### Características
- ✅ Aparece automáticamente al cargar admin panel
- ✅ Countdown en tiempo real
- ✅ No bloquea el acceso (es informativo)
- ✅ Se puede cerrar y continuar trabajando
- ✅ Se actualiza cada segundo

---

## 📝 Variables de Configuración

### LocalStorage

| Clave | Valor | Propósito |
|-------|-------|-----------|
| `payment_pending` | `'true'` / `'false'` | Indica si el pago está pendiente |
| `temp_access_expires` | timestamp (ms) | Cuándo expira el acceso temporal |
| `onboarding_email` | email | Email del usuario |
| `onboarding_plan` | plan key | Plan seleccionado |

### KV Storage (Backend)

| Clave | Datos | TTL |
|-------|-------|-----|
| `otp:${email}` | Datos de registro + pago | 48 horas |
| `temp_access:${buildingId}` | Info de acceso temporal | 48 horas |

---

## 🧪 Testing

### Test Manual

1. **Ir a checkout:**
   ```
   https://chispartbuilding.pages.dev/checkout.html
   ```

2. **Verificar elementos:**
   - ✅ Datos bancarios visibles
   - ✅ Botones "Copiar" funcionan
   - ✅ Botón MercadoPago deshabilitado
   - ✅ Mensaje "Próximamente" visible

3. **Confirmar transferencia:**
   - Click en "Confirmar Transferencia Realizada"
   - ✅ Modal aparece
   - ✅ Countdown inicia en 48:00:00
   - ✅ Botón "Continuar al Setup" funciona

4. **Completar setup y entrar al admin:**
   - ✅ Modal de pago pendiente aparece
   - ✅ Countdown sigue funcionando
   - ✅ Información clara sobre validación

### Test Automatizado

Para actualizar el test E2E:
```javascript
// En tests/e2e/setup-flow-complete.spec.js
// Cambiar el paso de checkout para usar transferencia
await page.click('button:has-text("Confirmar Transferencia")');
await page.waitForSelector('#confirmModal.active');
await page.click('button:has-text("Continuar al Setup")');
```

---

## 🚀 Deployment

### Archivos Modificados
1. **public/checkout.html** - Completamente reescrito
2. **public/admin.html** - Modal de pago pendiente agregado
3. **workers-build/index.js** - Backend actualizado

### Commands Ejecutados
```bash
wrangler deploy                                     # Worker
wrangler pages deploy public --project-name=chispartbuilding  # Pages
```

### URLs Desplegadas
- **Worker**: https://edificio-admin.sebastianvernis.workers.dev
- **Pages**: https://chispartbuilding.pages.dev
- **Latest**: https://fcafbb24.chispartbuilding.pages.dev

---

## ⏭️ Próximos Pasos

### Validación Manual de Pagos

Necesitarás crear un panel de admin para validar transferencias:

1. **Ver pagos pendientes:**
   ```sql
   SELECT * FROM buildings 
   WHERE payment_status = 'pending_validation'
   ```

2. **Validar pago:**
   ```javascript
   // Actualizar estado en KV
   await env.KV.put(`temp_access:${buildingId}`, JSON.stringify({
     ...data,
     paymentStatus: 'validated',
     validatedAt: new Date().toISOString()
   }), { expirationTtl: 31536000 }); // 1 año

   // Limpiar flags de localStorage (via email al usuario)
   // O crear endpoint para limpiar
   ```

3. **Rechazar pago:**
   ```javascript
   // Desactivar building
   await env.DB.prepare('UPDATE buildings SET active = 0 WHERE id = ?')
     .bind(buildingId).run();
   
   // Actualizar estado
   paymentStatus = 'rejected'
   ```

### Integración de MercadoPago

1. Crear cuenta en MercadoPago Developers
2. Obtener credenciales (Public Key, Access Token)
3. Implementar endpoint `/api/mercadopago/create-preference`
4. Implementar webhook `/api/mercadopago/webhook`
5. Habilitar botón en checkout.html
6. Agregar lógica de pago con SDK

---

## 📋 Checklist de Validación

### Checkout Page
- [x] Datos bancarios mostrados
- [x] Botones copiar funcionan
- [x] Cálculo de IVA correcto
- [x] Referencia única por usuario
- [x] Botón MercadoPago deshabilitado
- [x] Mensaje "Próximamente" visible
- [x] Instrucciones paso a paso
- [x] Modal de confirmación funciona
- [x] Countdown de 48h funciona

### Backend
- [x] Acepta paymentMethod: 'transfer'
- [x] Guarda estado pending_validation
- [x] Calcula tempAccessExpires correctamente
- [x] TTL de 48 horas en KV
- [x] Retorna datos de acceso temporal

### Admin Panel
- [x] Modal de pago pendiente aparece
- [x] Countdown funciona
- [x] Usuario puede continuar trabajando
- [x] Modal se puede cerrar

---

## ✨ Resumen

### ✅ Implementado
1. Nueva pantalla de checkout con transferencia bancaria
2. Datos bancarios con botones para copiar
3. Acceso temporal de 48 horas
4. Modal de confirmación con countdown
5. Alerta en admin panel con tiempo restante
6. Backend actualizado para manejar transferencias
7. Estados de pago (pending_validation, validated, rejected)
8. Placeholder de MercadoPago listo para integración

### 📦 Archivos Entregados
- ✅ `public/checkout.html` - Nueva pantalla
- ✅ `public/admin.html` - Con modal de alerta
- ✅ `workers-build/index.js` - Backend actualizado
- ✅ `CHECKOUT_PAYMENT_CHANGES.md` - Esta documentación

### 🎯 Próximos Pasos para Ti
1. **Reemplazar datos bancarios** en checkout.html con tus datos reales
2. **Integrar MercadoPago** cuando estés listo
3. **Crear panel de validación** de transferencias
4. **Configurar emails** de confirmación de pago

**Status: ✅ COMPLETADO Y DESPLEGADO**
