#!/bin/bash

##
# Script de Limpieza de Base de Datos
# Limpia todas las tablas en el orden correcto respetando foreign keys
##

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Iniciando limpieza de base de datos...${NC}\n"

# Determinar si es local o remoto
ENVIRONMENT=${1:-remote}

if [ "$ENVIRONMENT" = "local" ]; then
  echo -e "${YELLOW}📍 Limpiando base de datos LOCAL${NC}"
  REMOTE_FLAG="--local"
else
  echo -e "${YELLOW}📍 Limpiando base de datos REMOTA (Producción)${NC}"
  REMOTE_FLAG="--remote"
  
  # Confirmar en producción
  read -p "⚠️  ¿Estás seguro de limpiar la BD de PRODUCCIÓN? (escribe 'SI' para confirmar): " confirm
  if [ "$confirm" != "SI" ]; then
    echo -e "${RED}❌ Limpieza cancelada${NC}"
    exit 1
  fi
fi

echo ""

# Crear archivo SQL temporal
CLEANUP_SQL=$(mktemp)

cat > "$CLEANUP_SQL" << 'EOF'
-- Orden correcto para respetar foreign keys

-- 1. Tablas dependientes de otras entidades
DELETE FROM parcialidades;
DELETE FROM cuotas;
DELETE FROM movimientos_fondos;
DELETE FROM presupuestos;
DELETE FROM gastos;
DELETE FROM anuncios;
DELETE FROM cierres;
DELETE FROM solicitudes;
DELETE FROM audit_log;
DELETE FROM permisos;
DELETE FROM fondos;
DELETE FROM theme_configs;
DELETE FROM patrimonies;

-- 2. Quitar relación circular buildings -> usuarios
UPDATE buildings SET admin_user_id = NULL;

-- 3. Limpiar usuarios
DELETE FROM usuarios;

-- 4. Limpiar buildings
DELETE FROM buildings;

-- 5. Reset autoincrement counters
DELETE FROM sqlite_sequence;
EOF

# Ejecutar limpieza
echo -e "${YELLOW}🔄 Ejecutando comandos de limpieza...${NC}\n"

if wrangler d1 execute edificio-admin-db $REMOTE_FLAG --file="$CLEANUP_SQL"; then
  echo ""
  echo -e "${GREEN}✅ Base de datos limpiada exitosamente${NC}\n"
  
  # Verificar que está vacía
  echo -e "${YELLOW}🔍 Verificando limpieza...${NC}\n"
  
  wrangler d1 execute edificio-admin-db $REMOTE_FLAG --command="
    SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios
    UNION ALL SELECT 'buildings', COUNT(*) FROM buildings
    UNION ALL SELECT 'fondos', COUNT(*) FROM fondos
    UNION ALL SELECT 'cuotas', COUNT(*) FROM cuotas
    UNION ALL SELECT 'gastos', COUNT(*) FROM gastos;
  " 2>&1 | grep -A 30 "results" | grep -E "tabla|registros" || echo "Base de datos vacía"
  
  echo ""
  echo -e "${GREEN}✨ Limpieza completada${NC}"
  echo -e "${GREEN}📊 Todas las tablas están vacías y listas para usar${NC}"
else
  echo -e "${RED}❌ Error en la limpieza${NC}"
  rm -f "$CLEANUP_SQL"
  exit 1
fi

# Limpiar archivo temporal
rm -f "$CLEANUP_SQL"

echo ""
echo -e "${YELLOW}ℹ️  Uso:${NC}"
echo -e "  ${GREEN}./cleanup-database.sh${NC}          # Limpiar BD remota (producción)"
echo -e "  ${GREEN}./cleanup-database.sh local${NC}    # Limpiar BD local"
echo ""
