# Configuración de Mapas - Red Ciudadana

## 🗺️ Opciones Disponibles

### **Opción 1: Sin Google Maps API (Recomendado)**
✅ **Ventajas:**
- **Completamente gratuito**
- No requiere configuración adicional
- Funcionalidad completa de seguimiento
- Mapas básicos pero funcionales

❌ **Limitaciones:**
- Menos detalles de calles
- Sin navegación avanzada
- Calidad de mapas básica

### **Opción 2: Con Google Maps API (Opcional)**
✅ **Ventajas:**
- Mejor calidad de mapas
- Navegación integrada
- Geocodificación más precisa
- Calles y puntos de interés detallados

❌ **Limitaciones:**
- Requiere API key
- Costos después de cierto uso
- Configuración adicional necesaria

## 🚀 Configuración Rápida

### Para empezar inmediatamente (Opción 1):
```bash
# Solo instalar las dependencias básicas
npm install expo-location react-native-maps expo-battery
```

### Para mejor calidad (Opción 2):
1. Obtener API key de Google Cloud Console
2. Configurar en `app.json`
3. Instalar dependencias

## 📱 Funcionalidades Disponibles

### Con OpenStreetMap (Gratuito):
- ✅ Seguimiento en tiempo real
- ✅ Marcadores de ubicación
- ✅ Filtrado por evento y rol
- ✅ Notificaciones
- ✅ Geocodificación básica
- ✅ Zoom y navegación básica

### Con Google Maps (Opcional):
- ✅ Todo lo anterior +
- ✅ Mapas de alta calidad
- ✅ Navegación avanzada
- ✅ Geocodificación precisa
- ✅ Calles detalladas
- ✅ Puntos de interés

## 🔧 Configuración Técnica

### Dependencias Mínimas:
```json
{
  "expo-location": "~18.1.6",
  "react-native-maps": "^1.7.1",
  "expo-battery": "^1.0.0"
}
```

### Permisos Requeridos:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Permitir a Red Ciudadana usar tu ubicación para el seguimiento en tiempo real."
        }
      ]
    ]
  }
}
```

## 💡 Recomendación

**Para empezar**: Usa la **Opción 1** (sin Google Maps API). El sistema funcionará perfectamente para el seguimiento de movilización.

**Para producción**: Considera la **Opción 2** si necesitas mejor calidad de mapas y navegación.

## 🎯 Conclusión

**No es necesario Google Maps API** para el funcionamiento del sistema de seguimiento. Puedes empezar inmediatamente con OpenStreetMap y actualizar a Google Maps más adelante si es necesario. 