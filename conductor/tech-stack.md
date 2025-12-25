# Tech Stack - Sistema de Administración Edificio 205

## Introducción

Este documento detalla el stack tecnológico completo del Sistema de Administración Edificio 205, incluyendo lenguajes de programación, frameworks, librerías, herramientas de desarrollo, infraestructura y justificación de cada elección tecnológica.

---

## 1. Arquitectura General

### Tipo de Arquitectura
**Monolítico MVC (Model-View-Controller)**

**Justificación:**
- Simplicidad de desarrollo y despliegue para un equipo pequeño
- Menor complejidad operacional comparado con microservicios
- Adecuado para el tamaño actual del proyecto (20 usuarios)
- Facilita el mantenimiento y debugging
- Todos los componentes en un solo repositorio

**Estructura:**
```
Backend (Node.js + Express)
    ↓
Controllers → Models → Data Layer (JSON)
    ↓
Frontend (HTML + Vanilla JS)
```

---

## 2. Backend

### 2.1 Runtime y Lenguaje

#### Node.js
**Versión:** 18.x o superior (LTS recomendado)

**Características:**
- JavaScript en el servidor
- Event-driven, non-blocking I/O
- NPM ecosystem con millones de paquetes
- Excelente para aplicaciones I/O intensive

**Justificación:**
- Mismo lenguaje en frontend y backend (JavaScript)
- Gran ecosistema de librerías
- Rendimiento adecuado para la escala del proyecto
- Comunidad activa y abundante documentación
- Fácil de desplegar y mantener

**Configuración:**
- **Type:** ES Modules (`"type": "module"` en package.json)
- **Encoding:** UTF-8
- **Node Options:** `--max-old-space-size=512` (si es necesario)

### 2.2 Framework Web

#### Express.js
**Versión:** 4.21.2

**Características:**
- Framework minimalista y flexible
- Middleware-based architecture
- Routing robusto
- Gran ecosistema de plugins

**Justificación:**
- Framework más popular de Node.js
- Flexible y no opinionado
- Excelente documentación
- Fácil de aprender y usar
- Rendimiento probado en producción

**Estructura de Rutas:**
```javascript
/api/auth/*           // Autenticación (sin middleware)
/api/usuarios/*       // Gestión de usuarios (con auth)
/api/cuotas/*         // Sistema de cuotas (con auth)
/api/gastos/*         // Gestión de gastos (con auth)
/api/presupuestos/*   // Presupuestos (con auth)
/api/cierres/*        // Cierres anuales (con auth)
/api/anuncios/*       // Anuncios (con auth)
/api/fondos/*         // Fondos (con auth)
/api/permisos/*       // Permisos (con auth)
/api/solicitudes/*    // Solicitudes (con auth)
/api/parcialidades/*  // Parcialidades (con auth)
/api/audit/*          // Auditoría (con auth)
/api/validation/*     // Validaciones (con auth)
```

### 2.3 Autenticación y Seguridad

#### JSON Web Tokens (JWT)
**Librería:** jsonwebtoken 9.0.2

**Características:**
- Tokens stateless
- Payload customizable
- Expiración configurable
- Firmado con secret

**Configuración:**
```javascript
{
  expiresIn: '24h',
  algorithm: 'HS256',
  issuer: 'edificio-admin'
}
```

**Justificación:**
- No requiere almacenamiento de sesiones en servidor
- Escalable horizontalmente
- Estándar de la industria
- Fácil de implementar y validar

#### bcryptjs
**Versión:** 2.4.3

**Características:**
- Hashing de contraseñas
- Salt automático
- Resistente a rainbow tables
- Configurable (rounds)

**Configuración:**
```javascript
{
  saltRounds: 10  // Balance entre seguridad y performance
}
```

**Justificación:**
- Algoritmo probado y seguro
- Implementación pura en JavaScript (sin dependencias nativas)
- Ampliamente usado y auditado
- Protección contra ataques de fuerza bruta

#### CORS
**Versión:** 2.8.5

**Configuración:**
```javascript
{
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token'],
  credentials: true
}
```

**Justificación:**
- Seguridad en comunicación cross-origin
- Control granular de acceso
- Prevención de ataques CSRF

### 2.4 Validación

#### express-validator
**Versión:** 7.3.0

**Características:**
- Validación y sanitización de inputs
- Basado en validator.js
- Middleware para Express
- Mensajes de error customizables

**Uso:**
```javascript
body('email').isEmail().normalizeEmail(),
body('password').isLength({ min: 6 }),
body('monto').isFloat({ min: 0 })
```

**Justificación:**
- Prevención de inyecciones y XSS
- Validación consistente en toda la aplicación
- Fácil integración con Express
- Amplia variedad de validadores built-in

### 2.5 Manejo de Archivos

#### Multer
**Versión:** 2.0.2

**Características:**
- Middleware para multipart/form-data
- Manejo de uploads de archivos
- Validación de tipos y tamaños
- Storage configurable

**Configuración:**
```javascript
{
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
}
```

**Justificación:**
- Manejo seguro de uploads
- Validación de archivos
- Integración nativa con Express
- Control de almacenamiento

### 2.6 Utilidades

#### dotenv
**Versión:** 16.6.1

**Uso:**
- Gestión de variables de entorno
- Configuración por ambiente (dev/prod)
- Separación de secretos del código

**Variables Principales:**
```bash
PORT=3001
JWT_SECRET=your_secret_key
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
```

---

## 3. Frontend

### 3.1 Lenguajes y Tecnologías Base

#### HTML5
**Características:**
- Semantic markup
- Accesibilidad (ARIA)
- SEO-friendly
- Validación nativa de formularios

**Estructura de Páginas:**
- `index.html` - Login
- `admin.html` - Dashboard administrador
- `inquilino.html` - Dashboard inquilino
- `admin-optimized.html` - Versión optimizada

#### CSS3
**Características:**
- Flexbox y Grid para layouts
- Custom properties (variables CSS)
- Media queries para responsive
- Animations y transitions

**Organización:**
```
css/
├── base/           # Reset, variables, tipografía
├── components/     # Botones, forms, cards
└── modules/        # Estilos por módulo
```

#### JavaScript (ES6+)
**Características:**
- Vanilla JavaScript (sin frameworks)
- ES Modules
- Async/Await
- Fetch API para comunicación con backend

**Organización:**
```
js/
├── auth/           # Autenticación
├── components/     # Componentes reutilizables
├── modules/        # Módulos por funcionalidad
│   ├── usuarios/
│   ├── cuotas/
│   ├── gastos/
│   └── admin/
└── utils/          # Helpers y constantes
```

**Justificación:**
- Sin dependencias de frameworks pesados
- Carga rápida y rendimiento óptimo
- Control total sobre el código
- Fácil de mantener y debuggear
- Adecuado para la complejidad del proyecto

### 3.2 Comunicación con Backend

#### Fetch API
**Características:**
- API nativa del navegador
- Promise-based
- Soporte para todos los métodos HTTP
- Manejo de headers y body

**Wrapper Centralizado:**
```javascript
// utils/api.js
const API_BASE = 'http://localhost:3001/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'x-auth-token': token }),
    ...options.headers
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  
  return response.json();
}
```

**Justificación:**
- No requiere librerías adicionales
- Soporte nativo en todos los navegadores modernos
- Suficiente para las necesidades del proyecto

---

## 4. Base de Datos

### 4.1 Almacenamiento

#### JSON File-Based
**Archivo:** `data.json`
**Tamaño Actual:** ~42KB
**Registros:** 20 usuarios + datos relacionados

**Estructura:**
```json
{
  "usuarios": [...],
  "presupuestos": [...],
  "gastos": [...],
  "cuotas": [...],
  "anuncios": [...],
  "fondos": [...],
  "cierres": [...],
  "solicitudes": [...],
  "parcialidades": [...]
}
```

**Justificación:**
- Simplicidad extrema (no requiere servidor de BD)
- Adecuado para el volumen de datos actual
- Fácil de respaldar (un solo archivo)
- Sin costos adicionales de infraestructura
- Portabilidad total

**Limitaciones Conocidas:**
- No escalable para > 100 usuarios
- Operaciones de escritura bloquean el archivo
- Sin transacciones ACID
- Búsquedas menos eficientes que SQL

**Plan de Migración Futura:**
- Cuando usuarios > 50: Migrar a PostgreSQL o MongoDB
- Mantener misma estructura de modelos
- Implementar capa de abstracción de datos

### 4.2 Acceso a Datos

#### Módulo Personalizado (data.js)
**Características:**
- Lectura/escritura síncrona de JSON
- Funciones helper para operaciones comunes
- Manejo de errores
- Backups automáticos

**Funciones Principales:**
```javascript
leerDatos()           // Lee data.json
guardarDatos(data)    // Escribe data.json
crearBackup()         // Crea backup antes de escribir
```

---

## 5. Testing

### 5.1 Framework de Testing

#### Jest
**Versión:** 30.2.0

**Características:**
- Test runner completo
- Assertions built-in
- Mocking capabilities
- Coverage reports

**Configuración:**
```javascript
{
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

#### Supertest
**Versión:** 7.1.4

**Características:**
- Testing de APIs HTTP
- Integración con Jest
- Assertions para responses
- Manejo de cookies y headers

**Uso:**
```javascript
const response = await request(app)
  .post('/api/auth/login')
  .send({ email, password })
  .expect(200);
```

**Justificación:**
- Estándar de facto para testing en Node.js
- Excelente documentación
- Integración perfecta con Express
- Cobertura de código automática

### 5.2 Suites de Testing

**Tests Implementados:**
- `sistema-completo.test.js` - Tests end-to-end
- `cuotas-sistema.test.js` - Sistema de cuotas
- `frontend-api.test.js` - Integración frontend
- `cierre-anual.test.js` - Proceso de cierre
- `api-validation.test.js` - Validación de API
- `permisos.test.js` - Sistema de permisos
- `usuarios.test.js` - CRUD usuarios
- `integration.test.js` - Tests de integración
- `performance.test.js` - Tests de rendimiento
- `security.test.js` - Tests de seguridad

**Cobertura Objetivo:** > 80%

---

## 6. Build y Optimización

### 6.1 Bundling

#### esbuild
**Versión:** 0.27.0

**Características:**
- Bundler extremadamente rápido
- Minificación built-in
- Tree shaking
- Source maps

**Configuración:**
```javascript
{
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outdir: 'dist'
}
```

**Justificación:**
- 10-100x más rápido que Webpack
- Configuración simple
- Suficiente para las necesidades del proyecto

### 6.2 Minificación

#### Terser
**Versión:** 5.44.1

**Uso:**
- Minificación adicional de JavaScript
- Optimización de código
- Remoción de código muerto

#### PostCSS + cssnano
**Versiones:** postcss 8.5.6, cssnano 7.1.2

**Uso:**
- Minificación de CSS
- Autoprefixer para compatibilidad
- Optimización de assets

---

## 7. Infraestructura y Deployment

### 7.1 Servidor de Aplicación

#### PM2
**Características:**
- Process manager para Node.js
- Auto-restart en caso de crash
- Load balancing
- Logs centralizados
- Monitoring

**Configuración:**
```javascript
// ecosystem.config.js
{
  apps: [{
    name: 'edificio-admin',
    script: 'src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

**Comandos:**
```bash
pm2 start ecosystem.config.js
pm2 restart edificio-admin
pm2 logs edificio-admin
pm2 monit
```

**Justificación:**
- Gestión profesional de procesos Node.js
- Reinicio automático ante fallos
- Monitoreo en tiempo real
- Estándar de la industria

### 7.2 Reverse Proxy

#### Nginx
**Características:**
- Reverse proxy de alto rendimiento
- Servidor de archivos estáticos
- Load balancing
- SSL/TLS termination

**Configuración:**
```nginx
server {
    listen 80;
    server_name ec2-18-223-32-141.us-east-2.compute.amazonaws.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /uploads {
        alias /home/admin/uploads;
    }
}
```

**Justificación:**
- Rendimiento superior para archivos estáticos
- Capa adicional de seguridad
- Facilita implementación de HTTPS
- Estándar en producción

### 7.3 Hosting

#### AWS EC2
**Instancia:** t2.micro (o similar)
**Sistema Operativo:** Ubuntu 20.04 LTS
**IP Pública:** ec2-18-223-32-141.us-east-2.compute.amazonaws.com

**Características:**
- Servidor virtual dedicado
- Control total del ambiente
- Escalabilidad vertical
- Backups y snapshots

**Justificación:**
- Control completo del servidor
- Costo predecible
- Fácil de configurar y mantener
- Adecuado para la escala actual

---

## 8. Herramientas de Desarrollo

### 8.1 Linting

#### ESLint
**Versión:** 9.38.0

**Configuración:**
```javascript
{
  env: {
    node: true,
    es2021: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }
}
```

**Justificación:**
- Mantiene consistencia de código
- Previene errores comunes
- Mejora legibilidad

### 8.2 Control de Versiones

#### Git
**Plataforma:** GitHub
**Repositorio:** github.com/SebastianVernisMora/edificio-admin

**Estrategia de Branching:**
- `master` - Producción
- `develop` - Desarrollo
- `feature/*` - Nuevas funcionalidades
- `hotfix/*` - Correcciones urgentes

### 8.3 CI/CD

#### GitHub Actions
**Workflows:**
- Tests automáticos en cada push
- Deployment automático a producción
- Validación de código

---

## 9. Dependencias Completas

### 9.1 Dependencias de Producción

```json
{
  "bcrypt": "^6.0.0",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.6.1",
  "express": "^4.21.2",
  "express-validator": "^7.3.0",
  "jsonwebtoken": "^9.0.2",
  "multer": "^2.0.2",
  "node-fetch": "^3.3.2"
}
```

### 9.2 Dependencias de Desarrollo

```json
{
  "autoprefixer": "^10.4.22",
  "cssnano": "^7.1.2",
  "esbuild": "^0.27.0",
  "eslint": "^9.38.0",
  "jest": "^30.2.0",
  "postcss": "^8.5.6",
  "supertest": "^7.1.4",
  "terser": "^5.44.1"
}
```

---

## 10. Seguridad

### 10.1 Prácticas Implementadas

- ✅ Hashing de contraseñas con bcrypt
- ✅ JWT para autenticación stateless
- ✅ Validación de inputs con express-validator
- ✅ CORS configurado apropiadamente
- ✅ Headers de seguridad (X-Content-Type-Options, etc.)
- ✅ Rate limiting (pendiente implementar)
- ✅ HTTPS (pendiente implementar)

### 10.2 Vulnerabilidades Conocidas

- ⚠️ Sin HTTPS (tráfico no encriptado)
- ⚠️ Sin rate limiting (vulnerable a DDoS)
- ⚠️ JWT secret en variable de entorno (considerar rotación)

### 10.3 Roadmap de Seguridad

1. Implementar HTTPS con Let's Encrypt
2. Agregar rate limiting con express-rate-limit
3. Implementar rotación de JWT secrets
4. Agregar helmet.js para headers de seguridad
5. Implementar CSP (Content Security Policy)

---

## 11. Performance

### 11.1 Métricas Actuales

- **Tiempo de respuesta API:** < 200ms promedio
- **First Contentful Paint:** ~1.2s
- **Time to Interactive:** ~2.8s
- **Tamaño bundle JS:** ~150KB (minificado)
- **Tamaño bundle CSS:** ~30KB (minificado)

### 11.2 Optimizaciones Implementadas

- ✅ Minificación de JS y CSS
- ✅ Compresión de assets
- ✅ Lazy loading de módulos
- ✅ Caching de archivos estáticos en Nginx
- ✅ Optimización de consultas a data.json

---

## 12. Escalabilidad

### 12.1 Límites Actuales

- **Usuarios concurrentes:** ~50 (estimado)
- **Usuarios totales:** ~100 (antes de migrar BD)
- **Requests por segundo:** ~100 (estimado)
- **Tamaño de data.json:** < 1MB recomendado

### 12.2 Plan de Escalabilidad

**Fase 1 (50-100 usuarios):**
- Migrar a PostgreSQL o MongoDB
- Implementar caching con Redis
- Optimizar queries

**Fase 2 (100-500 usuarios):**
- Escalar horizontalmente con load balancer
- Implementar CDN para assets estáticos
- Separar API y frontend

**Fase 3 (500+ usuarios):**
- Arquitectura de microservicios
- Kubernetes para orquestación
- Base de datos distribuida

---

## 13. Monitoreo y Logging

### 13.1 Herramientas Actuales

- **PM2:** Logs de aplicación y monitoreo básico
- **Nginx:** Access logs y error logs
- **Console logs:** Debugging en desarrollo

### 13.2 Mejoras Futuras

- [ ] Winston para logging estructurado
- [ ] ELK Stack (Elasticsearch, Logstash, Kibana)
- [ ] Sentry para error tracking
- [ ] New Relic o Datadog para APM

---

## 14. Backup y Recuperación

### 14.1 Estrategia Actual

- **Backups manuales:** data.json copiado periódicamente
- **Ubicación:** Carpeta `backups/`
- **Frecuencia:** Manual (según necesidad)
- **Retención:** Indefinida

### 14.2 Estrategia Recomendada

- **Backups automáticos:** Diarios a las 2 AM
- **Ubicación:** S3 o almacenamiento externo
- **Frecuencia:** Diario + semanal + mensual
- **Retención:** 7 días + 4 semanas + 12 meses
- **Testing:** Restauración mensual de prueba

---

## 15. Documentación Técnica

### 15.1 Documentos Disponibles

- ✅ README.md - Guía general del proyecto
- ✅ BLACKBOX.md - Estándares técnicos obligatorios
- ✅ CRUSH.md - Guía rápida para agentes
- ✅ docs/ESTADO_PROYECTO.md - Estado actual
- ✅ docs/GUIA_DESPLIEGUE.md - Procedimientos de deploy
- ✅ docs/technical/* - Documentación técnica detallada

### 15.2 Documentación de Código

- JSDoc en funciones públicas
- Comentarios inline para lógica compleja
- README en cada módulo principal

---

## Conclusión

El stack tecnológico del Sistema de Administración Edificio 205 está diseñado para ser simple, mantenible y adecuado para la escala actual del proyecto. Las tecnologías elegidas son maduras, bien documentadas y ampliamente adoptadas en la industria.

El enfoque en simplicidad (JSON file-based, Vanilla JS) permite un desarrollo rápido y un mantenimiento sencillo, mientras que la arquitectura modular facilita futuras migraciones a tecnologías más robustas cuando el proyecto crezca.

**Versión:** 1.0  
**Última Actualización:** Diciembre 2025  
**Próxima Revisión:** Junio 2026
