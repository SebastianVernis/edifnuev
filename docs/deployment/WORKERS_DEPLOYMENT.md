# 🌩️ Cloudflare Workers Deployment Guide

Guía completa para desplegar Edificio Admin en Cloudflare Workers con D1, KV y R2.

## 📋 Requisitos Previos

1. **Cuenta de Cloudflare**
   - Crear cuenta en [Cloudflare](https://cloudflare.com)
   - Plan Workers Paid ($5/mes) recomendado para D1

2. **Wrangler CLI**
   ```bash
   npm install -g wrangler
   # O usar local
   npx wrangler --version
   ```

3. **Autenticación**
   ```bash
   wrangler login
   ```

## 🏗️ Arquitectura Workers

```
Cloudflare Workers Stack:
├── Workers (Compute)          - Lógica de aplicación
├── D1 (Database)              - Base de datos SQL
├── KV (Key-Value)             - Sesiones y cache
├── R2 (Object Storage)        - Uploads de archivos
└── Pages (Static Assets)      - Frontend estático
```

## 🚀 Deployment Paso a Paso

### 1️⃣ Setup Inicial

```bash
cd /home/admin/edifnuev

# Verificar archivos
ls -la wrangler.toml
ls -la workers-build/index.js
ls -la migrations/
```

### 2️⃣ Crear D1 Database

```bash
# Crear base de datos
wrangler d1 create edificio-admin-db

# Output mostrará:
# database_id = "xxxx-xxxx-xxxx"

# Copiar database_id a wrangler.toml
nano wrangler.toml
# Actualizar: database_id = "tu-database-id-aqui"
```

### 3️⃣ Ejecutar Migrations

```bash
# Local (testing)
wrangler d1 migrations apply edificio-admin-db --local

# Remote (production)
wrangler d1 migrations apply edificio-admin-db --remote

# Verificar tablas
wrangler d1 execute edificio-admin-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### 4️⃣ Crear KV Namespace

```bash
# Crear namespace
wrangler kv:namespace create "KV"

# Output mostrará:
# id = "xxxx-xxxx-xxxx"

# Actualizar wrangler.toml
nano wrangler.toml
# En [[kv_namespaces]]: id = "tu-kv-id-aqui"
```

### 5️⃣ Crear R2 Bucket

```bash
# Crear bucket para uploads
wrangler r2 bucket create edificio-admin-uploads

# Verificar
wrangler r2 bucket list
```

### 6️⃣ Configurar Secrets

```bash
# JWT Secret
wrangler secret put JWT_SECRET
# Ingresa: (generar con: openssl rand -base64 32)

# SMTP Configuration
wrangler secret put SMTP_HOST
# Ejemplo: smtp.gmail.com

wrangler secret put SMTP_PORT
# Ejemplo: 587

wrangler secret put SMTP_USER
# Tu email

wrangler secret put SMTP_PASS
# App password o API key

wrangler secret put SMTP_FROM
# Email remitente

# Listar secrets configurados
wrangler secret list
```

### 7️⃣ Deploy Worker

```bash
# Opción A: Script automatizado
./scripts/deployment/deploy-workers.sh

# Opción B: Manual
wrangler deploy

# Output mostrará la URL:
# ✅ https://edificio-admin.YOUR_SUBDOMAIN.workers.dev
```

## ✅ Verificación Post-Deploy

### Test Health Check

```bash
curl https://edificio-admin.YOUR_SUBDOMAIN.workers.dev/api/validation/health

# Respuesta esperada:
# {
#   "status": "healthy",
#   "timestamp": "2025-12-28...",
#   "environment": "cloudflare-workers"
# }
```

### Test Login

```bash
curl -X POST https://edificio-admin.YOUR_SUBDOMAIN.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@edificio.com","password":"admin123"}'

# Respuesta esperada:
# {
#   "success": true,
#   "token": "eyJ...",
#   "user": {...}
# }
```

### Test con Token

```bash
TOKEN="tu-token-aqui"

curl https://edificio-admin.YOUR_SUBDOMAIN.workers.dev/api/usuarios \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Gestión de D1 Database

### Consultas Directas

```bash
# Listar usuarios
wrangler d1 execute edificio-admin-db \
  --command="SELECT id, nombre, email, rol FROM usuarios"

# Contar cuotas
wrangler d1 execute edificio-admin-db \
  --command="SELECT COUNT(*) as total FROM cuotas"

# Ver estructura tabla
wrangler d1 execute edificio-admin-db \
  --command="PRAGMA table_info(usuarios)"
```

### Insertar Datos de Prueba

```bash
# Crear usuario de prueba
wrangler d1 execute edificio-admin-db \
  --command="INSERT INTO usuarios (nombre, email, password, rol, departamento) 
             VALUES ('Test User', 'test@test.com', 'test123', 'INQUILINO', '102')"
```

### Backup Database

```bash
# Exportar datos
wrangler d1 export edificio-admin-db --output=backup.sql

# Importar datos
wrangler d1 execute edificio-admin-db --file=backup.sql
```

## 🌐 Configurar Dominio Personalizado

### Opción 1: Workers Route

```bash
# En Cloudflare Dashboard
# Workers & Pages > edificio-admin > Settings > Triggers
# Add Custom Domain: edificio.tudominio.com
```

### Opción 2: Via CLI

```bash
# Agregar route en wrangler.toml
routes = [
  { pattern = "edificio.tudominio.com/*", zone_name = "tudominio.com" }
]

# Redeploy
wrangler deploy
```

## 📈 Monitoreo y Logs

### Ver Logs en Tiempo Real

```bash
# Tail logs
wrangler tail

# Con filtros
wrangler tail --format=pretty --status=error
```

### Métricas

```bash
# Ver analytics
wrangler pages deployment list
```

### Dashboard

Acceder a: https://dash.cloudflare.com
- Workers & Pages > edificio-admin > Analytics

## 🔄 Actualizaciones

### Deploy Nueva Versión

```bash
# 1. Hacer cambios en workers-build/index.js
# 2. Deploy
wrangler deploy

# 3. Verificar
curl https://edificio-admin.YOUR_SUBDOMAIN.workers.dev/api/validation/health
```

### Rollback

```bash
# Ver versiones
wrangler deployments list

# Hacer rollback a versión anterior
wrangler rollback --message="Reverting to previous version"
```

## 💰 Costos

### Workers Paid Plan ($5/mes)
- **Requests:** 10 millones incluidos
- **Duration:** 30 millones CPU ms
- **Additional:** $0.50 por millón requests

### D1 (Incluido en Workers Paid)
- **Reads:** 25 millones/día gratis
- **Writes:** 50,000/día gratis

### R2 Storage
- **Storage:** $0.015 per GB/mes
- **Reads:** Gratis (Clase A: $4.50/millón, Clase B: gratis)
- **Writes:** $4.50 por millón

### KV
- **Reads:** 10 millones/día gratis
- **Writes:** 1,000/día gratis
- **Storage:** $0.50 per GB/mes

**Estimado para app pequeña:** $5-10/mes

## 🔧 Troubleshooting

### Error: "Database not found"

```bash
# Verificar database_id en wrangler.toml
wrangler d1 list

# Ejecutar migrations
wrangler d1 migrations apply edificio-admin-db --remote
```

### Error: "KV namespace not found"

```bash
# Verificar KV namespace
wrangler kv:namespace list

# Actualizar id en wrangler.toml
```

### Error: "Secret not set"

```bash
# Listar secrets
wrangler secret list

# Configurar faltantes
wrangler secret put SECRET_NAME
```

### Error: "CORS"

El Worker ya incluye headers CORS. Verificar en workers-build/index.js.

### Performance Lenta

```bash
# Verificar logs para errores
wrangler tail

# Revisar queries SQL (agregar indices si es necesario)
```

## 📚 Recursos Adicionales

- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## 🎯 Checklist de Deployment

- [ ] Wrangler CLI instalado y autenticado
- [ ] D1 database creada
- [ ] Database ID en wrangler.toml
- [ ] Migrations ejecutadas (local y remote)
- [ ] KV namespace creado y configurado
- [ ] R2 bucket creado
- [ ] Secrets configurados (JWT_SECRET, SMTP_*)
- [ ] Worker desplegado
- [ ] Health check respondiendo
- [ ] Login funcionando
- [ ] Datos de prueba en D1
- [ ] Logs monitoreados
- [ ] Dominio personalizado configurado (opcional)

## 🆘 Soporte

- **Workers Issues:** [Community Forum](https://community.cloudflare.com/)
- **D1 Status:** [Cloudflare Status](https://www.cloudflarestatus.com/)
- **Pricing:** [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)

---

**Última actualización:** 2025-12-28  
**Versión:** 2.0.0 Workers
