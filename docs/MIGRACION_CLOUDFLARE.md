# 🚀 Migración a Cloudflare Workers - Edificio Admin SaaS

## 📋 Estado Actual

**Reverted:** Commits incorrectos de implementación Express eliminados  
**Base:** Commit `3ea37fe` (estado limpio)  
**Objetivo:** Desplegar `saas-migration/edificio-admin-saas-adapted/` a Cloudflare Workers

---

## 🎯 Plan de Migración

### Fase 1: Setup de Cloudflare (Manual - Requiere Browser)

**Ubicación:** `saas-migration/edificio-admin-saas-adapted/`

```bash
cd /home/admin/edifnuev/saas-migration/edificio-admin-saas-adapted

# 1. Login en Cloudflare (abre browser)
npx wrangler login

# 2. Crear D1 Database
npx wrangler d1 create edificio_admin_db
# Copia el database_id generado

# 3. Crear KV Namespaces
npx wrangler kv:namespace create SESSIONS
npx wrangler kv:namespace create CACHE
npx wrangler kv:namespace create RATE_LIMIT
npx wrangler kv:namespace create OTP_CODES
# Copia cada id generado

# 4. Crear R2 Bucket
npx wrangler r2 bucket create edificio-admin-uploads
```

### Fase 2: Configuración (Actualizar IDs)

Editar `wrangler.toml` con los IDs reales:

```toml
[[d1_databases]]
binding = "DB"
database_name = "edificio_admin_db"
database_id = "xxxxx-xxxxx-xxxxx"  # Del paso 2

[[kv_namespaces]]
binding = "SESSIONS"
id = "xxxxx"  # Del paso 3

[[kv_namespaces]]
binding = "CACHE"
id = "xxxxx"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "xxxxx"

[[kv_namespaces]]
binding = "OTP_CODES"
id = "xxxxx"

[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "edificio-admin-uploads"
```

### Fase 3: Variables de Entorno

```bash
# Copiar template
cp .dev.vars.example .dev.vars

# Editar con tus valores SMTP
nano .dev.vars
```

Contenido de `.dev.vars`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=noreply@edificio-admin.com
JWT_SECRET=cambiar-en-produccion
```

### Fase 4: Migraciones de Base de Datos

```bash
# Aplicar schema inicial
npx wrangler d1 execute edificio_admin_db --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute edificio_admin_db --file=./migrations/0002_rename_columns.sql
npx wrangler d1 execute edificio_admin_db --file=./migrations/0003_building_users.sql
npx wrangler d1 execute edificio_admin_db --file=./migrations/0004_edificio_admin_core.sql
npx wrangler d1 execute edificio_admin_db --file=./migrations/0005_onboarding_system.sql

# Verificar
npx wrangler d1 execute edificio_admin_db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### Fase 5: Testing Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abre: http://localhost:8787
```

### Fase 6: Deploy a Producción

```bash
# Deploy a Cloudflare
npm run deploy

# O con wrangler directo
npx wrangler publish
```

---

## 🔧 Arquitectura Cloudflare

### Stack Tecnológico

- **Cloudflare Workers**: Serverless edge computing
- **D1**: SQLite database en edge
- **KV**: Key-value storage para sesiones/OTPs
- **R2**: Object storage para archivos
- **MailChannels**: SMTP gratuito para Workers

### Ventajas vs Express

- ✅ **Escalabilidad automática**: Sin límites de tráfico
- ✅ **Global**: Deploy en 300+ ciudades
- ✅ **Zero ops**: Sin servidores que mantener
- ✅ **Costos**: Pay-as-you-go, plan gratuito generoso
- ✅ **Performance**: Sub-50ms response time

### Estructura de Datos

**D1 Database (SQLite):**
- `usuarios` - Usuarios del sistema
- `buildings` - Edificios/condominios
- `pending_users` - Registros en proceso
- `otp_codes` - Códigos de verificación
- `mockup_payments` - Transacciones mockup
- `cuotas`, `gastos`, `presupuestos`, etc.

**KV Storage:**
- `SESSIONS` - Tokens JWT y sesiones
- `OTP_CODES` - Códigos OTP (10 min TTL)
- `RATE_LIMIT` - Rate limiting
- `CACHE` - Caché de queries

**R2 Storage:**
- `edificio-admin-uploads` - Archivos subidos

---

## 📁 Archivos Clave

### Backend (Cloudflare Workers)

**Entry Point:**
```javascript
src/index.js - Router principal con itty-router
```

**Handlers (ya implementados):**
- `auth.js` - Login, logout, refresh token
- `onboarding.js` - Registro, checkout, setup
- `otp.js` - Envío y verificación OTP
- `invitations.js` - Invitaciones de usuarios
- `subscription.js` - Gestión de planes
- `buildings.js` - Multi-edificio
- `usuarios.js`, `cuotas.js`, `gastos.js`, etc.

**Middleware:**
- `auth.js` - Verificación JWT con jose
- `cors.js` - CORS headers
- `database.js` - Wrapper D1

**Utils:**
- `smtp.js` - MailChannels + fallback SMTP
- `emailTemplates.js` - Templates HTML

### Frontend

**Archivos en `public/` (ya existen):**
- Landing, registro, OTP, checkout, setup, etc.
- Requieren adaptación mínima para Workers

---

## ⚠️ Requisitos Críticos

### 1. Cuenta Cloudflare

- Plan gratuito funciona perfectamente
- Workers: 100,000 requests/día gratis
- D1: 5GB storage gratis
- KV: 100,000 reads/día gratis
- R2: 10GB storage gratis

### 2. Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 3. Variables de Entorno

Crear `.dev.vars` en `saas-migration/edificio-admin-saas-adapted/`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=noreply@edificio-admin.com
JWT_SECRET=secret-key-super-seguro-cambiar-en-prod
APP_URL=https://tu-worker.workers.dev
```

---

## 🔄 Flujo de Deploy

```
1. wrangler login
   ↓
2. Crear recursos (D1, KV, R2)
   ↓
3. Copiar IDs a wrangler.toml
   ↓
4. Aplicar migraciones SQL
   ↓
5. Configurar .dev.vars
   ↓
6. npm run dev (testing local)
   ↓
7. npm run deploy (producción)
   ↓
8. URL: https://edificio-admin-saas-adapted.TUUSUARIO.workers.dev
```

---

## 📊 Comparación

| Aspecto | Express (Revertido) | Cloudflare Workers (Correcto) |
|---------|---------------------|-------------------------------|
| **Hosting** | EC2 manual | Edge global automático |
| **Database** | data.json (file) | D1 SQLite distributed |
| **Sessions** | Map() in-memory | KV persistent |
| **Storage** | Local filesystem | R2 object storage |
| **Scaling** | Manual | Automático infinito |
| **Costo** | EC2 fijo | Pay-per-request |
| **Deploy** | PM2 manual | `wrangler publish` |
| **Logs** | PM2 logs | Cloudflare dashboard |

---

## 🎯 Próximos Pasos

### Opción A: Setup Manual (Requiere Browser)

1. **Tú ejecutas** (necesita browser para wrangler login):
   ```bash
   cd /home/admin/edifnuev/saas-migration/edificio-admin-saas-adapted
   npx wrangler login
   ```

2. **Crear recursos** y copiar IDs

3. **Yo completo** el resto (migraciones, config, deploy)

### Opción B: Documentar para Deployment Posterior

- Dejar todo listo en `saas-migration/`
- Documentar pasos exactos
- Deploy manual cuando tengas acceso

---

## 📝 Notas Importantes

1. **No duplicación**: `saas-migration/` es la implementación correcta
2. **Express eliminado**: Commits revertidos
3. **Cloudflare Workers**: Arquitectura serverless correcta
4. **D1 + KV**: Storage persistente y escalable
5. **Lógica 100% funcional**: Ya probada en saas-migration

---

**Estado:** ✅ Código revertido, listo para Cloudflare  
**Acción requerida:** Login en Cloudflare y creación de recursos  
**Ubicación:** `saas-migration/edificio-admin-saas-adapted/`
