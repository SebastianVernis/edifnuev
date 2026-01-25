# Analysis Scripts

Este directorio contiene scripts de análisis utilizados durante la consolidación de CSS y limpieza de estilos inline.

## Scripts Disponibles

### 1. analyze-css.sh
Analiza el archivo CSS consolidado para obtener estadísticas.

**Uso:**
```bash
bash scripts/analysis/analyze-css.sh
```

**Información que proporciona:**
- Número total de líneas en main.css
- Clases potencialmente duplicadas
- Total de clases únicas
- Total de variables CSS

### 2. analyze-inline-styles.sh
Analiza archivos HTML para encontrar estilos inline.

**Uso:**
```bash
bash scripts/analysis/analyze-inline-styles.sh
```

**Información que proporciona:**
- Estilos inline por archivo
- Total de estilos inline encontrados
- Patrones más comunes

## Archivos Generados Durante el Análisis

- `analyze-css.sh` - Script de análisis CSS
- `analyze-inline-styles.sh` - Script de análisis de estilos inline

## Cómo Usar

1. Navega al directorio del proyecto:
```bash
cd /home/sebastianvernis/Proyectos/edifnuev
```

2. Ejecuta el script deseado:
```bash
bash scripts/analysis/analyze-css.sh
```

## Notas

- Los scripts requieren bash
- Deben ejecutarse desde el directorio raíz del proyecto
- Los scripts son de solo lectura (no modifican archivos)

---

**Fecha**: 2024
**Proyecto**: Edificio Admin
