# ChispartBuilding - Sistema de Administración

Sistema completo de administración para edificios de departamentos con gestión de cuotas, presupuestos, gastos y control de acceso multiusuario.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 Inicio Rápido

```bash
# Clonar repositorio
git clone https://github.com/SebastianVernisMora/chispartbuilding.git
cd chispartbuilding

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor
npm start
```

Acceder a http://localhost:3001

## 📋 Características Principales

- 🔐 **Autenticación robusta** - JWT + bcrypt, sistema de roles
- 💰 **Gestión financiera** - Presupuestos, gastos, cuotas automáticas
- 👥 **Multitenancy** - Sistema de onboarding y temas customizables
- 📊 **Reportes** - Cierres anuales, estados de cuenta, auditoría
- 📧 **Notificaciones** - Sistema de emails integrado
- 🎨 **Temas personalizables** - Branding por edificio
- 📱 **Responsive** - Interfaz adaptable a móviles

## 🎯 Usuarios Demo

**Administrador:**
- Email: `admin@edificio.com`
- Password: `admin123`

**Propietario:**
- Email: `prop1@edificio.com`
- Password: `prop123`

## 📦 Despliegue

### Local / VPS
```bash
npm install
npm start
```

### Google Cloud Run
```bash
# Deploy completo
./scripts/deployment/deploy-cloudrun.sh YOUR_PROJECT_ID

# Configurar variables
./scripts/deployment/setup-env-cloudrun.sh YOUR_PROJECT_ID
```

Ver [guía completa de Cloud Run](docs/deployment/CLOUD_RUN_DEPLOYMENT.md)

### Docker
```bash
docker build -t chispartbuilding .
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  chispartbuilding
```

## 📚 Documentación

- **[Guía de Deployment Cloud Run](docs/deployment/CLOUD_RUN_DEPLOYMENT.md)** - Deploy en Google Cloud
- **[Guía de Despliegue General](docs/guides/GUIA_DESPLIEGUE.md)** - Deploy en VPS/servidores
- **[Setup Inicial](docs/guides/INSTRUCCIONES_SETUP.md)** - Configuración paso a paso
- **[Documentación Técnica](docs/technical/PROYECTO_COMPLETO.md)** - Arquitectura completa
- **[Sistema de Temas](docs/technical/THEME_SYSTEM.md)** - Customización
- **[Comandos PM2](docs/guides/PM2_COMANDOS.md)** - Gestión con PM2

## 🏗️ Estructura del Proyecto

```
edifnuev/
├── src/                    # Backend (Node.js + Express)
│   ├── controllers/       # Lógica de negocio
│   ├── models/           # Modelos de datos
│   ├── routes/           # Rutas API
│   ├── middleware/       # Auth, validation
│   └── utils/            # Utilidades
├── public/                # Frontend (HTML + CSS + JS)
│   ├── js/              # JavaScript modular
│   └── css/             # Estilos
├── tests/                # Suite de tests
├── scripts/              # Scripts de utilidad
├── config/               # Configuraciones
└── docs/                 # Documentación
```

## 🧪 Testing

```bash
npm test                  # Suite completa
npm run test:api          # Tests de API
npm run test:frontend     # Tests frontend
npm run test:playwright   # Tests E2E
```

## 🛠️ Stack Tecnológico

**Backend:**
- Node.js 20+
- Express 4.21+
- JWT + Bcrypt
- Nodemailer

**Frontend:**
- HTML5 + CSS3
- JavaScript ES6+ (Vanilla)
- Arquitectura modular

**DevOps:**
- Docker
- Google Cloud Run
- PM2 (process manager)
- Nginx (reverse proxy)

## 🔧 Variables de Entorno

```bash
# Aplicación
NODE_ENV=production
PORT=8080
APP_URL=https://your-domain.com

# Seguridad
JWT_SECRET=your-secret-key-here

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@chispartbuilding.com
```

Ver [.env.example](.env.example) para configuración completa.

## 📈 Estado del Proyecto

- ✅ Sistema de autenticación completo
- ✅ Gestión financiera (cuotas, gastos, presupuestos)
- ✅ Sistema de fondos
- ✅ Cierres anuales
- ✅ Permisos granulares
- ✅ Sistema de temas
- ✅ Onboarding multitenancy
- ✅ Suite de tests completa
- ✅ Documentación organizada
- ✅ Listo para producción

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- **Issues:** [GitHub Issues](https://github.com/SebastianVernisMora/chispartbuilding/issues)
- **Docs:** [Documentación completa](docs/)
- **Email:** [Contacto del proyecto]

## 📝 Changelog

### v2.0.0 (2025-12-28)
- 🧹 Limpieza completa del proyecto (-426MB)
- 📁 Reorganización de documentación
- 🐳 Docker + Cloud Run deployment
- 📚 Documentación mejorada
- ✅ Suite de tests actualizada

Ver [CHANGELOG.md](CHANGELOG.md) para historial completo.

---

**Desarrollado con ❤️ para la gestión eficiente de edificios**
