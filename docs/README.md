# 🏢 ChispartBuilding - Sistema de Administración de Edificios

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production-success.svg)](https://chispartbuilding.pages.dev)

Sistema completo de administración para edificios de departamentos con gestión de cuotas, presupuestos, gastos, documentos y control de acceso multiusuario.

## 🌐 Demo en Vivo

- **🌍 Frontend**: [https://edificio-production.pages.dev](edificio-production.pages.dev)
- **⚡ Backend API**: [https://edificio-production.sebastianvernis.workers.dev](https://edificio-production.sebastianvernis.workers.dev)

## 📸 Capturas de Pantalla

> **Nota**: Screenshots completos de todos los flujos disponibles en [`test/screenshots/`](test/screenshots/)  
> Ver [Issue #18](https://github.com/SebastianVernis/edifnuev/issues/18) para documentación visual completa

### Panel de Administrador
![Dashboard Admin](test/screenshots/admin/dashboard-preview.png)

### Panel de Inquilino
![Dashboard Inquilino](test/screenshots/inquilino/dashboard-preview.png)

### Sistema de Temas
![Temas](test/screenshots/admin/temas-preview.png)

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/SebastianVernis/edifnuev.git
cd edifnuev

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

### Despliegue en Cloudflare

```bash
# Desplegar Worker
npm run deploy:workers

# Desplegar Pages
npx wrangler pages deploy public --project-name=chispartbuilding
```

## 👥 Usuarios Demo

Prueba la aplicación con estos usuarios de demostración:

### **👨‍💼 Administrador**
```
Email: admin@edificio205.com
Password: Admin2025!
```
**Acceso completo**: Gestión de fondos, cuotas, gastos, inquilinos, documentos, reportes y configuración.

### **🤝 Comité**
```
Email: comite@edificio205.com
Password: Comite2025!
```
**Acceso intermedio**: Revisión y aprobación de gastos, visualización de fondos y reportes.

### **🏠 Inquilinos**

| Nombre | Email | Password | Depto | Estado |
|--------|-------|----------|-------|--------|
| María García | maria.garcia@edificio205.com | Inquilino2025! | 101 | ✅ Validado |
| Carlos López | carlos.lopez@edificio205.com | Inquilino2025! | 102 | ⏳ Pendiente |
| Ana Martínez | ana.martinez@edificio205.com | Inquilino2025! | 201 | ✅ Validado |
| Roberto Silva | roberto.silva@edificio205.com | Inquilino2025! | 202 | ⏳ Pendiente |

Ver credenciales completas en [EDIFICIO_DEMO_CREDENCIALES.md](EDIFICIO_DEMO_CREDENCIALES.md)

## ✨ Características Principales

### 🔐 Autenticación y Seguridad
- Sistema de registro con verificación OTP
- Autenticación JWT con tokens seguros
- Control de acceso basado en roles (ADMIN, COMITE, INQUILINO)
- Cifrado de contraseñas con bcrypt
- Protección CORS configurada

### 💰 Gestión Financiera
- **Fondos dinámicos**: Crear y gestionar múltiples fondos (Común, Reserva, etc.)
- **Cuotas automáticas**: Cálculo y distribución por departamento
- **Gastos**: Crear, aprobar/rechazar con workflow de aprobación
- **Pagos**: Registro y seguimiento de pagos de inquilinos
- **Cierres**: Cierre mensual y anual con reportes detallados
- **Descuentos automáticos**: Aplicación de descuentos por fondo

### 👥 Gestión de Inquilinos
- Alta de inquilinos con validación de administrador
- Asignación de departamentos (1-20)
- Estados: Pendiente/Validado/Rechazado
- Perfil editable por cada inquilino
- Historial de pagos y cuotas

### 📄 Gestión de Documentos
- Subida de documentos (PDF, imágenes, Excel, Word)
- Categorización (Actas, Facturas, Contratos, Reglamentos, etc.)
- Control de acceso por rol
- Descarga y visualización
- Almacenamiento en Cloudflare R2

### 📊 Reportes y Estadísticas
- Dashboard con métricas en tiempo real
- Gráficos de gastos por categoría
- Estados de cuenta detallados
- Historial de transacciones
- Reportes de cierres anuales

### 🎨 Personalización
- **14 temas prediseñados** para administradores
- **Temas personalizables** para inquilinos
- Sistema de degradados modernos
- Responsive design adaptable

### 📧 Notificaciones
- Envío de OTP por email
- Notificaciones de aprobación/rechazo
- Recordatorios de pagos
- Integración con Resend API

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

**Backend:**
- **Runtime**: Cloudflare Workers (Edge Computing)
- **Framework**: itty-router
- **Base de datos**: Cloudflare D1 (SQLite)
- **Almacenamiento**: Cloudflare R2 (S3-compatible)
- **KV Store**: Cloudflare KV (Cache)
- **Autenticación**: JWT + bcrypt

**Frontend:**
- **Vanilla JavaScript** (ES6+)
- **HTML5 + CSS3** con diseño modular
- **Chart.js** para gráficos
- **Responsive Design** mobile-first

**DevOps:**
- **Cloudflare Pages** (Frontend)
- **Cloudflare Workers** (Backend)
- **Wrangler CLI** (Deployment)
- **GitHub Actions** (CI/CD - opcional)

### Estructura del Proyecto

```
edifnuev/
├── src/                        # Backend (Cloudflare Workers)
│   ├── controllers/            # Lógica de negocio
│   │   ├── authController.js
│   │   ├── fondosController.js
│   │   ├── cuotasController.js
│   │   ├── gastosController.js
│   │   └── documentosController.js
│   ├── routes/                 # Rutas API
│   ├── middleware/             # Auth, CORS, validation
│   ├── models/                 # Modelos de datos
│   └── utils/                  # Utilidades
├── public/                     # Frontend (Cloudflare Pages)
│   ├── js/
│   │   ├── admin/              # Scripts admin
│   │   ├── inquilino/          # Scripts inquilino
│   │   ├── comite/             # Scripts comité
│   │   └── auth/               # Auth flows
│   ├── css/                    # Estilos
│   ├── admin.html              # Panel admin
│   ├── inquilino.html          # Panel inquilino
│   ├── register.html           # Registro
│   └── login.html              # Login
├── workers-build/              # Build optimizado para Workers
├── migrations/                 # Migraciones D1
├── scripts/                    # Scripts de utilidad organizados
│   ├── admin/                  # Scripts de administración
│   ├── archive-legacy/         # Scripts de archivos legados
│   ├── testing/                # Scripts de pruebas
│   └── utils/                  # Scripts de utilidades
├── build-scripts/              # Scripts de construcción
├── tests/                      # Suite de tests
├── docs/                       # Documentación
│   ├── screenshots/            # Capturas de pantalla
│   ├── guides/                 # Guías de uso
│   └── technical/              # Documentación técnica
├── archive/                    # Archivos legados y desusados
│   ├── legacy-distros/         # Distribuciones antiguas
│   └── legacy-files/           # Archivos antiguos
├── wrangler.toml               # Configuración Cloudflare
└── package.json
```

## 📚 Documentación

### 🎯 Inicio
- **[START_HERE.md](START_HERE.md)** - Punto de entrada rápido
- **[INDICE_DOCUMENTACION.md](INDICE_DOCUMENTACION.md)** - Índice completo de documentación

### 🚀 Despliegue
- **[DESPLIEGUE.md](DESPLIEGUE.md)** - Guía de despliegue en Cloudflare
- **[ESTADO_DESPLIEGUE.md](ESTADO_DESPLIEGUE.md)** - Estado actual del despliegue

### 👨‍💻 Desarrollo
- **[SETUP_SECRETS.md](SETUP_SECRETS.md)** - Configuración de secrets
- **[TESTING_README.md](TESTING_README.md)** - Guía de testing

### 📖 Features
- **[FONDOS_DINAMICOS_COMPLETO.md](FONDOS_DINAMICOS_COMPLETO.md)** - Sistema de fondos
- **[GASTOS_CON_DESCUENTO_AUTOMATICO.md](GASTOS_CON_DESCUENTO_AUTOMATICO.md)** - Gestión de gastos
- **[EDIFICIO_DEMO_CREDENCIALES.md](EDIFICIO_DEMO_CREDENCIALES.md)** - Usuarios demo

### 🐛 Testing
- **[E2E_TEST_REPORT.md](E2E_TEST_REPORT.md)** - Reporte de tests E2E
- **[TESTING_INDEX.md](TESTING_INDEX.md)** - Índice de tests

## 🧪 Testing

```bash
# Suite completa
npm test

# Tests específicos
npm run test:sistema          # Tests del sistema completo
npm run test:frontend         # Tests de frontend/API
npm run test:cuotas          # Tests de cuotas
npm run test:permisos        # Tests de permisos

# Tests E2E con Playwright
npm run test:playwright
```

## 🛠️ Scripts Disponibles

Los scripts del proyecto están organizados en directorios temáticos:

### Scripts de Pruebas (`scripts/testing/`)
- `test-password.js` - Verificación de funcionalidad de contraseña
- `comprehensive-flow-test.js` - Testeo integral del flujo de la aplicación
- `generate-visual-test-documentation.js` - Generación de documentación visual de tests
- `test-clerk-integration.sh` - Testeo de integración con Clerk

### Scripts de Administración (`scripts/admin/`)
- `reset-admin-password.js` - Herramienta para reiniciar contraseñas de administrador

### Scripts de Utilidades (`scripts/utils/`)
- `d1-shell.sh` - Interfaz de comandos para interactuar con Cloudflare D1

### Ejecución mediante npm

Además de ejecutar los scripts directamente, puedes usar los siguientes comandos npm:

```bash
# Tests
npm run test:password         # Ejecuta test de contraseña
npm run test:clerk            # Ejecuta test de integración con Clerk
npm run test:comprehensive    # Ejecuta test integral

# Administración
npm run admin:reset-password  # Reinicia contraseña de administrador

# Utilidades
npm run utils:d1-shell        # Abre shell de D1
```

## 🔧 Configuración

### Variables de Entorno (Worker)

```toml
# wrangler.toml
[vars]
NODE_ENV = "production"
APP_URL = "https://edificio-admin.sebastianvernis.workers.dev"
FRONTEND_URL = "https://chispartbuilding.pages.dev"
OTP_DEV_MODE = "false"
```

### Secrets (Cloudflare)

```bash
# Configurar secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM_EMAIL
```

Ver [SETUP_SECRETS.md](SETUP_SECRETS.md) para detalles completos.

## 📋 Flujos Principales

### 1. Registro de Nuevo Edificio
1. Registro en `/register` con email
2. Verificación OTP en `/verify-otp`
3. Setup inicial: configurar fondos, edificio, cuotas
4. Acceso al panel de administrador

### 2. Gestión de Cuotas (Admin)
1. Calcular cuotas mensuales desde fondos
2. Distribuir entre departamentos (por unidad o porcentaje)
3. Inquilinos ven sus cuotas en su panel
4. Registrar pagos cuando se reciben

### 3. Aprobación de Gastos (Comité)
1. Admin crea gasto y lo envía a aprobación
2. Comité recibe notificación
3. Comité aprueba/rechaza con comentarios
4. Si aprobado, se descuenta automáticamente del fondo

### 4. Consulta de Inquilino
1. Login en `/login`
2. Dashboard con métricas personales
3. Ver cuotas pendientes/pagadas
4. Descargar documentos del edificio
5. Editar perfil y cambiar tema

## 🎨 Sistema de Temas

### Temas para Administrador (14 opciones)
- Ocean Breeze (azul océano)
- Sunset Glow (naranja atardecer)
- Forest Green (verde bosque)
- Royal Purple (púrpura real)
- Cherry Blossom (rosa cerezo)
- Midnight Blue (azul medianoche)
- Golden Hour (dorado)
- Emerald Dream (esmeralda)
- Crimson Fire (carmesí)
- Arctic Ice (azul ártico)
- Lavender Fields (lavanda)
- Amber Sunset (ámbar)
- Teal Ocean (verde azulado)
- Rose Garden (rosa jardín)

### Personalización Inquilino
- Selector de temas con preview en tiempo real
- Persistencia por usuario
- Diseño responsive adaptable

## 📈 Estado del Proyecto

### ✅ Completado
- ✅ Sistema de autenticación completo (registro, OTP, login)
- ✅ Gestión de fondos dinámicos
- ✅ Sistema de cuotas automáticas
- ✅ Gestión de gastos con aprobación
- ✅ Panel de administrador completo
- ✅ Panel de inquilino completo
- ✅ Panel de comité completo
- ✅ Sistema de documentos (subida, descarga, categorización)
- ✅ 14 temas personalizables
- ✅ Cierres mensuales y anuales
- ✅ Reportes y estadísticas
- ✅ Sistema de permisos granular
- ✅ Despliegue en Cloudflare Workers + Pages
- ✅ Suite de tests completa
- ✅ Documentación organizada

### 🚧 En Desarrollo
- 🚧 Screenshots de todos los flujos ([Issue #18](https://github.com/SebastianVernis/edifnuev/issues/18))
- 🚧 Integración con pasarelas de pago
- 🚧 App móvil (PWA)
- 🚧 Notificaciones push

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'feat: add amazing feature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Guía de Commits
- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `test:` Añadir o modificar tests
- `refactor:` Refactorización de código
- `style:` Cambios de formato (no afectan funcionalidad)

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- **Issues**: [GitHub Issues](https://github.com/SebastianVernis/edifnuev/issues)
- **Documentación**: [docs/](docs/)
- **Email**: Contacto del proyecto

## 📝 Changelog

### v2.1.0 (2026-01-18)
- ✨ Sistema de gestión de documentos completo
- 🎨 14 temas para administrador con degradados
- 🎨 Sistema de temas avanzado para inquilinos
- 👤 Sección "Mi Perfil" para inquilinos
- 📊 Dashboard inquilino mejorado con métricas
- 🐛 Correcciones en tabla de cuotas inquilino

### v2.0.0 (2025-12-28)
- 🚀 Migración a Cloudflare Workers + Pages
- 🧹 Limpieza completa del proyecto (-426MB)
- 📁 Reorganización de documentación
- 📚 Documentación mejorada
- ✅ Suite de tests actualizada

Ver [CHANGELOG.md](CHANGELOG.md) para historial completo.

---

<div align="center">

**Desarrollado con ❤️ para la gestión eficiente de edificios**

[🌐 Demo](https://chispartbuilding.pages.dev) • [📚 Docs](docs/) • [🐛 Issues](https://github.com/SebastianVernis/edifnuev/issues) • [📝 Changelog](CHANGELOG.md)

</div>
