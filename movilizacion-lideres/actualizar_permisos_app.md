# 🔄 Actualización de Permisos en la App Móvil

## 🚨 **Problema:**
La opción "Movilizador" no aparece en la app móvil aunque esté activada en la administración de perfiles.

## ✅ **Solución:**

### **1. Cerrar Sesión Completamente:**
1. Ve a **"Perfil"** en la app
2. Toca **"Cerrar Sesión"**
3. **Cierra completamente la app** (swipe up y cierra)

### **2. Limpiar Cache (Opcional):**
1. Ve a **Configuración** del teléfono
2. **Aplicaciones** → **Red Ciudadana**
3. **Almacenamiento** → **Limpiar Cache**
4. **Limpiar Datos** (esto borrará la sesión)

### **3. Reiniciar la App:**
1. **Abre la app** nuevamente
2. **Inicia sesión** con tu cuenta
3. Los permisos se cargarán desde el servidor

## 🔧 **Cambios Realizados:**

### **Backend:**
- ✅ Agregado `movilizador-seguimiento` a las opciones del menú
- ✅ Actualizadas configuraciones por defecto
- ✅ Script ejecutado para actualizar base de datos

### **App Móvil:**
- ✅ Corregido permiso en `DynamicBottomMenu.js`
- ✅ Actualizados permisos por defecto
- ✅ Agregado `movilizador-seguimiento` a roles correspondientes

## 🎯 **Resultado Esperado:**
Después de cerrar sesión y volver a iniciar:
- ✅ **Líder de zona** ve opción "Movilizador" en el menú
- ✅ **Puede acceder** a la pantalla de movilizador
- ✅ **Puede activar** seguimiento como movilizador

## 🚀 **Si aún no funciona:**
1. **Reinicia el backend** (`python run.py`)
2. **Reinicia la app** completamente
3. **Verifica** que el rol tenga el permiso en la web
4. **Contacta** al administrador si persiste el problema 