# Changelog

Todos los cambios notables del proyecto se documentan aquí.

## [2.0.0] - 2025-12-28

### 🧹 Limpieza y Organización
- **Eliminados 426MB** de submódulos y carpetas innecesarias
  - Eliminado `saas-migration/` (207MB)
  - Eliminado `crimson-recipe-f545/` (219MB)
  - Eliminado `src-optimized/` (88KB)
  - Eliminado `chispartbuilding/` vacía
- **Backups antiguos eliminados** - Solo se mantiene el más reciente
- **Archivos temporales limpiados** - `.backup`, `.pid`, logs antiguos

### 📁 Reorganización de Estructura
- **Documentación reorganizada** en categorías lógicas:
  - `/docs/guides/` - Guías de usuario y setup
  - `/docs/technical/` - Documentación técnica
  - `/docs/deployment/` - Configuración de deployment
  - `/docs/reports/` - Reportes de desarrollo
  - `/docs/migration/` - Docs de migración
  - `/docs/archive/` - Documentos históricos
  - `/docs/cloudflare/` - Configuraciones Cloudflare
- **Scripts consolidados** en `/scripts/`
- **Configuraciones** movidas a `/config/`
- **Tests organizados** con screenshots y reportes

### 🐳 Docker y Cloud Run
- ✅ Dockerfile multi-stage optimizado
- ✅ .dockerignore para builds eficientes
- ✅ Health check endpoint público
- ✅ Scripts de deployment automatizados
- ✅ Guía completa de deployment Cloud Run
- ✅ .gcloudignore configurado

### 📚 Documentación
- ✅ README.md principal actualizado
- ✅ Guía de Cloud Run deployment
- ✅ Scripts de configuración de env vars
- ✅ Checklist de deployment
- ✅ Troubleshooting guide

### 🔧 Mejoras Técnicas
- **Build script simplificado** para archivos estáticos
- **Rutas actualizadas** en configuraciones
- **package.json** optimizado para tests
- **Playwright config** con rutas relativas

### 📊 Métricas
- **Tamaño final:** 261MB (vs 687MB inicial)
- **Archivos:** 1,060 (sin node_modules)
- **Backend:** 55 archivos JS
- **Frontend:** 12 páginas HTML

## [1.5.0] - 2025-12-24

### ✨ Nuevas Características
- Sistema de temas customizable por edificio
- Onboarding multitenancy completo
- Sistema de invitaciones por email

### 🔒 Seguridad
- Mejoras en autenticación JWT
- Validación de inputs reforzada
- Rate limiting en endpoints críticos

### 🐛 Bug Fixes
- Corrección en cálculo de cuotas vencidas
- Fix en sistema de fondos
- Corrección en cierres anuales

## [1.0.0] - 2025-11-23

### 🎉 Lanzamiento Inicial
- Sistema de autenticación completo
- Gestión de presupuestos y gastos
- Sistema de cuotas automático
- Dashboard por roles
- Cierres anuales
- Sistema de permisos
- Suite de tests completa

---

Formato basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
