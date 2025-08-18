# Funcionalidades de Ubicación y Seguimiento

## Resumen

Se ha implementado un sistema completo de seguimiento en tiempo real para la aplicación móvil de Red Ciudadana, que permite a los líderes y administradores monitorear la ubicación de vehículos y personal durante eventos de movilización.

## Flujo de Funcionamiento

### 1. **Movilizadores** (lider_municipal, lider_zona, lider_seccional, coordinador)
- Acceden a la pantalla **"Movilizador"** desde el menú
- Seleccionan un **evento activo** y un **vehículo asignado**
- **Activan el seguimiento** cuando inician la movilización
- Su ubicación se envía automáticamente cada 30 segundos
- Pueden **detener el seguimiento** cuando finaliza la movilización

### 2. **Líderes** (presidente, lider_estatal, lider_municipal)
- Acceden a **"Ubicación"** para ver lista de vehículos en movilización
- Acceden a **"Mapa"** para visualización en tiempo real
- Pueden **filtrar por evento** y **por rol**
- Reciben **notificaciones** de eventos importantes (batería baja, velocidad alta)

## Características Implementadas

### 1. Hook de Ubicación (`useLocationTracking.ts`)
- **Seguimiento automático**: Actualización de ubicación cada 30 segundos
- **Contexto de movilización**: Vinculación con eventos y vehículos específicos
- **Geocodificación inversa**: Conversión de coordenadas a direcciones legibles
- **Manejo de permisos**: Solicitud automática de permisos de ubicación
- **Estado de batería**: Monitoreo del nivel de batería del dispositivo
- **Manejo de errores**: Gestión robusta de errores de ubicación y red
- **Persistencia**: Verificación del estado de seguimiento al iniciar la app

### 2. Pantalla de Movilizador (`movilizador-seguimiento.tsx`)
- **Selección de evento**: Lista de eventos activos disponibles
- **Selección de vehículo**: Vehículos asignados al evento seleccionado
- **Activación de seguimiento**: Control para iniciar/detener el seguimiento
- **Estado en tiempo real**: Muestra información del seguimiento activo
- **Navegación al mapa**: Acceso directo a la visualización en mapa

### 3. Pantalla de Lista (`ubicacion.tsx`)
- **Vista de lista**: Muestra vehículos en movilización activa
- **Filtros por evento**: Selección de eventos específicos
- **Filtros por rol**: Filtrado dinámico por tipo de líder/administrador
- **Estadísticas**: Contador de vehículos totales, activos y por rol
- **Información detallada**: Coordenadas, velocidad, batería, dirección y timestamp
- **Pull-to-refresh**: Actualización manual de datos
- **Controles de seguimiento**: Botones para iniciar/detener el seguimiento personal

### 4. Pantalla de Mapa (`mapa.tsx`)
- **Mapa interactivo**: Visualización en tiempo real con Google Maps
- **Marcadores personalizados**: Diferentes iconos y colores según el rol
- **Callouts informativos**: Información detallada al tocar marcadores
- **Leyenda**: Explicación de los símbolos del mapa
- **Controles flotantes**: Botones de acción rápida (FAB)
- **Auto-centrado**: El mapa se ajusta automáticamente para mostrar todos los marcadores

### 5. Componente de Mapa (`LocationMap.tsx`)
- **Marcadores dinámicos**: Actualización automática de posiciones
- **Marcador personal**: Indicador especial para la ubicación del usuario
- **Callouts interactivos**: Información detallada de cada vehículo
- **Leyenda integrada**: Explicación visual de los símbolos
- **Responsive**: Se adapta al tamaño de la pantalla

### 6. Sistema de Notificaciones (`LocationNotifications.tsx`)
- **Alertas automáticas**: Detección de eventos importantes
- **Tipos de notificación**:
  - Batería baja (< 20%)
  - Velocidad alta (> 80 km/h)
  - Movimiento de vehículos
  - Nuevos vehículos activos
- **Panel deslizable**: Interfaz no intrusiva
- **Gestión de notificaciones**: Eliminación individual y automática

### 7. Control de Acceso
- **Permisos por rol**: Solo usuarios autorizados pueden acceder
- **Roles de movilizador**: lider_municipal, lider_zona, lider_seccional, coordinador
- **Roles de líder**: admin, presidente, lider_estatal, lider_municipal
- **Pantalla de acceso restringido**: Mensaje informativo para usuarios sin permisos

## Estructura de Archivos

```
hooks/
├── useLocationTracking.ts          # Hook principal de ubicación

components/
├── LocationMap.tsx                 # Componente de mapa interactivo
└── LocationNotifications.tsx       # Sistema de notificaciones

app/(tabs)/
├── ubicacion.tsx                   # Pantalla de lista de ubicaciones
├── mapa.tsx                        # Pantalla de mapa
└── movilizador-seguimiento.tsx     # Pantalla para movilizadores

components/
└── DynamicBottomMenu.js            # Menú con opciones de ubicación
```

## API Endpoints Utilizados

- `POST /ubicacion/actualizar` - Enviar ubicación actual (con contexto de movilización)
- `GET /ubicacion/vehiculos?evento_id={id}` - Obtener ubicaciones de vehículos por evento
- `GET /ubicacion/mi-ubicacion` - Obtener ubicación personal actual
- `GET /eventos/?activos=true` - Obtener eventos activos
- `GET /movilizaciones/?evento_id={id}` - Obtener asignaciones de movilización por evento

## Configuración Requerida

### Dependencias
```json
{
  "expo-location": "~18.1.6",
  "react-native-maps": "^1.7.1",
  "expo-battery": "^1.0.0"
}
```

### Configuración de Mapas

#### Opción 1: Sin Google Maps API (Recomendado para empezar)
- **No requiere configuración adicional**
- Usa OpenStreetMap por defecto
- **Completamente gratuito**
- Funcionalidad completa de seguimiento

#### Opción 2: Con Google Maps API (Opcional)
Si deseas mejor calidad de mapas, puedes configurar Google Maps:

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
    ],
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "TU_API_KEY_AQUI"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "TU_API_KEY_AQUI"
      }
    }
  }
}
```

### Permisos (app.json)
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

## Flujo de Funcionamiento Detallado

### 1. **Inicio de Movilización**
- Movilizador selecciona evento y vehículo
- Activa el seguimiento de ubicación
- Sistema envía ubicación inicial al servidor
- Se inicia el seguimiento automático cada 30 segundos

### 2. **Durante la Movilización**
- Ubicación se actualiza automáticamente
- Geocodificación inversa para obtener dirección
- Monitoreo de batería y velocidad
- Envío de datos al servidor con contexto de movilización

### 3. **Monitoreo por Líderes**
- Líderes pueden ver vehículos activos en tiempo real
- Filtrado por evento y rol
- Notificaciones de eventos importantes
- Visualización en mapa y lista

### 4. **Finalización de Movilización**
- Movilizador detiene el seguimiento
- Sistema deja de enviar ubicaciones
- Datos se mantienen para historial

## Características Técnicas

### Performance
- **Actualización eficiente**: Solo se actualizan los datos necesarios
- **Caché local**: Almacenamiento temporal de ubicaciones
- **Optimización de red**: Envío solo cuando hay cambios significativos
- **Filtrado por evento**: Reduce la cantidad de datos transferidos

### Seguridad
- **Autenticación**: Todas las peticiones incluyen token de autenticación
- **Autorización**: Control de acceso basado en roles
- **Validación**: Verificación de datos antes del envío
- **Contexto de movilización**: Solo se envían datos cuando es necesario

### UX/UI
- **Diseño responsive**: Adaptable a diferentes tamaños de pantalla
- **Feedback visual**: Indicadores de estado y carga
- **Accesibilidad**: Controles intuitivos y claros
- **Modo offline**: Funcionalidad básica sin conexión
- **Filtros intuitivos**: Selección fácil de eventos y roles

## Próximas Mejoras

1. **Rutas y navegación**: Mostrar rutas entre puntos
2. **Histórico de ubicaciones**: Ver trayectorias pasadas
3. **Geofencing**: Alertas cuando vehículos entran/salen de zonas
4. **Modo offline mejorado**: Sincronización cuando se recupera conexión
5. **Exportación de datos**: Generar reportes de ubicación
6. **Configuración personalizada**: Ajustar intervalos de actualización
7. **Integración con mapas externos**: Abrir ubicaciones en apps externas
8. **Chat en tiempo real**: Comunicación entre movilizadores y líderes
9. **Alertas de emergencia**: Sistema de pánico para situaciones críticas
10. **Análisis de rutas**: Optimización de rutas de movilización

## Troubleshooting

### Problemas Comunes

1. **Ubicación no se actualiza**:
   - Verificar permisos de ubicación
   - Comprobar conexión a internet
   - Revisar logs de la aplicación

2. **Mapa no carga**:
   - Verificar API key de Google Maps
   - Comprobar conexión a internet
   - Reiniciar la aplicación

3. **Notificaciones no aparecen**:
   - Verificar configuración de notificaciones del sistema
   - Comprobar que la app esté en primer plano
   - Revisar logs de errores

4. **No aparecen vehículos en movilización**:
   - Verificar que haya eventos activos
   - Comprobar que los movilizadores hayan activado el seguimiento
   - Revisar permisos de usuario

### Logs Útiles
```javascript
// Habilitar logs detallados
console.log('Ubicación actual:', location);
console.log('Vehículos cargados:', vehicles.length);
console.log('Estado de seguimiento:', isTracking);
console.log('Evento seleccionado:', selectedEvento);
console.log('Contexto de movilización:', movilizacionContext);
``` 