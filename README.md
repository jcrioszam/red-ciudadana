# Red Ciudadana - Sistema de Partido Político

Sistema integral de gestión para partido político con jerarquía de líderes, registro de afiliados/simpatizantes y movilización de eventos.

## 🚀 Características Principales

### Backend (FastAPI + SQLite)
- ✅ **API RESTful completa** con endpoints CRUD
- ✅ **Autenticación JWT** con roles jerárquicos
- ✅ **Base de datos SQLite** optimizada
- ✅ **Control de acceso** por jerarquía de usuarios
- ✅ **Reportes y estadísticas** en tiempo real
- ✅ **Validación de datos** con Pydantic

### Frontend (React + Tailwind CSS)
- ✅ **Interfaz moderna y responsive**
- ✅ **Dashboard con estadísticas**
- ✅ **Gestión de usuarios** (líderes y capturistas)
- ✅ **Registro de personas** (afiliados/simpatizantes)
- ✅ **Gestión de eventos** y asistencias
- ✅ **Reportes avanzados** con gráficos

## 📋 Requisitos

- Python 3.8+
- Node.js 16+
- npm o yarn

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd Red-Ciudadana
```

### 2. Configurar Backend

```bash
cd Backend

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar el servidor
python run.py
```

El backend estará disponible en: http://localhost:8000
- Documentación API: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3. Configurar Frontend

```bash
cd Frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start
```

El frontend estará disponible en: http://localhost:3000

## 🔐 Credenciales de Prueba

- **Email**: `admin@redciudadana.com`
- **Contraseña**: `admin123`

## 📊 Estructura del Sistema

### Roles de Usuario
- **Admin**: Acceso completo al sistema
- **Líder Estatal**: Coordinador estatal
- **Líder Regional**: Coordinador regional/distrital
- **Líder Municipal**: Coordinador municipal
- **Líder de Zona**: Líder de zona/colonia
- **Capturista**: Solo puede registrar personas

### Jerarquía de Líderes
```
Admin
└── Líder Estatal
    └── Líder Regional
        └── Líder Municipal
            └── Líder de Zona
                └── Capturista
```

## 🗄️ Base de Datos

### Tablas Principales
- **usuarios**: Líderes y capturistas
- **personas**: Afiliados y simpatizantes
- **eventos**: Eventos políticos
- **asistencias**: Seguimiento de participación
- **secciones_electorales**: Validación de secciones
- **colonias**: Validación de colonias

## 🔧 Endpoints Principales

### Autenticación
- `POST /token` - Login
- `GET /users/me/` - Información del usuario

### Usuarios
- `GET /users/` - Listar usuarios
- `POST /users/` - Crear usuario
- `PUT /users/{id}` - Actualizar usuario
- `DELETE /users/{id}` - Desactivar usuario

### Personas
- `GET /personas/` - Listar personas
- `POST /personas/` - Registrar persona
- `PUT /personas/{id}` - Actualizar persona
- `GET /personas/buscar/` - Búsqueda avanzada

### Eventos
- `GET /eventos/` - Listar eventos
- `POST /eventos/` - Crear evento
- `PUT /eventos/{id}` - Actualizar evento
- `GET /eventos/buscar/` - Búsqueda avanzada

### Asistencias
- `GET /asistencias/` - Listar asistencias
- `POST /asistencias/` - Registrar asistencia
- `PUT /asistencias/{id}` - Actualizar asistencia

### Reportes
- `GET /reportes/personas` - Estadísticas de personas
- `GET /reportes/eventos` - Estadísticas de eventos

## 🎯 Funcionalidades Clave

### Gestión de Personas
- Registro con datos de INE
- Georreferenciación por sección electoral
- Validación de clave de elector única
- Captura de foto/firma (opcional)

### Gestión de Eventos
- Creación de eventos políticos
- Registro de asistencias
- Seguimiento de movilización
- Reportes de eficiencia

### Reportes y Estadísticas
- Dashboard con métricas en tiempo real
- Gráficos de crecimiento
- Exportación de datos
- Mapas de calor de participación

## 🔒 Seguridad

- **Contraseñas hasheadas** con bcrypt
- **Tokens JWT** para autenticación
- **Control de acceso** por jerarquía
- **Validación de datos** en frontend y backend
- **Soft deletes** para preservar datos

## 🚀 Despliegue

### Backend (Producción)
```bash
cd Backend
pip install -r requirements.txt
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend (Producción)
```bash
cd Frontend
npm run build
# Servir archivos estáticos con nginx o similar
```

## 📝 Próximos Pasos

1. **Integración de mapas** con Leaflet.js
2. **Gráficos avanzados** con Recharts
3. **Exportación a Excel/PDF**
4. **Validación de datos de INE**
5. **Subida de archivos** (fotos/firmas)
6. **Notificaciones push**
7. **Tests unitarios y de integración**

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema, contacta al equipo de desarrollo.

---

**Red Ciudadana** - Sistema de gestión integral para partido político "# Force Vercel redeploy with ESLint fix"  
