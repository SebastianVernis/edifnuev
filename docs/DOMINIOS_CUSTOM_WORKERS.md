# 🌐 Dominios Custom para Cloudflare Workers

**Objetivo:** Acceder al Worker con dominio custom en lugar de `*.workers.dev`

---

## ✅ OPCIONES GRATUITAS

### 1. Cloudflare Pages (GRATIS - Recomendado) ⭐⭐⭐

**Dominio automático:** `edificio-admin.pages.dev`  
**Setup:** 10 minutos desde CLI  
**Costo:** $0

#### Ventajas
- ✅ Dominio gratuito permanente
- ✅ DNS completo de Cloudflare
- ✅ HTTPS automático
- ✅ Sin límites de requests
- ✅ Integrado con Workers

#### Cómo Implementar

**Opción A: Proxy con Pages Function**
```bash
cd /home/admin/edifnuev

# 1. Crear proyecto Pages
mkdir edificio-pages-proxy
cd edificio-pages-proxy

# 2. Crear _worker.js (proxy al Worker)
cat > _worker.js << 'EOF'
export default {
  async fetch(request, env) {
    // Proxy al Worker real
    const workerUrl = 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev';
    const url = new URL(request.url);
    const targetUrl = workerUrl + url.pathname + url.search;
    
    return fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  }
}
EOF

# 3. Deploy a Pages
npx wrangler pages deploy . --project-name=edificio-admin
```

**Resultado:** `https://edificio-admin.pages.dev` → Tu Worker

---

**Opción B: Route en wrangler.toml (mejor)**
```bash
cd saas-migration/edificio-admin-saas-adapted

# Editar wrangler.toml
cat >> wrangler.toml << 'EOF'

# Custom domain via Pages
[env.production]
routes = [
  { pattern = "edificio-admin.pages.dev/*", custom_domain = true }
]
EOF

# Deploy
npx wrangler deploy
```

---

### 2. Subdominios Gratuitos con DNS ⭐⭐

#### is-a.dev
**Dominio:** `edificio-admin.is-a.dev`  
**Setup:** 24-48 hrs (PR en GitHub)  
**Costo:** $0

**Proceso:**
1. Fork: https://github.com/is-a-dev/register
2. PR con archivo JSON
3. Esperar aprobación
4. CNAME a tu Worker

#### js.org
**Dominio:** `edificio-admin.js.org`  
**Setup:** Similar a is-a.dev  
**Costo:** $0

#### eu.org
**Dominio:** `edificio-admin.eu.org`  
**Setup:** Registro manual  
**Costo:** $0

**Limitación:** Todos requieren 24-72 hrs de aprobación

---

### 3. Custom Domain en Cloudflare (INSTANTÁNEO) ⭐⭐⭐

**Si tienes dominio propio:**

```bash
cd saas-migration/edificio-admin-saas-adapted

# Agregar route a wrangler.toml
cat >> wrangler.toml << 'EOF'

# Custom domain
routes = [
  { pattern = "app.tudominio.com/*", zone_name = "tudominio.com" }
]
EOF

# Deploy
npx wrangler deploy

# En Cloudflare Dashboard:
# Workers & Pages → edificio-admin → Settings → Triggers → Custom Domains
# Add: app.tudominio.com
```

**Costo dominio:** ~$10/año (Namecheap, Porkbun, Cloudflare Registrar)

---

## 🎯 COMPARATIVA

| Opción | Costo | Tiempo | CLI | Permanente | Recomendación |
|--------|-------|--------|-----|------------|---------------|
| **Cloudflare Pages** | $0 | 10 min | ✅ | ✅ | ⭐⭐⭐ **MEJOR** |
| **is-a.dev** | $0 | 24-48 hrs | ❌ | ✅ | ⭐⭐ Alternativa |
| **js.org** | $0 | 24-48 hrs | ❌ | ✅ | ⭐ |
| **Dominio propio** | $10/año | 30 min | ✅ | ✅ | ⭐⭐⭐ Producción |
| **workers.dev** | $0 | 0 min | ✅ | ✅ | ⭐ Actual |

---

## 🚀 RECOMENDACIÓN: Cloudflare Pages

### Setup Completo (10 minutos)

```bash
cd /home/admin/edifnuev

# 1. Crear proyecto Pages como proxy
mkdir edificio-pages
cd edificio-pages

cat > _worker.js << 'EOF'
export default {
  async fetch(request, env) {
    const workerUrl = 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev';
    const url = new URL(request.url);
    
    // Construir URL destino
    const targetUrl = new URL(workerUrl);
    targetUrl.pathname = url.pathname;
    targetUrl.search = url.search;
    
    // Proxy request
    return fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  }
}
EOF

# 2. Deploy a Pages
npx wrangler pages deploy . --project-name=edificio-admin

# 3. Resultado
# https://edificio-admin.pages.dev
```

### Ventajas
- ✅ **Instantáneo** (10 minutos)
- ✅ **Gratuito** para siempre
- ✅ **CLI** completo
- ✅ **HTTPS** automático
- ✅ **DNS** de Cloudflare incluido
- ✅ **Sin límites** de requests

### URL Final
```
ANTES: https://edificio-admin-saas-adapted.sebastianvernis.workers.dev
AHORA: https://edificio-admin.pages.dev
```

---

## 🎯 ALTERNATIVA: Subdominio de sebastianvernis.workers.dev

Si tienes dominio `sebastianvernis.com` en Cloudflare:

```bash
# wrangler.toml
routes = [
  { pattern = "app.sebastianvernis.com/*", zone_name = "sebastianvernis.com" }
]

# Dashboard Cloudflare:
# DNS → Add record:
# Type: CNAME
# Name: app
# Target: edificio-admin-saas-adapted.sebastianvernis.workers.dev
```

**Resultado:** `https://app.sebastianvernis.com`

---

## 📋 DECISIÓN RÁPIDA

### Para testing/desarrollo:
**Usar:** `*.workers.dev` (actual) - Funciona perfecto

### Para producción/branding:
**Usar:** Cloudflare Pages (10 min, gratis) ⭐

### Para dominio custom real:
**Registrar:** Dominio propio (~$10/año)

---

## 🔧 ¿Quieres que implemente Cloudflare Pages ahora?

Es la opción más rápida y gratuita para tener dominio custom sin `workers.dev`.

**Comando:**
```bash
cd /home/admin/edifnuev
mkdir edificio-pages && cd edificio-pages
# Creo proxy _worker.js
npx wrangler pages deploy . --project-name=edificio-admin
```

**Resultado en 10 minutos:**
`https://edificio-admin.pages.dev` funcionando

---

**Archivo creado:** `DOMINIOS_CUSTOM_WORKERS.md`
