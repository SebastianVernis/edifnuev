# 📦 Archivos CSS Archivados

Este directorio contiene los archivos CSS originales que fueron consolidados en `main.css`.

## ⚠️ Importante

**Estos archivos NO se usan en producción.** Todos los estilos están consolidados en `/public/css/main.css`.

## 📋 Contenido

### Archivos CSS Individuales
- `styles.css` - Estilos base y componentes
- `themes.css` - Sistema de temas
- `dashboard.css` - Estilos del dashboard
- `dashboard-spacing-fix.css` - Correcciones de espaciado
- `dashboard-compact.css` - Versión compacta del dashboard
- `inquilino.css` - Estilos del panel de inquilino
- `file-upload.css` - Estilos de carga de archivos

### Directorio Base
- `base/reset.css` - Reset CSS
- `base/variables.css` - Variables CSS

## 🔄 Cómo Restaurar

Si necesitas restaurar los archivos originales:

```bash
cp -r /archive/css-old/* /public/css/
```

## 📊 Estadísticas

- **Archivos archivados**: 7
- **Directorios archivados**: 1
- **Tamaño total**: ~5.3KB
- **Consolidados en**: main.css (3,100 líneas)

## 📚 Documentación

Ver `ARCHIVED_CSS_INDEX.md` para detalles completos.

---

**Archivado**: 2024
**Proyecto**: Edificio Admin
