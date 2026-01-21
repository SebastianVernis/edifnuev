#!/bin/bash
# D1 Interactive Shell para Blackbox AI

DB_NAME="edificio-admin-db"
DB_ID="a571aea0-d80d-4846-a31c-9936bddabdf5"

echo "🗄️  Cloudflare D1 Interactive Shell"
echo "📊 Database: $DB_NAME"
echo "🆔 ID: $DB_ID"
echo ""
echo "Comandos disponibles:"
echo "  query <SQL>     - Ejecutar consulta SQL"
echo "  tables          - Listar todas las tablas"
echo "  describe <table> - Ver estructura de tabla"
echo "  users           - Ver todos los usuarios"
echo "  help            - Mostrar ayuda"
echo ""

# Función para ejecutar queries
function d1_query() {
    wrangler d1 execute $DB_NAME --remote --command "$1"
}

# Función para describir tabla
function d1_describe() {
    wrangler d1 execute $DB_NAME --remote --command "PRAGMA table_info($1)"
}

# Función para listar tablas
function d1_tables() {
    wrangler d1 execute $DB_NAME --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name"
}

# Función para ver usuarios
function d1_users() {
    wrangler d1 execute $DB_NAME --remote --command "SELECT id, nombre, email, rol, activo, building_id FROM usuarios ORDER BY id"
}

# Exportar funciones
export -f d1_query d1_describe d1_tables d1_users

echo "Shell listo. Usa las funciones d1_query, d1_tables, d1_describe, d1_users"
