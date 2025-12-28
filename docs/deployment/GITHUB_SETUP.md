# GitHub Repository Setup

Guía para configurar el repositorio de GitHub correctamente.

## 📋 Información Actual

**Repositorio actual:**
- URL: `https://github.com/SebastianVernis/edifnuev.git`
- Remote: `origin`
- Branch principal: `master`

## 🔄 Cambiar URL del Remoto (Si necesitas)

### Opción 1: Cambiar a nueva organización

```bash
# Cambiar remoto a nueva organización
git remote set-url origin https://github.com/NUEVA_ORG/edificio-admin.git

# Verificar
git remote -v

# Push
git push -u origin master
```

### Opción 2: Agregar remoto adicional

```bash
# Mantener origin actual y agregar nuevo remoto
git remote add production https://github.com/NUEVA_ORG/edificio-admin.git

# Push a ambos
git push origin master
git push production master
```

### Opción 3: Renombrar repositorio en GitHub

1. Ve a Settings en GitHub
2. Repository name → Cambiar nombre
3. Actualizar remoto local:
```bash
git remote set-url origin https://github.com/USER/NUEVO_NOMBRE.git
```

## 🔐 Configurar Secrets para CI/CD

Para usar GitHub Actions con Cloud Run:

### 1. Crear Service Account en GCP

```bash
# Crear service account
gcloud iam service-accounts create github-actions \
  --display-name "GitHub Actions"

# Dar permisos
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Crear key
gcloud iam service-accounts keys create key.json \
  --iam-account github-actions@PROJECT_ID.iam.gserviceaccount.com
```

### 2. Agregar Secrets a GitHub

Ve a: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Agregar:
- **GCP_PROJECT_ID**: Tu project ID de GCP
- **GCP_SA_KEY**: Contenido completo de `key.json`

### 3. Activar Workflow

Editar `.github/workflows/cloud-run-deploy.yml`:
- Descomentar todo el archivo
- Guardar y hacer commit

## 🌿 Branch Protection

Configurar protección del branch master:

1. Ve a `Settings` → `Branches`
2. Add rule para `master`
3. Configurar:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

## 📝 Actualizar package.json

Si cambias organización/nombre:

```bash
# Actualizar package.json
nano package.json

# Buscar y reemplazar:
"repository": {
  "type": "git",
  "url": "git+https://github.com/NUEVA_ORG/NUEVO_NOMBRE.git"
},
"bugs": {
  "url": "https://github.com/NUEVA_ORG/NUEVO_NOMBRE/issues"
},
"homepage": "https://github.com/NUEVA_ORG/NUEVO_NOMBRE#readme"
```

## 🏷️ Tags y Releases

Crear release para deployment:

```bash
# Crear tag
git tag -a v2.0.0 -m "Release v2.0.0: Cloud Run ready"

# Push tag
git push origin v2.0.0

# Crear release en GitHub
gh release create v2.0.0 \
  --title "v2.0.0 - Cloud Run Deployment" \
  --notes "See CHANGELOG.md for details"
```

## 📚 Configurar GitHub Pages (Opcional)

Para documentación:

1. `Settings` → `Pages`
2. Source: `Deploy from a branch`
3. Branch: `master` → `/docs`
4. Save

URL: `https://USUARIO.github.io/REPO/`

## 🔗 Comandos Útiles

```bash
# Ver configuración remota
git remote -v

# Ver branches
git branch -a

# Ver último commit
git log --oneline -1

# Ver status
git status

# Cambiar branch por defecto de master a main
git branch -M main
git push -u origin main

# Luego en GitHub Settings → Branches cambiar default branch
```

## 📊 GitHub Insights

Configurar insights útiles:

- **Traffic**: Ver visitantes y clones
- **Network**: Ver forks y branches
- **Pulse**: Actividad reciente
- **Contributors**: Estadísticas de contribuciones

## 🆘 Problemas Comunes

### Error: Permission denied

```bash
# Verificar SSH key
ssh -T git@github.com

# O usar HTTPS con token
git remote set-url origin https://TOKEN@github.com/USER/REPO.git
```

### Error: Branch diverged

```bash
# Pull primero
git pull origin master --rebase

# Luego push
git push origin master
```

### Error: Large files

```bash
# Ver archivos grandes
git ls-tree -r -t -l --full-name HEAD | sort -n -k 4 | tail -n 10

# Usar Git LFS si necesitas archivos grandes
git lfs install
git lfs track "*.zip"
git lfs track "*.tar.gz"
```

## ✅ Checklist Post-Setup

- [ ] Remoto configurado correctamente
- [ ] Package.json actualizado
- [ ] README con badges correctos
- [ ] Secrets de CI/CD configurados (si aplica)
- [ ] Branch protection configurado
- [ ] .gitignore completo
- [ ] LICENSE agregada
- [ ] CONTRIBUTING.md creado (opcional)
- [ ] Release v2.0.0 creado

---

**Última actualización:** 2025-12-28
