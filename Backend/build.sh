#!/bin/bash
# Build script para Render

echo "🚀 Iniciando build del backend Red Ciudadana..."

# Instalar dependencias
pip install -r requirements.txt

echo "📦 Dependencias instaladas"

# Crear directorios necesarios
mkdir -p static/reportes

echo "📁 Directorios creados"

# Ejecutar migraciones si existe DATABASE_URL
if [ ! -z "$DATABASE_URL" ]; then
    echo "🗄️ Ejecutando migraciones a PostgreSQL..."
    python migrate_to_postgres.py
    echo "✅ Migración completada"
else
    echo "⚠️ No hay DATABASE_URL, usando SQLite local"
fi

echo "🎉 Build completado exitosamente"
