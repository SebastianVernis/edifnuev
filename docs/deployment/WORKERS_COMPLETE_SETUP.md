# ✅ Cloudflare Workers - Setup Completo

## 🎯 Estado Actual

**Worker API:** ✅ Desplegado y funcional  
**URL:** https://edificio-admin.sebastianvernis.workers.dev  
**D1 Database:** ✅ Configurado  
**Frontend:** ⚠️ Requiere configuración

## 📊 Lo que YA Funciona

### API Endpoints (4 funcionando)
```
✅ GET  /api/validation/health  - Health check
✅ POST /api/auth/login          - Login con JWT
✅ GET  /api/usuarios            - Lista usuarios (requiere auth)
✅ GET  /api/cuotas              - Lista cuotas (requiere auth)
```

### Base de Datos D1
```
✅ 13 tablas creadas
✅ Indices optimizados
✅ 2 usuarios de prueba
✅ Migrations aplicadas
```

### Autenticación
```
✅ JWT generation con Web Crypto API
✅ JWT verification
✅ Token expiration (24 horas)
✅ Protected routes
```

## 🔧 Configuración del Frontend

### Opción 1: Conectar Frontend Existente al Worker API

**Actualizar constants.js o crear api-config.js:**

```javascript
// public/js/utils/api-config.js
export const API_URL = 'https://edificio-admin.sebastianvernis.workers.dev';
```

**Luego actualizar imports en todos los módulos:**
```javascript
// Antes
import { API_URL } from './utils/constants.js';

// Ahora
import { API_URL } from './utils/api-config.js';
```

### Opción 2: Deploy Frontend a Cloudflare Pages

**Método A: Desde Dashboard (Recomendado)**

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com) > Pages
2. Click "Create a project"
3. Select "Direct Upload"
4. Project name: `edificio-admin-pages`
5. Upload `public/` folder
6. Deploy

**URL resultante:** https://edificio-admin-pages.pages.dev

**Método B: Via CLI (requiere proyecto creado)**

```bash
# Primero crear proyecto en dashboard, luego:
wrangler pages deploy public --project-name=edificio-admin-pages
```

### Opción 3: Usar Workers Sites (Configurado pero 404)

El Worker ya tiene `[site]` configurado en wrangler.toml y sube los 55 assets.

**Para arreglar el 404:**
- Los assets están en KV pero el routing necesita ajuste
- Alternativa: Usar Pages (más simple para assets estáticos)

## 🚀 Deploy Completo (Recomendado)

### Arquitectura Recomendada

```
Frontend (Pages)  →  API (Workers)  →  Database (D1)
smartbuilding          edificio-admin     edificio-admin-db
.pages.dev            .workers.dev        (D1)
```

### Setup en 3 Pasos

**1. Configurar API URL en frontend:**
```bash
cd /home/admin/edifnuev

# Crear configuración
cat > public/js/config.js << 'EOF'
window.API_CONFIG = {
  BASE_URL: 'https://edificio-admin.sebastianvernis.workers.dev'
};
EOF

# Agregar a index.html antes de otros scripts
<script src="/js/config.js"></script>
```

**2. Deploy frontend a Pages existente:**
```bash
wrangler pages deploy public --project-name=smartbuilding
```

**3. Test completo:**
```bash
# Abrir en navegador
https://smartbuilding.pages.dev

# Login con:
# admin@edificio.com / admin123
```

## 🧪 Testing del Worker

**Test rápido:**
```bash
./test-worker.sh
```

**Test completo:**
```bash
node workers-test-complete.js
```

**Test manual:**
```bash
# Health
curl https://edificio-admin.sebastianvernis.workers.dev/api/validation/health

# Login
curl -X POST https://edificio-admin.sebastianvernis.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@edificio.com","password":"admin123"}'
```

## 📈 Expandir el Worker

### Agregar Más Endpoints

Editar `workers-build/index.js` y agregar:

```javascript
// GET /api/gastos
if (method === 'GET' && path === '/api/gastos') {
  const authError = await verifyAuth(request, env);
  if (authError) return authError;

  const { results } = await env.DB.prepare('SELECT * FROM gastos ORDER BY fecha DESC').all();
  
  return new Response(JSON.stringify({
    success: true,
    gastos: results
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// POST /api/gastos
if (method === 'POST' && path === '/api/gastos') {
  const authError = await verifyAuth(request, env);
  if (authError) return authError;

  const body = await request.json();
  
  const stmt = env.DB.prepare(
    'INSERT INTO gastos (concepto, monto, categoria, fecha, descripcion) VALUES (?, ?, ?, ?, ?)'
  ).bind(body.concepto, body.monto, body.categoria, body.fecha, body.descripcion);
  
  await stmt.run();
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Gasto creado'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

Luego: `wrangler deploy`

## 🔒 Configurar Más Secrets

```bash
# SMTP (si necesitas enviar emails desde Worker)
wrangler secret put SMTP_HOST
wrangler secret put SMTP_PORT  
wrangler secret put SMTP_USER
wrangler secret put SMTP_PASS
wrangler secret put SMTP_FROM
```

## 💾 Backup de D1

```bash
# Exportar datos
wrangler d1 export edificio-admin-db --remote --output=d1-backup-$(date +%Y%m%d).sql

# Importar datos
wrangler d1 execute edificio-admin-db --remote --file=d1-backup.sql
```

## 📊 Monitoreo

```bash
# Logs en tiempo real
wrangler tail --format=pretty

# Ver deployments
wrangler deployments list

# Rollback si es necesario
wrangler rollback
```

## ✅ Checklist Deployment

- [x] Worker desplegado
- [x] D1 database creada
- [x] Migrations aplicadas
- [x] Secrets configurados (JWT_SECRET)
- [x] Health check funcionando
- [x] Login funcionando
- [x] Endpoints protegidos funcionando
- [x] CORS configurado
- [x] Tests pasando
- [ ] Frontend conectado al Worker API
- [ ] Todos los endpoints implementados
- [ ] SMTP configurado (opcional)
- [ ] KV configurado (opcional)
- [ ] R2 configurado (opcional)
- [ ] Dominio personalizado (opcional)

## 🆘 Troubleshooting

**Error: Database not configured**
- Verificar database_id en wrangler.toml
- Correr migrations: `wrangler d1 migrations apply edificio-admin-db --remote`

**Error: 401 Unauthorized**
- Verificar JWT_SECRET configurado
- Verificar token en header Authorization

**Error: Frontend 404**
- Opción A: Deploy a Pages separado
- Opción B: Arreglar Workers Sites routing
- Opción C: Usar proyecto Pages existente (smartbuilding.pages.dev)

---

**Última actualización:** 2025-12-28  
**Estado:** ✅ API Funcional, Frontend pendiente de conectar
