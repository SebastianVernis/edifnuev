# Edificio Admin - Versión SaaS Adaptada para Cloudflare Workers

Este directorio contiene la adaptación del sistema Edificio Admin a una arquitectura SaaS multi-tenant desplegable en Cloudflare Workers.

## 📋 Contenido

### Estructura del Proyecto

```
edificio-admin-saas-adapted/
├── src/
│   ├── index.js              # Entry point - Router principal
│   ├── handlers/             # Route handlers (adaptados de controllers)
│   │   ├── auth.js          # ✅ Autenticación (COMPLETADO)
│   │   ├── subscription.js  # ✅ Subscripciones SAAS (NUEVO)
│   │   ├── buildings.js     # ✅ Multi-edificio (NUEVO)
│   │   ├── usuarios.js      # 🔨 En desarrollo
│   │   ├── cuotas.js        # 🔨 En desarrollo
│   │   ├── gastos.js        # 🔨 En desarrollo
│   │   └── ...              # Resto de handlers
│   ├── middleware/          # Middlewares Cloudflare
│   │   ├── auth.js         # JWT verification
│   │   ├── cors.js         # CORS handling
│   │   └── database.js     # D1 database wrapper
│   └── models/             # Modelos de datos
│       ├── Building.js     # Modelo de edificio
│       └── User.js         # Modelo de usuario
├── migrations/             # SQL migrations para D1
│   ├── 0001_initial_schema.sql
│   ├── 0002_rename_columns.sql
│   └── 0003_building_users.sql
├── scripts/               # Scripts de deployment
│   ├── deploy.sh         # Script completo de despliegue
│   ├── migrate.js        # Aplicar migraciones
│   └── setup-dev.sh      # Configurar entorno local
├── public/               # Frontend (copiado del proyecto actual)
├── wrangler.toml         # Configuración Cloudflare
├── package.json          # Dependencias
└── README.md            # Este archivo
```

## 🎯 Características

### Funcionalidades Existentes (Preservadas)
- ✅ Sistema de autenticación (login/registro)
- ✅ Gestión de usuarios
- ✅ Gestión de cuotas
- ✅ Registro de gastos
- ✅ Gestión de fondos
- ✅ Sistema de presupuestos
- ✅ Cierres contables
- ✅ Anuncios y comunicados
- ✅ Permisos por rol
- ✅ Auditoría de acciones
- ✅ Solicitudes de residentes
- ✅ Pagos parciales

### Nuevas Funcionalidades SAAS
- ✅ **Multi-tenancy**: Múltiples edificios/condominios independientes
- ✅ **Subscripciones**: Planes básico, profesional y empresarial
- ✅ **Onboarding**: Proceso guiado de registro y configuración
- ✅ **Pagos**: Integración preparada para procesadores de pago
- ✅ **Gestión de edificios**: CRUD completo
- ✅ **Roles por edificio**: Usuarios pueden tener diferentes roles en diferentes edificios

## 🚀 Deployment

### Requisitos Previos

1. **Cuenta de Cloudflare** con Workers habilitado
2. **Wrangler CLI** instalado:
   ```bash
   npm install -g wrangler
   ```
3. **Node.js** v18 o superior

### Configuración Inicial

1. **Login en Cloudflare**
   ```bash
   wrangler login
   ```

2. **Instalar dependencias**
   ```bash
   cd edificio-admin-saas-adapted
   npm install
   ```

3. **Crear recursos de Cloudflare**

   El script de deployment lo hace automáticamente, o manualmente:
   
   ```bash
   # Crear base de datos D1
   wrangler d1 create edificio_admin_db
   
   # Crear KV namespaces
   wrangler kv:namespace create SESSIONS
   wrangler kv:namespace create CACHE
   wrangler kv:namespace create RATE_LIMIT
   
   # Crear bucket R2
   wrangler r2 bucket create edificio-admin-uploads
   ```

4. **Actualizar wrangler.toml** con los IDs generados

5. **Aplicar migraciones**
   ```bash
   npm run migrate
   ```

### Deploy Automático

Usa el script completo de deployment:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Deploy Manual

```bash
# Deploy a producción
npm run deploy

# O para desarrollo local
npm run dev
```

## 🔧 Desarrollo Local

```bash
# Iniciar en modo desarrollo
npm run dev
```

Esto iniciará el worker en `http://localhost:8787` con:
- Hot reload
- Persistencia local de D1 y KV
- Assets servidos desde `./public`

## 📊 Base de Datos

### Esquema D1

El sistema usa Cloudflare D1 (SQLite) con las siguientes tablas principales:

- `buildings` - Edificios/condominios
- `users` - Usuarios del sistema
- `building_users` - Relación usuario-edificio (multi-tenancy)
- `subscriptions` - Subscripciones SAAS
- `payments` - Historial de pagos
- `fees` - Cuotas (datos del edificio)
- `expenses` - Gastos
- Y más...

### Migraciones

Las migraciones están en `migrations/` y se aplican con:

```bash
npm run migrate
```

## 🔐 Variables de Entorno

Configura en `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "development"
JWT_SECRET = "tu-secret-key-super-segura"
EMAIL_SENDER = "notificaciones@tu-dominio.com"
```

Para producción, usa secrets:

```bash
wrangler secret put JWT_SECRET
```

## 📝 Tareas Pendientes

### Handlers a Completar

Usa `CONVERSION_TEMPLATE.md` como guía:

1. [ ] usuarios.js - Gestión de usuarios
2. [ ] cuotas.js - Gestión de cuotas
3. [ ] gastos.js - Registro de gastos
4. [ ] fondos.js - Gestión de fondos
5. [ ] presupuestos.js
6. [ ] cierres.js
7. [ ] anuncios.js
8. [ ] permisos.js
9. [ ] audit.js
10. [ ] solicitudes.js
11. [ ] parcialidades.js

### Modelos a Adaptar

Los modelos deben adaptarse para usar D1 en lugar de `data.js`:

```javascript
// Antes (Express)
static async getAll() {
  const { data } = await import('../data.js');
  return data.usuarios;
}

// Después (Cloudflare Workers)
static async getAll(db) {
  const stmt = db.prepare('SELECT * FROM usuarios');
  const result = await stmt.all();
  return result.results;
}
```

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration
```

## 📖 Documentación Adicional

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [KV Storage](https://developers.cloudflare.com/kv/)
- [R2 Storage](https://developers.cloudflare.com/r2/)

## 🔄 Migración desde Express

Ver `CONVERSION_TEMPLATE.md` para instrucciones detalladas de cómo convertir controllers Express a handlers Cloudflare.

## 📧 Soporte

Para preguntas o problemas, revisa:
1. La documentación de Cloudflare Workers
2. El template de conversión incluido
3. Los ejemplos en los handlers completados

## 📄 Licencia

Privado - Uso interno únicamente
