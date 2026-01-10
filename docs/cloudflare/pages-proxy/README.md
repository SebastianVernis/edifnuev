# 📄 Cloudflare Pages Proxy

**Proxy simple para acceder al Worker con dominio `pages.dev`**

## URL Final
```
https://edificio-admin.pages.dev
```

Redirige a:
```
https://chispartbuilding.pages.dev
```

## Deploy
```bash
npx wrangler pages deploy . --project-name=edificio-admin
```

## Actualizar
```bash
# Editar _worker.js
npx wrangler pages deploy . --project-name=edificio-admin
```
