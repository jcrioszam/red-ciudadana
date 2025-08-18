# 🚀 Migración a Railway + Vercel

## Problema Resuelto
Render tiene un bug sistemático con CORS que hace imposible el funcionamiento correcto del sistema.

## Nueva Arquitectura
- **Backend**: Railway (FastAPI + PostgreSQL)
- **Frontend**: Vercel (React + Static)

## URLs de la Nueva Infraestructura
- **Backend**: https://red-ciudadana-backend-production.up.railway.app
- **Frontend**: https://red-ciudadana.vercel.app

## Pasos de Migración

### 1. Configurar Railway (Backend)
1. Crear cuenta en [railway.app](https://railway.app)
2. Conectar GitHub repository
3. Seleccionar la carpeta `Backend`
4. Agregar PostgreSQL addon
5. Configurar variables de entorno:
   ```
   DATABASE_URL=(auto-generada por Railway)
   SECRET_KEY=tu_secret_key_super_segura_aqui
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

### 2. Configurar Vercel (Frontend)
1. Crear cuenta en [vercel.com](https://vercel.com)
2. Conectar GitHub repository
3. Seleccionar la carpeta `Frontend`
4. Configurar variables de entorno:
   ```
   REACT_APP_API_URL=https://red-ciudadana-backend-production.up.railway.app
   ```

### 3. Deploy
1. Push los cambios a GitHub
2. Railway y Vercel auto-deployan
3. ¡Sistema funcionando en 5 minutos!

## Ventajas
✅ CORS funciona perfectamente
✅ No hay cold starts molestos
✅ PostgreSQL más rápido
✅ Despliegues más confiables
✅ Mejor monitoreo
✅ Logs más claros

## Credenciales Iniciales
- **Admin**: admin@redciudadana.com / admin123
- **Líder**: lider@redciudadana.com / lider123

## URLs Finales
Después de la migración:
- Frontend: https://red-ciudadana.vercel.app
- Backend: https://red-ciudadana-backend-production.up.railway.app
- Health Check: https://red-ciudadana-backend-production.up.railway.app/health
