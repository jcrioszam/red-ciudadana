#!/bin/bash

echo "🚀 Iniciando build de producción para Railway..."

# Configurar variables de entorno para Railway
export REACT_APP_API_URL=https://red-ciudadana-production.up.railway.app
export REACT_APP_ENVIRONMENT=production
export REACT_APP_BACKEND_URL=https://red-ciudadana-production.up.railway.app

echo "🔧 Variables de entorno configuradas:"
echo "  REACT_APP_API_URL: $REACT_APP_API_URL"
echo "  REACT_APP_ENVIRONMENT: $REACT_APP_ENVIRONMENT"
echo "  REACT_APP_BACKEND_URL: $REACT_APP_BACKEND_URL"

# Limpiar build anterior
echo "🧹 Limpiando build anterior..."
rm -rf build

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --legacy-peer-deps

# Crear build de producción
echo "🔨 Creando build de producción..."
npm run build

# Verificar que el build se creó correctamente
if [ -d "build" ]; then
    echo "✅ Build creado exitosamente en el directorio 'build'"
    echo "📁 Contenido del directorio build:"
    ls -la build/
    
    # Verificar archivos críticos
    if [ -f "build/index.html" ]; then
        echo "✅ index.html encontrado"
    else
        echo "❌ index.html NO encontrado"
    fi
    
    if [ -f "build/static/js/main.*.js" ]; then
        echo "✅ JavaScript principal encontrado"
    else
        echo "❌ JavaScript principal NO encontrado"
    fi
    
    if [ -f "build/static/css/main.*.css" ]; then
        echo "✅ CSS principal encontrado"
    else
        echo "❌ CSS principal NO encontrado"
    fi
    
else
    echo "❌ Error: No se pudo crear el build"
    exit 1
fi

echo "🎉 Build completado exitosamente!"
echo "🚀 Listo para desplegar en Vercel"

