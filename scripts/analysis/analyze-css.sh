#!/bin/bash

# CSS Analysis Script
# Analiza archivos CSS para encontrar duplicidades

echo "=== CSS Analysis Script ==="
echo ""
echo "Analizando archivos CSS..."
echo ""

# Contar líneas de CSS
echo "📊 Estadísticas de CSS:"
echo ""
echo "Archivo: main.css"
wc -l /home/sebastianvernis/Proyectos/edifnuev/public/css/main.css
echo ""

# Buscar clases duplicadas
echo "🔍 Buscando clases potencialmente duplicadas..."
echo ""
grep -o '\.[a-zA-Z0-9_-]*' /home/sebastianvernis/Proyectos/edifnuev/public/css/main.css | sort | uniq -d | head -20
echo ""

# Contar clases únicas
echo "📈 Total de clases únicas:"
grep -o '\.[a-zA-Z0-9_-]*' /home/sebastianvernis/Proyectos/edifnuev/public/css/main.css | sort -u | wc -l
echo ""

# Buscar variables CSS
echo "🎨 Variables CSS encontradas:"
grep -o '--[a-zA-Z0-9_-]*' /home/sebastianvernis/Proyectos/edifnuev/public/css/main.css | sort -u | wc -l
echo ""

echo "✅ Análisis completado"
