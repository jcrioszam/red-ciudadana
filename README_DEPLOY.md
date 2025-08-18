# 🚀 GUÍA DE DESPLIEGUE EN RENDER - RED CIUDADANA

## 📋 Preparación Completada

### ✅ **Backend Preparado**
- ✅ Configuración de PostgreSQL
- ✅ Variables de entorno configuradas
- ✅ CORS actualizado para producción
- ✅ Script de migración creado
- ✅ Requirements.txt actualizado

### ✅ **Frontend Preparado**
- ✅ API URL dinámica configurada
- ✅ Timeout aumentado para Render
- ✅ Proxy removido
- ✅ Configuración de producción

---

## 🔧 **PASOS PARA DESPLEGAR EN RENDER**

### **1. Preparar Repositorio Git**
```bash
# En la carpeta raíz del proyecto
git init
git add .
git commit -m "Preparación inicial para despliegue en Render"

# Subir a GitHub (crear repositorio nuevo)
git remote add origin https://github.com/TU_USUARIO/red-ciudadana.git
git branch -M main
git push -u origin main
```

### **2. Desplegar Backend en Render**

1. **Ir a [render.com](https://render.com) y crear cuenta**
2. **Crear nuevo Web Service:**
   - Connect GitHub repository
   - Seleccionar repositorio `red-ciudadana`
   - **Root Directory:** `Backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Configurar Variables de Entorno:**
   ```
   SECRET_KEY = [Auto-generate o usar: mi-super-clave-secreta-2024]
   ALGORITHM = HS256
   ACCESS_TOKEN_EXPIRE_MINUTES = 60
   ```

4. **Crear Base de Datos PostgreSQL:**
   - En dashboard de Render: "New" → "PostgreSQL"
   - Nombre: `red-ciudadana-db`
   - Conectar automáticamente con el backend

### **3. Desplegar Frontend en Render**

1. **Crear nuevo Static Site:**
   - Connect mismo repository
   - **Root Directory:** `Frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`

2. **Configurar Variables de Entorno Frontend:**
   ```
   REACT_APP_API_URL = https://TU-BACKEND-URL.onrender.com
   GENERATE_SOURCEMAP = false
   ```

### **4. Actualizar URLs en Backend**

Una vez que tengas las URLs de Render, actualizar `Backend/app/main.py`:
```python
origins = [
    "http://localhost:3000",
    "https://TU-FRONTEND-URL.onrender.com",  # ← Actualizar aquí
    "https://TU-BACKEND-URL.onrender.com",   # ← Actualizar aquí
]
```

---

## 🗄️ **MIGRACIÓN DE DATOS**

### **Opción 1: Migración Automática (Recomendada)**
El script `migrate_to_postgres.py` se ejecutará automáticamente si hay `DATABASE_URL`.

### **Opción 2: Migración Manual**
```bash
# Subir archivo SQLite y ejecutar script manualmente
python migrate_to_postgres.py
```

---

## 🔍 **VERIFICACIÓN POST-DESPLIEGUE**

### **Backend Tests:**
- ✅ `https://tu-backend.onrender.com/docs` - Swagger UI
- ✅ `https://tu-backend.onrender.com/` - Health check
- ✅ `https://tu-backend.onrender.com/usuarios/` - API test

### **Frontend Tests:**
- ✅ Login funcional
- ✅ Dashboard carga datos
- ✅ Crear personas/eventos
- ✅ Subir reportes con imágenes

---

## ⚡ **PROBLEMAS COMUNES**

### **Backend lento en primera carga:**
```
Render pone en "sleep" apps gratuitas después de 15 min de inactividad.
Primera carga puede tardar 1-2 minutos.
```

### **Error de CORS:**
```
Verificar que las URLs en origins[] estén correctas.
Usar HTTPS, no HTTP en producción.
```

### **Error de base de datos:**
```
Verificar que DATABASE_URL esté configurada.
Ejecutar migración manual si es necesario.
```

---

## 📱 **PRÓXIMOS PASOS**

1. **✅ Desplegar Backend + Base de datos**
2. **✅ Desplegar Frontend**
3. **✅ Configurar dominio personalizado (opcional)**
4. **✅ Configurar SSL/HTTPS (automático en Render)**
5. **✅ Monitoreo y logs**

---

## 🎯 **URLs FINALES**

```
Backend:  https://red-ciudadana-backend.onrender.com
Frontend: https://red-ciudadana-frontend.onrender.com
Docs:     https://red-ciudadana-backend.onrender.com/docs
```

¡El sistema estará disponible 24/7 desde cualquier dispositivo con internet! 🌐
