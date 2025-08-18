# Debug de Movilización - Problemas de Eventos y Vehículos

## Problema Reportado
No aparecen las opciones para seleccionar evento ni vehículo en la parte de movilización.

## Cambios Realizados

### 1. Corrección del archivo `movilizacion.tsx`
- ✅ Reemplazado fetch directo por el objeto `api`
- ✅ Agregado logging detallado para debug
- ✅ Mejorado manejo de errores
- ✅ Agregado información de debug en la UI

### 2. Corrección del archivo `pase-lista.tsx`
- ✅ Reemplazado fetch directo por el objeto `api`
- ✅ Mejorado manejo de errores

### 3. Mejoras en `api.js`
- ✅ Agregado logging detallado para todas las peticiones
- ✅ Mejor manejo de errores HTTP
- ✅ Información de debug en consola

### 4. Configuración centralizada
- ✅ Creado `config.js` para centralizar configuración del servidor
- ✅ Fácil cambio de IP del servidor

### 5. Componente de Debug
- ✅ Creado `DebugInfo.js` para mostrar estado de conexión
- ✅ Botón de debug en pantalla de movilización

## Instrucciones para Debuggear

### Paso 1: Verificar Configuración del Servidor
1. Abre la app en tu dispositivo
2. Ve a la pantalla de Movilización
3. Toca el ícono de bug (🐛) en la esquina superior derecha
4. Revisa la información de debug:
   - **Conectividad**: Debe mostrar "Conectado"
   - **Servidor**: Debe mostrar "En línea"
   - **Token**: Debe mostrar "Presente"
   - **Usuario**: Debe mostrar tu nombre
   - **Rol**: Debe mostrar tu rol

### Paso 2: Verificar Logs en Consola
1. Abre las herramientas de desarrollo de tu dispositivo
2. Ve a la consola de logs
3. Busca mensajes con estos emojis:
   - 🔍 = Intentando cargar datos
   - ✅ = Datos cargados exitosamente
   - ❌ = Error en la operación
   - 🔑 = Información del token
   - 🌐 = Peticiones HTTP

### Paso 3: Verificar IP del Servidor
Si el problema persiste, verifica que la IP del servidor sea correcta:

1. Abre `src/config.js`
2. Cambia la línea:
   ```javascript
   BASE_URL: 'http://192.168.3.14:8000',
   ```
3. Por la IP correcta de tu servidor

### Paso 4: Verificar Endpoints del Servidor
Asegúrate de que estos endpoints estén funcionando en tu servidor:
- `GET /eventos/?activos=true`
- `GET /personas/`
- `GET /vehiculos/`
- `GET /movilizaciones/?evento_id={id}`

## Posibles Causas del Problema

### 1. Problema de Conectividad
- **Síntoma**: Debug muestra "Desconectado"
- **Solución**: Verificar que el dispositivo esté en la misma red que el servidor

### 2. Token Expirado
- **Síntoma**: Debug muestra "Token: Ausente" o errores 401
- **Solución**: Cerrar sesión y volver a iniciar sesión

### 3. Servidor No Disponible
- **Síntoma**: Debug muestra "Servidor: Error"
- **Solución**: Verificar que el servidor esté ejecutándose

### 4. IP Incorrecta
- **Síntoma**: Timeout en las peticiones
- **Solución**: Cambiar la IP en `config.js`

### 5. Endpoints No Implementados
- **Síntoma**: Errores 404 en la consola
- **Solución**: Verificar que los endpoints estén implementados en el backend

## Información de Debug en la UI

La pantalla de movilización ahora muestra:
- Contador de eventos cargados
- Contador de personas cargadas
- Contador de vehículos cargados
- Mensaje cuando no hay eventos disponibles

## Comandos Útiles para Debug

### Verificar conectividad desde el dispositivo:
```bash
ping 192.168.3.14
```

### Verificar puerto del servidor:
```bash
telnet 192.168.3.14 8000
```

### Verificar logs del servidor:
```bash
# En el servidor
tail -f /var/log/your-app.log
```

## Contacto para Soporte

Si el problema persiste después de seguir estos pasos:
1. Toma una captura de pantalla del componente DebugInfo
2. Copia los logs de la consola
3. Proporciona la información de tu dispositivo y red 