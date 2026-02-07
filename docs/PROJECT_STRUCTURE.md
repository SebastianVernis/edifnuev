# 📁 Estructura del Proyecto ChispartBuilding

## 🌳 Árbol de Directorios

```
edifnuev/
├── 📄 Archivos de Configuración Raíz
│   ├── package.json                 # Dependencias y scripts npm
│   ├── wrangler.toml               # Configuración Cloudflare Workers
│   ├── .env.example                # Template de variables de entorno
│   ├── Dockerfile                  # Contenedor Docker (legacy)
│   └── LICENSE                     # Licencia MIT
│
├── 📚 Documentación Raíz
│   ├── README.md                   # Documentación principal
│   ├── START_HERE.md               # Punto de entrada rápido
│   ├── CHANGELOG.md                # Historial de versiones
│   ├── INDICE_DOCUMENTACION.md      # Índice completo de docs
│   ├── EDIFICIO_DEMO_CREDENCIALES.md  # Usuarios demo
│   └── SETUP_SECRETS.md            # Configuración de secrets
│
├── 🔧 src/                         # Backend (Cloudflare Workers)
│   ├── controllers/                # Lógica de negocio
│   │   ├── authController.js       # Autenticación (registro, OTP, login)
│   │   ├── fondosController.js     # Gestión de fondos
│   │   ├── cuotasController.js     # Cálculo y distribución de cuotas
│   │   ├── gastosController.js     # Creación y aprobación de gastos
│   │   ├── inquilinosController.js # Gestión de inquilinos
│   │   ├── pagosController.js      # Registro de pagos
│   │   ├── documentosController.js # Gestión de documentos (R2)
│   │   └── cierresController.js    # Cierres mensuales/anuales
│   │
│   ├── routes/                     # Definición de rutas API
│   │   ├── authRoutes.js
│   │   ├── fondosRoutes.js
│   │   ├── cuotasRoutes.js
│   │   ├── gastosRoutes.js
│   │   ├── inquilinosRoutes.js
│   │   ├── pagosRoutes.js
│   │   ├── documentosRoutes.js
│   │   └── validationRoutes.js
│   │
│   ├── middleware/                 # Middlewares
│   │   ├── auth.js                 # Verificación JWT y roles
│   │   ├── cors.js                 # Configuración CORS
│   │   └── validation.js           # Validación de inputs
│   │
│   ├── models/                     # Modelos de datos (D1)
│   │   ├── User.js
│   │   ├── Fondo.js
│   │   ├── Cuota.js
│   │   ├── Gasto.js
│   │   └── Documento.js
│   │
│   ├── utils/                      # Utilidades
│   │   ├── jwt.js                  # Helpers JWT
│   │   ├── email.js                # Envío de emails (Resend)
│   │   ├── otp.js                  # Generación OTP
│   │   └── validators.js           # Validadores custom
│   │
│   └── app.js                      # Entry point Worker
│
├── 🎨 public/                      # Frontend (Cloudflare Pages)
│   ├── js/                         # JavaScript modular
│   │   ├── admin/                  # Scripts panel admin
│   │   │   ├── dashboard.js
│   │   │   ├── fondos.js
│   │   │   ├── cuotas.js
│   │   │   ├── gastos.js
│   │   │   ├── inquilinos.js
│   │   │   ├── documentos.js
│   │   │   └── temas.js
│   │   │
│   │   ├── inquilino/              # Scripts panel inquilino
│   │   │   ├── dashboard.js
│   │   │   ├── cuotas.js
│   │   │   ├── perfil.js
│   │   │   └── temas.js
│   │   │
│   │   ├── comite/                 # Scripts panel comité
│   │   │   ├── dashboard.js
│   │   │   └── aprobaciones.js
│   │   │
│   │   ├── auth/                   # Flujos de autenticación
│   │   │   ├── register.js
│   │   │   ├── verify-otp.js
│   │   │   ├── login.js
│   │   │   └── setup.js
│   │   │
│   │   └── shared/                 # Código compartido
│   │       ├── api.js              # Cliente API
│   │       ├── auth.js             # Helpers auth
│   │       ├── notifications.js    # Sistema de notificaciones
│   │       └── utils.js            # Utilidades generales
│   │
│   ├── css/                        # Estilos
│   │   ├── main.css                # Estilos base
│   │   ├── admin.css               # Estilos admin
│   │   ├── inquilino.css           # Estilos inquilino
│   │   ├── comite.css              # Estilos comité
│   │   └── themes.css              # Sistema de temas
│   │
│   ├── admin.html                  # Panel administrador
│   ├── inquilino.html              # Panel inquilino
│   ├── comite.html                 # Panel comité
│   ├── register.html               # Registro
│   ├── verify-otp.html             # Verificación OTP
│   ├── login.html                  # Login
│   └── index.html                  # Landing page
│
├── ⚡ workers-build/                # Build optimizado para Workers
│   └── index.js                    # Worker bundle listo para deploy
│
├── 🗄️ migrations/                   # Migraciones D1 (SQLite)
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_fondos.sql
│   ├── 0003_add_documentos.sql
│   └── ...
│
├── 🧪 tests/                        # Suite de tests
│   ├── sistema-completo.test.js    # Tests integración completa
│   ├── cuotas-sistema.test.js      # Tests sistema de cuotas
│   ├── frontend-api.test.js        # Tests API desde frontend
│   ├── permisos.test.js            # Tests de permisos por rol
│   ├── usuarios.test.js            # Tests CRUD usuarios
│   ├── integration.test.js         # Tests de integración
│   ├── performance.test.js         # Tests de performance
│   └── security.test.js            # Tests de seguridad
│
├── 📜 scripts/                      # Scripts de utilidad
│   ├── deployment/                 # Scripts de despliegue
│   │   ├── deploy-workers.sh       # Deploy a Cloudflare Workers
│   │   ├── deploy.sh               # Deploy completo
│   │   ├── rollback.sh             # Rollback de deployment
│   │   ├── health-check.sh         # Health check post-deploy
│   │   └── verify-deployment.sh    # Verificación de deploy
│   │
│   ├── database/                   # Scripts de base de datos
│   │   ├── backupData.js           # Backup de D1
│   │   ├── migrateUsers.js         # Migración de usuarios
│   │   ├── dataAnalyzer.js         # Análisis de datos
│   │   ├── dataMonitor.js          # Monitoreo de BD
│   │   └── cleanup-database.sh     # Limpieza de BD
│   │
│   ├── testing/                    # Scripts de testing
│   │   ├── test-all.js
│   │   ├── test-login.js
│   │   └── ...
│   │
│   ├── utilities/                  # Scripts utilitarios
│   │   ├── start-server.sh
│   │   ├── verify-deployment.sh
│   │   └── ...
│   │
│   └── maintenance/                # Scripts de mantenimiento
│
├── 📖 docs/                         # Documentación detallada
│   ├── screenshots/                # Capturas de pantalla
│   │   ├── admin/                  # Screenshots panel admin
│   │   ├── inquilino/              # Screenshots panel inquilino
│   │   ├── comite/                 # Screenshots panel comité
│   │   └── auth/                   # Screenshots flujo auth
│   │
│   ├── deployment/                 # Docs de despliegue
│   │   ├── DESPLIEGUE.md
│   │   ├── ESTADO_DESPLIEGUE.md
│   │   └── ...
│   │
│   ├── features/                   # Docs de features
│   │   ├── FONDOS_DINAMICOS_COMPLETO.md
│   │   ├── GASTOS_CON_DESCUENTO_AUTOMATICO.md
│   │   └── ...
│   │
│   ├── testing/                    # Docs de testing
│   │   ├── E2E_TEST_REPORT.md
│   │   ├── TESTING_README.md
│   │   └── ...
│   │
│   ├── guides/                     # Guías de uso
│   ├── technical/                  # Documentación técnica
│   ├── setup/                      # Docs de configuración
│   ├── migration/                  # Docs de migración
│   ├── cloudflare/                 # Docs específicos Cloudflare
│   └── archive/                    # Documentación archivada
│
├── 🔧 config/                       # Archivos de configuración
│   ├── playwright.config.js        # Config Playwright
│   └── ...
│
├── 🏗️ build-scripts/               # Scripts de build
│   └── build.js                    # Build del Worker
│
├── 📊 test-reports/                 # Reportes de tests
├── 📋 test-results/                 # Resultados de tests
└── 📝 logs/                         # Logs de aplicación
```

## 📂 Descripción de Carpetas Principales

### `/src` - Backend (Cloudflare Workers)
Contiene toda la lógica del servidor que corre en Cloudflare Workers:
- **Controllers**: Lógica de negocio separada por dominio
- **Routes**: Definición de endpoints API REST
- **Middleware**: Auth, CORS, validación
- **Models**: Interacción con D1 (SQLite)
- **Utils**: Funciones auxiliares

### `/public` - Frontend (Cloudflare Pages)
Todo el código que se sirve al navegador:
- **HTML**: Páginas de la aplicación
- **CSS**: Estilos organizados por sección
- **JS**: JavaScript modular separado por rol (admin/inquilino/comité)

### `/workers-build` - Build Optimizado
Bundle final que se despliega a Cloudflare Workers, generado por el build script.

### `/migrations` - Esquema de Base de Datos
Migraciones SQL para D1 (SQLite serverless de Cloudflare).

### `/tests` - Testing
Suite completa de tests: unitarios, integración, E2E, seguridad, performance.

### `/scripts` - Automatización
Scripts organizados por categoría:
- **deployment**: Deploy automatizado
- **database**: Backup, migración, análisis
- **testing**: Scripts de testing manual
- **utilities**: Herramientas varias
- **maintenance**: Mantenimiento del sistema

### `/docs` - Documentación
Documentación organizada por categorías:
- **screenshots**: Capturas de todos los flujos
- **deployment**: Guías de despliegue
- **features**: Documentación de características
- **testing**: Reportes y guías de testing
- **guides**: Guías de uso
- **technical**: Docs técnicos de arquitectura
- **archive**: Documentación histórica

## 🔑 Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `wrangler.toml` | Configuración de Cloudflare Workers (bindings, vars, secrets) |
| `package.json` | Dependencias y scripts npm |
| `src/app.js` | Entry point del Worker (router principal) |
| `public/index.html` | Landing page |
| `migrations/*.sql` | Esquema de base de datos D1 |
| `.env.example` | Template de variables de entorno |

## 🚀 Flujo de Trabajo

### Desarrollo
1. Editar código en `/src` (backend) o `/public` (frontend)
2. Testear localmente con `npm run dev`
3. Ejecutar tests con `npm test`

### Build
1. `npm run build` genera bundle optimizado en `/workers-build`
2. Bundle listo para desplegar a Cloudflare Workers

### Deploy
1. **Frontend**: `npx wrangler pages deploy public`
2. **Backend**: `npm run deploy:workers`
3. Workers y Pages se sincronizan automáticamente

### Testing
- Tests en `/tests` se ejecutan con `npm test`
- Scripts de testing manual en `/scripts/testing`
- Reportes generados en `/test-reports`

## 📊 Tamaño del Proyecto

- **Código fuente**: ~2MB
- **Documentación**: ~5MB
- **Dependencies**: ~150MB (node_modules)
- **Build optimizado**: ~90KB (worker bundle)

## 🔗 Integraciones

- **Cloudflare D1**: Base de datos SQLite serverless
- **Cloudflare R2**: Almacenamiento de documentos (S3-compatible)
- **Cloudflare KV**: Cache de sesiones y OTPs
- **Resend API**: Envío de emails
- **Chart.js**: Gráficos en dashboards

## 📝 Convenciones

### Naming
- **Archivos**: camelCase para JS, kebab-case para HTML/CSS
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Clases**: PascalCase

### Organización
- Código por funcionalidad (feature-based), no por tipo
- Separación clara entre admin/comité/inquilino
- Código compartido en `/shared`

### Commits
- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `test:` Tests
- `refactor:` Refactorización

---

**Última actualización**: 2026-01-18  
**Versión**: 2.1.0
