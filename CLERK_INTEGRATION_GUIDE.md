# 🔐 Guía de Integración de Clerk - ChispartBuilding

## 📋 Resumen

Esta guía documenta la integración completa de Clerk para autenticación y gestión de usuarios en ChispartBuilding.

## ✅ Componentes Implementados

### 1. **Backend - Cloudflare Workers**
- ✅ Middleware de autenticación con Clerk (`src/middleware/clerk-auth.js`)
- ✅ Webhook handler para sincronización (`src/controllers/clerk-webhook.controller.js`)
- ✅ Endpoints de autenticación (`src/controllers/clerk-auth.controller.js`)
- ✅ Métodos en modelo Usuario para Clerk (`src/models/Usuario.js`)
- ✅ Rutas integradas en `workers-build/index.js`

### 2. **Base de Datos**
- ✅ Migración `0007_add_clerk_integration.sql` aplicada
- ✅ Columnas agregadas: `clerk_user_id`, `created_via_clerk`, `clerk_metadata`
- ✅ Índices creados para optimización

### 3. **Frontend**
- ✅ Módulo de autenticación (`public/js/clerk-auth.js`)
- ✅ Página de login con Clerk (`public/clerk-login.html`)
- ✅ Integración con Clerk SDK

### 4. **Configuración**
- ✅ Variables de entorno configuradas
- ✅ Secrets de Cloudflare configurados
- ✅ Dependencias instaladas

---

## 🔧 Configuración de Clerk Dashboard

### Paso 1: Configurar Webhooks

1. Ve a [Clerk Dashboard](https://dashboard.clerk.com)
2. Selecciona tu aplicación: **polished-hagfish-59**
3. Ve a **Webhooks** en el menú lateral
4. Click en **Add Endpoint**

**Configuración del Webhook:**

```
Endpoint URL (Desarrollo): http://localhost:3001/api/webhooks/clerk
Endpoint URL (Producción): https://edificio-admin.sebastianvernis.workers.dev/api/webhooks/clerk

Eventos a suscribir:
☑️ user.created
☑️ user.updated
☑️ user.deleted

Signing Secret: [Se genera automáticamente]
```

5. Copia el **Signing Secret** y configúralo:

```bash
# Desarrollo local (.env)
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Producción (Cloudflare Workers)
npx wrangler secret put CLERK_WEBHOOK_SECRET
# Pegar el secret cuando se solicite
```

### Paso 2: Configurar Metadata del Usuario

En Clerk Dashboard, configura los campos de metadata pública:

1. Ve a **User & Authentication** → **Metadata**
2. Agrega estos campos a **Public Metadata**:

```json
{
  "rol": "INQUILINO",
  "departamento": "",
  "buildingId": null,
  "telefono": ""
}
```

### Paso 3: Configurar URLs de Redirección

1. Ve a **Paths** en Clerk Dashboard
2. Configura:

```
Sign-in URL: /clerk-login.html
Sign-up URL: /clerk-login.html
After sign-in URL: /admin.html
After sign-up URL: /setup.html
```

---

## 🚀 Testing Local

### 1. Iniciar Servidor de Desarrollo

```bash
cd /home/sebastianvernis/Proyectos/edifnuev
npm run dev
```

El servidor estará disponible en: `http://localhost:3001`

### 2. Probar Endpoints

#### Test Webhook Endpoint
```bash
curl http://localhost:3001/api/webhooks/clerk/test
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "msg": "Clerk webhook endpoint is active",
  "timestamp": "2026-01-19T01:00:00.000Z",
  "env": {
    "hasClerkSecret": true,
    "hasWebhookSecret": true,
    "mode": "development"
  }
}
```

#### Test Health Check
```bash
curl http://localhost:3001/api/validation/health
```

### 3. Probar Login con Clerk

1. Abre en el navegador: `http://localhost:3001/clerk-login.html`
2. Deberías ver el componente de Sign In de Clerk
3. Intenta registrarte o iniciar sesión

### 4. Verificar Sincronización

Después de crear un usuario en Clerk:

```bash
# Verificar que el usuario se creó en la base de datos
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxxx.sqlite

SELECT * FROM usuarios WHERE clerk_user_id IS NOT NULL;
```

---

## 🌐 Testing en Producción (Cloudflare Workers)

### 1. Aplicar Migración a Producción

```bash
npx wrangler d1 execute edificio-admin-db --remote --file=migrations/0007_add_clerk_integration.sql
```

### 2. Desplegar Worker

```bash
npm run deploy:workers
```

### 3. Configurar Webhook en Clerk

1. En Clerk Dashboard, actualiza la URL del webhook a:
   ```
   https://edificio-admin.sebastianvernis.workers.dev/api/webhooks/clerk
   ```

2. Prueba el webhook desde Clerk Dashboard:
   - Ve a tu webhook configurado
   - Click en **Send Test Event**
   - Selecciona `user.created`
   - Verifica que el evento se procese correctamente

### 4. Probar Endpoints en Producción

```bash
# Test webhook endpoint
curl https://edificio-admin.sebastianvernis.workers.dev/api/webhooks/clerk/test

# Test health check
curl https://edificio-admin.sebastianvernis.workers.dev/api/validation/health
```

---

## 📝 Flujos de Usuario

### Flujo 1: Nuevo Usuario (Registro)

1. Usuario visita `/clerk-login.html`
2. Click en "Sign Up"
3. Completa formulario de Clerk
4. Clerk envía webhook `user.created` → Backend crea usuario en D1
5. Usuario es redirigido a `/setup.html` para completar perfil
6. Usuario completa setup (departamento, teléfono, etc.)
7. POST a `/api/auth/clerk-setup` → Actualiza datos en D1
8. Usuario es redirigido según su rol

### Flujo 2: Usuario Existente (Login)

1. Usuario visita `/clerk-login.html`
2. Ingresa credenciales
3. Clerk autentica y genera token
4. Frontend obtiene token de sesión
5. GET a `/api/auth/me` con token → Backend retorna datos del usuario
6. Usuario es redirigido según su rol:
   - ADMIN → `/admin.html`
   - COMITE → `/admin.html`
   - INQUILINO → `/inquilino.html`

### Flujo 3: Actualización de Usuario

1. Usuario actualiza su perfil en Clerk
2. Clerk envía webhook `user.updated`
3. Backend actualiza datos en D1
4. Cambios se reflejan en próximo login

### Flujo 4: Eliminación de Usuario

1. Admin elimina usuario en Clerk Dashboard
2. Clerk envía webhook `user.deleted`
3. Backend marca usuario como inactivo (soft delete)
4. Usuario no puede iniciar sesión

---

## 🔐 Seguridad

### Headers de Autenticación

El sistema soporta dos métodos de autenticación:

1. **Clerk Token (Recomendado)**
   ```
   Authorization: Bearer <clerk_session_token>
   ```

2. **JWT Legacy (Compatibilidad)**
   ```
   x-auth-token: <jwt_token>
   ```

### Verificación de Webhooks

Los webhooks de Clerk son verificados usando Svix:

```javascript
// Verificación automática en el backend
const payload = await verifyWebhookSignature(req, env.CLERK_WEBHOOK_SECRET);
```

### Roles y Permisos

Los roles se gestionan en `public_metadata` de Clerk:

- **ADMIN**: Acceso completo
- **COMITE**: Permisos configurables
- **INQUILINO**: Acceso limitado a su información

---

## 🐛 Troubleshooting

### Problema: Webhook no se recibe

**Solución:**
1. Verifica que el endpoint esté accesible públicamente
2. Revisa los logs de Clerk Dashboard
3. Verifica el Signing Secret

```bash
# Test manual del webhook
curl -X POST http://localhost:3001/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test" \
  -d '{"type":"user.created","data":{"id":"test"}}'
```

### Problema: Token inválido

**Solución:**
1. Verifica que `CLERK_SECRET_KEY` esté configurado
2. Verifica que el token no haya expirado
3. Revisa los logs del navegador

```javascript
// Debug en el navegador
const token = await window.ClerkAuth.getSessionToken();
console.log('Token:', token);
```

### Problema: Usuario no se crea en D1

**Solución:**
1. Verifica que la migración se haya aplicado
2. Revisa los logs del webhook
3. Verifica la conexión a D1

```bash
# Verificar estructura de la tabla
npx wrangler d1 execute edificio-admin-db --local --command="PRAGMA table_info(usuarios)"
```

---

## 📚 Recursos

### Documentación
- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)

### Archivos Clave
- `src/middleware/clerk-auth.js` - Middleware de autenticación
- `src/controllers/clerk-webhook.controller.js` - Handler de webhooks
- `src/models/Usuario.js` - Métodos de sincronización
- `public/js/clerk-auth.js` - SDK frontend
- `public/clerk-login.html` - Página de login

### Endpoints API
- `GET /api/auth/me` - Obtener usuario autenticado
- `POST /api/auth/clerk-setup` - Completar setup de usuario
- `POST /api/webhooks/clerk` - Recibir webhooks de Clerk
- `GET /api/webhooks/clerk/test` - Test del webhook

---

## ✅ Checklist de Implementación

- [x] Instalar dependencias de Clerk
- [x] Configurar variables de entorno
- [x] Crear migración de base de datos
- [x] Implementar middleware de autenticación
- [x] Crear webhook handler
- [x] Actualizar modelo Usuario
- [x] Crear endpoints de autenticación
- [x] Integrar frontend con Clerk
- [x] Crear página de login
- [ ] Configurar webhook en Clerk Dashboard
- [ ] Aplicar migración a producción
- [ ] Desplegar a Cloudflare Workers
- [ ] Probar flujo completo de registro
- [ ] Probar flujo completo de login
- [ ] Probar sincronización de webhooks
- [ ] Documentar para el equipo

---

## 🎉 Próximos Pasos

1. **Configurar Webhook en Clerk Dashboard** (ver Paso 1 arriba)
2. **Probar localmente** con usuarios de prueba
3. **Desplegar a producción** cuando esté listo
4. **Migrar usuarios existentes** (opcional)
5. **Actualizar documentación de usuario**

---

**Fecha de Implementación:** 19 de Enero, 2026  
**Versión:** 1.0.0  
**Estado:** ✅ Implementación Completa - Pendiente Testing
