# 🚀 Quick Start - Edificio Admin SAAS

## Inicio Rápido en 5 Minutos

### 1. Prerequisitos
```bash
# Instalar Node.js 18+ y npm
node --version  # v18+

# Instalar Wrangler CLI
npm install -g wrangler

# Login en Cloudflare
wrangler login
```

### 2. Instalación
```bash
cd saas-migration/edificio-admin-saas-adapted
npm install
```

### 3. Configuración Local
```bash
# Copiar variables de entorno
cp .dev.vars.example .dev.vars

# Editar .dev.vars con tus valores
nano .dev.vars
```

### 4. Desarrollo Local
```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará en http://localhost:8787
```

## 📋 Checklist de Setup Completo

### Para Desarrollo Local
- [ ] Node.js 18+ instalado
- [ ] Wrangler CLI instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] `.dev.vars` configurado
- [ ] Servidor dev corriendo (`npm run dev`)

### Para Deploy a Cloudflare
- [ ] Cuenta Cloudflare con Workers habilitado
- [ ] Logged in con `wrangler login`
- [ ] D1 database creada
- [ ] KV namespaces creados (SESSIONS, CACHE, RATE_LIMIT)
- [ ] R2 bucket creado (edificio-admin-uploads)
- [ ] IDs actualizados en `wrangler.toml`
- [ ] Migraciones aplicadas (`npm run migrate`)
- [ ] Deploy ejecutado (`npm run deploy`)

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Servidor local con hot-reload

# Deployment
npm run deploy           # Deploy a producción
npm run migrate          # Aplicar migraciones SQL

# Base de datos
wrangler d1 execute edificio_admin_db --local --file=./migrations/0001_initial_schema.sql
wrangler d1 execute edificio_admin_db --local --command="SELECT * FROM usuarios"

# KV (Key-Value)
wrangler kv:key list --namespace-id=YOUR_KV_ID
wrangler kv:key get "key-name" --namespace-id=YOUR_KV_ID

# Logs
wrangler tail            # Ver logs en tiempo real
```

## 🐛 Troubleshooting

### Error: "Database not found"
```bash
# Crear la base de datos
wrangler d1 create edificio_admin_db

# Actualizar database_id en wrangler.toml
```

### Error: "KV namespace not found"
```bash
# Crear namespaces
wrangler kv:namespace create SESSIONS
wrangler kv:namespace create CACHE
wrangler kv:namespace create RATE_LIMIT

# Actualizar IDs en wrangler.toml
```

### Error: "Module not found"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: "Unauthorized"
```bash
# Re-login en Cloudflare
wrangler logout
wrangler login
```

## 📚 Próximos Pasos

1. **Completar Handlers**: Ver `CONVERSION_TEMPLATE.md`
2. **Adaptar Modelos**: Cambiar de `data.js` a D1
3. **Testing**: Probar cada endpoint
4. **Deploy**: Publicar a Cloudflare Workers

## 💬 Soporte

Ver documentación completa en `README.md`
