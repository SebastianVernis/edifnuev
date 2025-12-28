# 🧪 Testing E2E - SmartBuilding SaaS

**Fecha:** 2025-12-16  
**Estado:** ✅ Activo - Cloudflare Workers + Pages

---

## 📊 Estado del Proyecto

### **Infraestructura**
```yaml
PM2 Servicios: ❌ Detenidos (migrado a Cloudflare)
Backend: ✅ Cloudflare Workers
Frontend: ✅ Cloudflare Pages  
Proxy: Workers → Pages
Build Local: ❌ Eliminado (dist/)
```

### **Repositorio**
```bash
Branch: master
Último commit: 4bd02fe - Multitenancy (building_id en JWT)
Estado: Clean (dist/ eliminado, pendiente commit)
```

---

## 👥 Usuarios Demo

**⚠️ CONTRASEÑA UNIVERSAL: `Gemelo1`**

### **1. Administrador Principal**
```json
{
  "email": "admin@edificio205.com",
  "password": "Gemelo1",
  "rol": "ADMIN",
  "departamento": "ADMIN",
  "permisos": "COMPLETOS"
}
```

### **2. Inquilino - Depto 101 (Validado + Legitimidad)**
```json
{
  "nombre": "María García",
  "email": "maria.garcia@edificio205.com",
  "password": "Gemelo1",
  "rol": "INQUILINO",
  "departamento": "101",
  "legitimidad_entregada": true,
  "estatus_validacion": "validado"
}
```

### **3. Inquilino - Depto 102 (Sin Legitimidad)**
```json
{
  "nombre": "Carlos López",
  "email": "carlos.lopez@edificio205.com",
  "password": "Gemelo1",
  "rol": "INQUILINO",
  "departamento": "102",
  "legitimidad_entregada": false,
  "estatus_validacion": "validado"
}
```

### **4. Inquilino - Depto 201 (Validado)**
```json
{
  "nombre": "Ana Martínez",
  "email": "ana.martinez@edificio205.com",
  "password": "Gemelo1",
  "rol": "INQUILINO",
  "departamento": "201",
  "legitimidad_entregada": true,
  "estatus_validacion": "validado"
}
```

### **5. Inquilino - Depto 202 (Sin Legitimidad)**
```json
{
  "nombre": "Roberto Silva",
  "email": "roberto.silva@edificio205.com",
  "password": "Gemelo1",
  "rol": "INQUILINO",
  "departamento": "202",
  "legitimidad_entregada": false,
  "estatus_validacion": "validado"
}
```

---

## 🎯 Casos de Prueba E2E

### **Test 1: Login Flow**
```bash
# Caso 1.1: Admin Login
curl -X POST https://your-worker.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@edificio205.com","password":"Gemelo1"}'

# Esperado: 200 + JWT con building_id

# Caso 1.2: Inquilino Login
curl -X POST https://your-worker.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria.garcia@edificio205.com","password":"Gemelo1"}'

# Esperado: 200 + JWT con building_id + departamento:101
```

### **Test 2: Permisos RBAC**
```javascript
// Admin: Puede ver todos los departamentos
GET /api/cuotas → Todas las cuotas (101, 102, 201, 202)

// Inquilino 101: Solo su departamento
GET /api/cuotas → Solo cuotas de 101

// Inquilino sin legitimidad (102): Acceso limitado
GET /api/gastos → 403 (requiere legitimidad)
```

### **Test 3: Multitenancy**
```bash
# Building A
Authorization: Bearer <JWT con building_id=1>
GET /api/usuarios → Usuarios del edificio 1

# Building B  
Authorization: Bearer <JWT con building_id=2>
GET /api/usuarios → Usuarios del edificio 2 (aislados)
```

### **Test 4: CRUD Cuotas (Admin)**
```bash
# 4.1: Crear cuota
POST /api/cuotas
{
  "mes": "Enero",
  "anio": 2026,
  "monto": 600,
  "departamento": "101",
  "fechaVencimiento": "2026-02-01"
}

# 4.2: Actualizar estado
PUT /api/cuotas/5
{
  "estado": "PAGADO",
  "fechaPago": "2025-12-16",
  "comprobantePago": "COMP-001"
}

# 4.3: Consultar cuotas
GET /api/cuotas?mes=Diciembre&anio=2025

# 4.4: Eliminar cuota (solo ADMIN)
DELETE /api/cuotas/999
```

### **Test 5: CRUD Gastos (Admin)**
```bash
# 5.1: Crear gasto
POST /api/gastos
{
  "concepto": "Mantenimiento elevador",
  "monto": 5000,
  "categoria": "MANTENIMIENTO",
  "fecha": "2025-12-16",
  "factura": "FAC-001"
}

# 5.2: Listar gastos
GET /api/gastos?mes=12&anio=2025

# 5.3: Actualizar gasto
PUT /api/gastos/1
{
  "monto": 5500,
  "estado": "APROBADO"
}
```

### **Test 6: Fondos (Admin)**
```bash
# 6.1: Consultar balance
GET /api/fondos/balance

# Esperado:
{
  "saldoActual": 15000,
  "ingresos": 22000,
  "egresos": 7000,
  "cuotasPendientes": 2200
}

# 6.2: Movimientos
GET /api/fondos/movimientos?limit=20
```

### **Test 7: Cierre Mensual (Admin)**
```bash
# 7.1: Generar cierre
POST /api/cierres
{
  "mes": 12,
  "anio": 2025
}

# Esperado: PDF + resumen financiero

# 7.2: Consultar cierres
GET /api/cierres?anio=2025

# 7.3: Descargar cierre
GET /api/cierres/12/2025/download
```

### **Test 8: Sistema de Leads (Nuevo Edificio)**
```bash
# 8.1: Registrar lead (sin pago inicial)
POST /api/leads
{
  "nombre": "Edificio Las Palmas",
  "email": "admin@laspalmas.com",
  "telefono": "+52 55 9999 8888",
  "numeroDeptos": 30
}

# Esperado: 200 + onboarding_token + email bienvenida

# 8.2: Activar onboarding
POST /api/onboarding/activate
{
  "token": "<onboarding_token>",
  "password": "NuevaPass123"
}

# Esperado: Nuevo building_id + admin creado
```

---

## 🔍 Tests de Seguridad

### **S1: JWT Validation**
```bash
# Sin token
curl https://your-worker.workers.dev/api/cuotas
# Esperado: 401 Unauthorized

# Token expirado
curl -H "Authorization: Bearer <expired_token>" \
  https://your-worker.workers.dev/api/cuotas
# Esperado: 401 Token expirado

# Token manipulado
curl -H "Authorization: Bearer fake.token.here" \
  https://your-worker.workers.dev/api/cuotas
# Esperado: 401 Invalid token
```

### **S2: RBAC Enforcement**
```bash
# Inquilino intenta acceder a otro depto
curl -H "Authorization: Bearer <inquilino_101_token>" \
  https://your-worker.workers.dev/api/cuotas?departamento=102
# Esperado: 403 o datos filtrados (solo 101)

# Inquilino intenta crear gasto
curl -X POST -H "Authorization: Bearer <inquilino_token>" \
  https://your-worker.workers.dev/api/gastos \
  -d '{"concepto":"test","monto":100}'
# Esperado: 403 Forbidden
```

### **S3: SQL Injection Protection**
```bash
# Intento de inyección
curl "https://your-worker.workers.dev/api/cuotas?departamento=101' OR '1'='1"
# Esperado: Sanitizado, sin exposición de datos

# XSS en inputs
POST /api/gastos
{
  "concepto": "<script>alert('xss')</script>",
  "monto": 100
}
# Esperado: Input sanitizado o escapado
```

### **S4: Rate Limiting**
```bash
# 100 requests en 10 segundos
for i in {1..100}; do
  curl https://your-worker.workers.dev/api/cuotas &
done

# Esperado: 429 Too Many Requests después de X requests
```

---

## 📱 UI Testing (Manual)

### **Flujo Completo Admin**
1. Login → Dashboard
2. Ver cuotas pendientes
3. Marcar cuota como PAGADO
4. Crear nuevo gasto
5. Ver balance en Fondos
6. Generar cierre mensual
7. Descargar PDF
8. Logout

### **Flujo Completo Inquilino**
1. Login → Vista limitada
2. Ver solo mis cuotas (mi depto)
3. Subir comprobante de pago
4. Ver anuncios (si legitimidad=true)
5. Logout

### **Flujo Onboarding Nuevo Edificio**
1. Llenar formulario de lead
2. Recibir email con token
3. Activar cuenta con token
4. Crear contraseña
5. Login como admin del nuevo edificio
6. Configurar edificio (deptos, usuarios)

---

## 🚀 Comandos de Testing

### **Local Dev**
```bash
# Backend local
npm run dev

# Wrangler dev (Workers)
wrangler dev

# Tests unitarios
npm run test:all

# Tests de integración
npm run test:integration

# Tests de seguridad
npm run test:security
```

### **Deploy & Test**
```bash
# Deploy a staging
wrangler deploy --env staging

# Test en staging
curl https://staging.your-worker.workers.dev/health

# Deploy a producción
wrangler deploy --env production

# Smoke test producción
npm run test:smoke-prod
```

---

## 📋 Checklist E2E

**Funcionalidad**
- [ ] Login admin exitoso
- [ ] Login inquilino exitoso
- [ ] RBAC admin vs inquilino
- [ ] Multitenancy aislado
- [ ] CRUD cuotas completo
- [ ] CRUD gastos completo
- [ ] Balance fondos correcto
- [ ] Cierre mensual genera PDF
- [ ] Sistema leads funcional
- [ ] Onboarding nuevo edificio

**Seguridad**
- [ ] JWT validation
- [ ] Token expiration
- [ ] RBAC enforcement
- [ ] SQL injection protegido
- [ ] XSS sanitizado
- [ ] Rate limiting activo
- [ ] CORS configurado
- [ ] HTTPS only

**Performance**
- [ ] Respuesta < 200ms (Workers)
- [ ] Cacheo efectivo (Pages)
- [ ] Bundle size < 1MB
- [ ] Lighthouse score > 90

**UX**
- [ ] Mobile responsive
- [ ] Formularios validados
- [ ] Mensajes error claros
- [ ] Loading states
- [ ] Confirmaciones críticas

---

## 🔗 URLs

**Producción (pendiente)**
- Workers: `https://smartbuilding.workers.dev`
- Pages: `https://smartbuilding.pages.dev`
- Custom: `https://app.smartbuilding.mx`

**Staging**
- Workers: `https://staging.smartbuilding.workers.dev`

**Local**
- Backend: `http://localhost:3000`
- Wrangler Dev: `http://localhost:8787`

---

## 📝 Notas

- Todos los usuarios demo comparten contraseña `Gemelo1`
- Base de datos actual: `data.json` (24KB)
- Migración a D1 pendiente para producción
- Logs en Cloudflare Dashboard (Real-time)

---

**Documentación generada:** 2025-12-16 22:40 UTC  
**Siguiente:** Ejecutar tests E2E completos + validar Workers deploy
